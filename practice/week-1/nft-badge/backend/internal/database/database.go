package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type ClaimStatus string

const (
	StatusPending   ClaimStatus = "pending"
	StatusRejected  ClaimStatus = "rejected"
	StatusMinted    ClaimStatus = "minted"
)

type Claim struct {
	ID        int64     `json:"id"`
	UserAddr  string    `json:"user_addr"`
	TypeID    uint64    `json:"type_id"`
	Note      string    `json:"note"`
	Status    ClaimStatus `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	TxHash    string    `json:"tx_hash,omitempty"`
}

type Database struct {
	db *sql.DB
}

func New(path string) (*Database, error) {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	d := &Database{db: db}
	if err := d.initSchema(); err != nil {
		db.Close()
		return nil, err
	}
	return d, nil
}

func (d *Database) initSchema() error {
	_, err := d.db.Exec(`
		CREATE TABLE IF NOT EXISTS claims (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			user_addr   TEXT NOT NULL,
			type_id     INTEGER NOT NULL,
			note        TEXT DEFAULT '',
			status      TEXT NOT NULL DEFAULT 'pending',
			created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			tx_hash     TEXT DEFAULT ''
		);
		CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
		CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_addr);
	`)
	return err
}

func (d *Database) Close() error {
	return d.db.Close()
}

// CreateClaim inserts a new claim record.
func (d *Database) CreateClaim(userAddr string, typeId uint64, note string) (*Claim, error) {
	now := time.Now().UTC()
	res, err := d.db.Exec(
		"INSERT INTO claims (user_addr, type_id, note, status, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?)",
		userAddr, typeId, note, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("create claim: %w", err)
	}

	id, _ := res.LastInsertId()
	return &Claim{
		ID:        id,
		UserAddr:  userAddr,
		TypeID:    typeId,
		Note:      note,
		Status:    StatusPending,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// GetPendingClaims returns paginated claims with optional filters.
func (d *Database) GetPendingClaims(page, pageSize int, status, userAddr string) ([]Claim, int, error) {
	if page < 1 { page = 1 }
	if pageSize < 1 { pageSize = 20 }
	if pageSize > 100 { pageSize = 100 }
	offset := (page - 1) * pageSize

	query := "SELECT id, user_addr, type_id, note, status, created_at, updated_at, tx_hash FROM claims WHERE 1=1"
	countQuery := "SELECT COUNT(*) FROM claims WHERE 1=1"
	args := []interface{}{}
	countArgs := []interface{}{}

	if status != "" {
		query += " AND status = ?"
		countQuery += " AND status = ?"
		args = append(args, status)
		countArgs = append(countArgs, status)
	}
	if userAddr != "" {
		query += " AND user_addr LIKE ?"
		countQuery += " AND user_addr LIKE ?"
		args = append(args, "%"+userAddr+"%")
		countArgs = append(countArgs, "%"+userAddr+"%")
	}

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	rows, err := d.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query claims: %w", err)
	}
	defer rows.Close()

	var claims []Claim
	for rows.Next() {
		var c Claim
		err := rows.Scan(&c.ID, &c.UserAddr, &c.TypeID, &c.Note, &c.Status, &c.CreatedAt, &c.UpdatedAt, &c.TxHash)
		if err != nil {
			return nil, 0, fmt.Errorf("scan claim: %w", err)
		}
		claims = append(claims, c)
	}

	var total int
	err = d.db.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count claims: %w", err)
	}

	return claims, total, nil
}

// GetClaimByID returns a single claim by ID.
func (d *Database) GetClaimByID(id int64) (*Claim, error) {
	var c Claim
	err := d.db.QueryRow(
		"SELECT id, user_addr, type_id, note, status, created_at, updated_at, tx_hash FROM claims WHERE id = ?", id,
	).Scan(&c.ID, &c.UserAddr, &c.TypeID, &c.Note, &c.Status, &c.CreatedAt, &c.UpdatedAt, &c.TxHash)
	if err != nil {
		return nil, fmt.Errorf("get claim by id: %w", err)
	}
	return &c, nil
}

// GetLatestClaimByUserAndType returns the most recent claim for a user+badge.
func (d *Database) GetLatestClaimByUserAndType(userAddr string, typeID uint64) (*Claim, error) {
	var c Claim
	err := d.db.QueryRow(
		"SELECT id, user_addr, type_id, note, status, created_at, updated_at, tx_hash FROM claims WHERE user_addr = ? AND type_id = ? ORDER BY created_at DESC LIMIT 1",
		userAddr, typeID,
	).Scan(&c.ID, &c.UserAddr, &c.TypeID, &c.Note, &c.Status, &c.CreatedAt, &c.UpdatedAt, &c.TxHash)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get claim by user+type: %w", err)
	}
	return &c, nil
}

// UpdateClaimStatus updates the status and optionally tx_hash of a claim.
func (d *Database) UpdateClaimStatus(id int64, status ClaimStatus, txHash string) error {
	now := time.Now().UTC()
	_, err := d.db.Exec(
		"UPDATE claims SET status = ?, tx_hash = ?, updated_at = ? WHERE id = ?",
		status, txHash, now, id,
	)
	return err
}
