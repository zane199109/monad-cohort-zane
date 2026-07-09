#!/bin/bash
# Batch create all missing badge types (2-11) on Monad Testnet
# Usage: source .env && bash create-all-badges.sh

CONTRACT="0x56c26B4Cb480f606AA030BFF6CA3b3887a5673CC"
RPC="https://testnet-rpc.monad.xyz/"

declare -a NAMES=(
  "Week 2 Builder"
  "Cohort Graduate"
  "Hackathon Participant"
  "Hackathon Finalist"
  "Hackathon Winner"
  "First PR"
  "Doc Contributor"
  "Core Contributor"
  "Workshop Speaker"
  "Evangelist"
)

declare -a DESCS=(
  "Completed Week 2: smart contract patterns + testing"
  "Finished all 4 weeks of the Monad Cohort"
  "Submitted a project to a Monad hackathon"
  "Top 10 finalist in a Monad hackathon"
  "Won 1st place in a Monad hackathon track"
  "Merged your first PR to a Monad ecosystem repo"
  "Contributed meaningful documentation"
  "Recognized as a core contributor"
  "Hosted a workshop about Monad"
  "Recognized Monad evangelist"
)

declare -a URIS=(
  "ipfs://QmWeek2Badge"
  "ipfs://QmGradBadge"
  "ipfs://QmHackPartBadge"
  "ipfs://QmHackFinalBadge"
  "ipfs://QmHackWinBadge"
  "ipfs://QmFirstPRBadge"
  "ipfs://QmDocBadge"
  "ipfs://QmCoreBadge"
  "ipfs://QmWorkshopBadge"
  "ipfs://QmEvangelistBadge"
)

for i in "${!NAMES[@]}"; do
  TYPE_ID=$((i + 2))
  echo "Creating typeId=$TYPE_ID: ${NAMES[$i]}"
  cast send "$CONTRACT" "createBadgeType(string,string,string)(uint256)" \
    "${NAMES[$i]}" "${DESCS[$i]}" "${URIS[$i]}" \
    --rpc-url "$RPC" --private-key "$PRIVATE_KEY" -vvv
  echo "---"
done

echo "All badge types created!"
