#!/usr/bin/env bash
# =============================================================================
# NFT Badge — Monad Testnet deploy + interact
# =============================================================================
# Usage (pick ONE of two ways to provide secrets):
#
#   Way A (recommended): write .env once, reuse forever
#     cp .env.example .env
#     # edit .env, fill in PRIVATE_KEY and MONAD_RPC_URL
#     bash deploy.sh
#
#   Way B (one-shot, key stays in shell memory only):
#     export PRIVATE_KEY=0x...
#     bash deploy.sh
#
# Precedence: shell env var > .env file > placeholder.
# .env is gitignored — never committed.
# =============================================================================

set -euo pipefail

cd "$(dirname "$0")"

# --- 1. Load .env if it exists (does NOT override already-exported vars) ---
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# --- 2. Resolve config (shell env > .env > defaults) ---
# Placeholder used to detect "not set anywhere".
PLACEHOLDER_PK="0x0000000000000000000000000000000000000000000000000000000000000000"
PRIVATE_KEY="${PRIVATE_KEY:-$PLACEHOLDER_PK}"
# Normalize: ensure 0x prefix (Foundry's vm.envUint requires it)
case "$PRIVATE_KEY" in
  0x*) ;;
  *)  PRIVATE_KEY="0x$PRIVATE_KEY" ;;
esac
RPC_URL="${MONAD_RPC_URL:-https://testnet-rpc.monad.xyz/}"
WALLET_ADDR="0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C"

echo "=========================================="
echo " 0. Pre-checks"
echo "=========================================="
[ "$PRIVATE_KEY" = "$PLACEHOLDER_PK" ] && {
  echo "ERROR: PRIVATE_KEY not set."
  echo "  Either: write it in .env  (cp .env.example .env)"
  echo "  Or:     export PRIVATE_KEY=0x... before running this script."
  exit 1
}

echo "Balance of $WALLET_ADDR:"
cast balance "$WALLET_ADDR" --rpc-url "$RPC_URL" | awk '{print "  " $1 " wei"}'

echo
echo "=========================================="
echo " 1. Compile"
echo "=========================================="
forge build

echo
echo "=========================================="
echo " 2. Deploy (--broadcast)"
echo "=========================================="
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  -vvv 2>&1 | tee deploy.log

# Extract deployed address from the log
CONTRACT_ADDR=$(grep -oE "NFTBadge deployed at: 0x[0-9a-fA-F]{40}" deploy.log | head -1 | awk '{print $NF}')

if [ -z "$CONTRACT_ADDR" ]; then
  echo "ERROR: could not parse contract address from deploy.log"
  echo "Check deploy.log manually."
  exit 1
fi

echo
echo "=========================================="
echo " 3. Deploy result"
echo "=========================================="
echo "Contract address: $CONTRACT_ADDR"
echo "Explorer:         https://testnet.monadexplorer.com/address/$CONTRACT_ADDR"

# Extract deploy tx hash from broadcast dir
DEPLOY_TX=$(jq -r '.receipts[0].transactionHash' \
  "broadcast/Deploy.s.sol/10143/run-latest.json" 2>/dev/null || echo "")
echo "Deploy tx hash:    $DEPLOY_TX"
[ -n "$DEPLOY_TX" ] && echo "Tx explorer:       https://testnet.monadexplorer.com/tx/$DEPLOY_TX"

echo
echo "=========================================="
echo " 4. Read functions (no gas, no tx)"
echo "=========================================="
echo "name()       = $(cast call "$CONTRACT_ADDR" 'name()(string)' --rpc-url "$RPC_URL")"
echo "symbol()     = $(cast call "$CONTRACT_ADDR" 'symbol()(string)' --rpc-url "$RPC_URL")"
echo "owner()      = $(cast call "$CONTRACT_ADDR" 'owner()(address)' --rpc-url "$RPC_URL")"
echo "nextBadgeTypeId() = $(cast call "$CONTRACT_ADDR" 'nextBadgeTypeId()(uint256)' --rpc-url "$RPC_URL")"
echo "nextTokenId()     = $(cast call "$CONTRACT_ADDR" 'nextTokenId()(uint256)' --rpc-url "$RPC_URL")"
echo "hasBadge(self, 0) = $(cast call "$CONTRACT_ADDR" 'hasBadge(address,uint256)(bool)' "$WALLET_ADDR" 0 --rpc-url "$RPC_URL")"

echo
echo "=========================================="
echo " 5. Write function 1: createBadgeType"
echo "=========================================="
CREATE_TX=$(cast send "$CONTRACT_ADDR" \
  'createBadgeType(string,string,string)(uint256)' \
  'Week1' 'finish week1' 'ipfs://QmWeek1Badge' \
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
  --json | jq -r '.transactionHash')
echo "createBadgeType tx: $CREATE_TX"
echo "Tx explorer:        https://testnet.monadexplorer.com/tx/$CREATE_TX"

TYPE_ID=$(cast call "$CONTRACT_ADDR" 'nextBadgeTypeId()(uint256)' --rpc-url "$RPC_URL")
TYPE_ID=$((TYPE_ID - 1))
echo "Created typeId = $TYPE_ID"

echo
echo "=========================================="
echo " 6. Write function 2: mint"
echo "=========================================="
MINT_TX=$(cast send "$CONTRACT_ADDR" \
  'mint(address,uint256)(uint256)' \
  "$WALLET_ADDR" "$TYPE_ID" \
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
  --json | jq -r '.transactionHash')
echo "mint tx:      $MINT_TX"
echo "Tx explorer:  https://testnet.monadexplorer.com/tx/$MINT_TX"

echo
echo "=========================================="
echo " 7. Verify after mint"
echo "=========================================="
echo "hasBadge(self, $TYPE_ID) = $(cast call "$CONTRACT_ADDR" 'hasBadge(address,uint256)(bool)' "$WALLET_ADDR" "$TYPE_ID" --rpc-url "$RPC_URL")"
echo "nextTokenId()            = $(cast call "$CONTRACT_ADDR" 'nextTokenId()(uint256)' --rpc-url "$RPC_URL")"

echo
echo "=========================================="
echo " 8. Summary — paste these into your task doc"
echo "=========================================="
cat <<EOF
# --- paste into tasks/general/week-1/monad-testnet-deploy.md ---

## 3.1 合约地址
$CONTRACT_ADDR
https://testnet.monadexplorer.com/address/$CONTRACT_ADDR

## 3.2 部署交易 hash
$DEPLOY_TX
https://testnet.monadexplorer.com/tx/$DEPLOY_TX

## 4.2 Write function tx hash
createBadgeType tx: $CREATE_TX
mint tx:            $MINT_TX

EOF

echo "Done. Full log saved to deploy.log"
