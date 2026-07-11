package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"nft-badge-backend/internal/database"
	"nft-badge-backend/internal/handler"
	"nft-badge-backend/internal/service"
)

// loadEnv reads a .env file and sets environment variables.
func loadEnv(path string) {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return // .env not found, skip
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		os.Setenv(key, val)
	}
}

func main() {
	// Load .env from current working directory
	loadEnv(".env")

	// Config
	rpcURL := getEnvOr("MONAD_RPC_URL", "https://testnet-rpc.monad.xyz/")
	privateKey := getEnvOr("PRIVATE_KEY", "")
	if privateKey == "" {
		log.Fatal("PRIVATE_KEY not set (check .env)")
	}
	contractAddr := getEnvOr("CONTRACT_ADDRESS", "0xA4A736984104c206f9de526C4c782e9029DF5641")
	serverAddr := getEnvOr("SERVER_ADDR", ":8082")

	// Init database
	dbPath := getEnvOr("DB_PATH", "nft-badge.db")
	db, err := database.New(dbPath)
	if err != nil {
		log.Fatalf("init database: %v", err)
	}
	defer db.Close()

	// Init chain client
	chain := service.NewChainClient(rpcURL, privateKey, contractAddr)

	// Init handler
	h := handler.New(db, chain)

	// Routes
	mux := http.NewServeMux()

	// CORS middleware for dev (frontend 8080 → backend 8082)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		mux.ServeHTTP(w, r)
	})

	// API routes
	mux.HandleFunc("/api/claims", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			h.SubmitClaim(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/claims/pending", h.PendingClaims)
	mux.HandleFunc("/api/claims/check", h.CheckClaim)
	mux.HandleFunc("/api/claims/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h.ApproveClaim(w, r)
	})

	// Static files: serve frontend
	fs := http.FileServer(http.Dir("../frontend"))
	mux.Handle("/", fs)

	// Admin panel
	adminFS := http.FileServer(http.Dir("web/admin"))
	mux.Handle("/admin/", http.StripPrefix("/admin/", adminFS))
	mux.HandleFunc("/admin", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "web/admin/index.html")
	})

	addr := "http://localhost" + serverAddr
	fmt.Printf("Server starting at %s\n", addr)
	fmt.Printf("Admin panel: %s/admin\n", addr)
	fmt.Printf("Contract: %s\n", contractAddr)
	fmt.Printf("RPC: %s\n", rpcURL)

	if err := http.ListenAndServe(serverAddr, handler); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func getEnvOr(key, def string) string {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	return v
}
