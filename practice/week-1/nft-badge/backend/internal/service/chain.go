package service

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
)

// NFTBadgeABI is the minimal ABI for mint.
var NFTBadgeABI = `[{"type":"function","name":"mint","inputs":[{"name":"to","type":"address"},{"name":"typeId","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"nonpayable"}]`

type ChainClient struct {
	rpcURL       string
	privateKey   string
	contractAddr string
}

func NewChainClient(rpcURL, privateKey, contractAddr string) *ChainClient {
	return &ChainClient{
		rpcURL:       rpcURL,
		privateKey:   privateKey,
		contractAddr: contractAddr,
	}
}

// Mint calls the NFTBadge contract via cast send.
func (c *ChainClient) Mint(userAddr string, typeId uint64) (string, error) {
	cmd := exec.Command("cast", "send",
		c.contractAddr,
		"mint(address,uint256)",
		strings.ToLower(userAddr),
		fmt.Sprintf("%d", typeId),
		"--private-key", c.privateKey,
		"--rpc-url", c.rpcURL,
		"--json",
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("cast send failed: %s: %w", string(output), err)
	}

	var result struct {
		TransactionHash string `json:"transactionHash"`
	}
	if err := json.Unmarshal(output, &result); err != nil {
		return "", fmt.Errorf("parse cast output: %w", err)
	}

	if result.TransactionHash == "" {
		return "", fmt.Errorf("empty tx hash from cast output: %s", string(output))
	}

	return result.TransactionHash, nil
}

// IsMinter checks if an address is authorized as a minter.
func (c *ChainClient) IsMinter(addr string) (bool, error) {
	cmd := exec.Command("cast", "call",
		c.contractAddr,
		"isMinter(address)(bool)",
		strings.ToLower(addr),
		"--rpc-url", c.rpcURL,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, fmt.Errorf("cast call failed: %s: %w", string(output), err)
	}

	return strings.TrimSpace(string(output)) == "true", nil
}
