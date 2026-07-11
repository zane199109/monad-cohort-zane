package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"nft-badge-backend/internal/database"
	"nft-badge-backend/internal/service"
)

type Handler struct {
	db     *database.Database
	chain  *service.ChainClient
}

func New(db *database.Database, chain *service.ChainClient) *Handler {
	return &Handler{db: db, chain: chain}
}

// SubmitClaim handles POST /api/claims
func (h *Handler) SubmitClaim(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserAddr string `json:"user_addr"`
		TypeID   uint64 `json:"type_id"`
		Note     string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.UserAddr == "" {
		http.Error(w, "user_addr is required", http.StatusBadRequest)
		return
	}

	claim, err := h.db.CreateClaim(req.UserAddr, req.TypeID, req.Note)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(claim)
}

// PendingClaims handles GET /api/claims/pending?page=N&pageSize=M&status=S&addr=A
func (h *Handler) PendingClaims(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 { page = 1 }
	pageSize, _ := strconv.Atoi(q.Get("pageSize"))
	if pageSize < 1 { pageSize = 20 }
	status := q.Get("status")
	addr := q.Get("addr")

	claims, total, err := h.db.GetPendingClaims(page, pageSize, status, addr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp := map[string]interface{}{
		"data":     claims,
		"page":     page,
		"pageSize": pageSize,
		"total":    total,
		"pages":    (total + pageSize - 1) / pageSize,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// CheckClaim handles GET /api/claims/check?user_addr=X&type_id=Y
func (h *Handler) CheckClaim(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userAddr := r.URL.Query().Get("user_addr")
	typeIDStr := r.URL.Query().Get("type_id")
	if userAddr == "" || typeIDStr == "" {
		http.Error(w, "user_addr and type_id required", http.StatusBadRequest)
		return
	}
	typeID, err := strconv.ParseUint(typeIDStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid type_id", http.StatusBadRequest)
		return
	}

	claim, err := h.db.GetLatestClaimByUserAndType(userAddr, typeID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if claim == nil {
		w.Write([]byte(`{"status":""}`))
		return
	}
	json.NewEncoder(w).Encode(map[string]string{
		"status": string(claim.Status),
		"id":     fmt.Sprintf("%d", claim.ID),
	})
}

// ApproveClaim handles POST /api/claims/:id/approve or /api/claims/:id/reject
func (h *Handler) ApproveClaim(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from URL path: /api/claims/:id/approve or /api/claims/:id/reject
	var id int64
	var action string
	n, err := fmt.Sscanf(r.URL.Path, "/api/claims/%d/approve", &id)
	if n == 0 || err != nil {
		n, err = fmt.Sscanf(r.URL.Path, "/api/claims/%d/reject", &id)
		action = "reject"
	} else {
		action = "approve"
	}
	if err != nil || id <= 0 {
		http.Error(w, "invalid claim ID", http.StatusBadRequest)
		return
	}

	claim, err := h.db.GetClaimByID(id)
	if err != nil {
		http.Error(w, "claim not found", http.StatusNotFound)
		return
	}

	if claim.Status != database.StatusPending {
		http.Error(w, "claim is not pending", http.StatusBadRequest)
		return
	}

	if action == "approve" {
		// Call chain to mint
		txHash, err := h.chain.Mint(claim.UserAddr, claim.TypeID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// Update claim status
		if err := h.db.UpdateClaimStatus(id, database.StatusMinted, txHash); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		resp := map[string]interface{}{
			"id":        claim.ID,
			"status":    string(database.StatusMinted),
			"tx_hash":   txHash,
			"user_addr": claim.UserAddr,
			"type_id":   claim.TypeID,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	} else {
		// Reject
		if err := h.db.UpdateClaimStatus(id, database.StatusRejected, ""); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		resp := map[string]interface{}{
			"id":     claim.ID,
			"status": string(database.StatusRejected),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
