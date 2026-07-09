// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NFTBadge.sol";

/// @notice Deployment script for NFTBadge on Monad Testnet.
/// @dev Run with:
///        forge script script/Deploy.s.sol:Deploy \\
///          --rpc-url $MONAD_RPC_URL \\
///          --broadcast \\
///          --verify \\
///          --etherscan-api-key $MONAD_EXPLORER_API_KEY \\
///          -vvv
contract Deploy is Script {
    // NFT collection metadata — change as needed.
    string constant NAME = "CourseBadge";
    string constant SYMBOL = "CB";

    function run() external returns (NFTBadge badge) {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPk);

        badge = new NFTBadge(NAME, SYMBOL);

        vm.stopBroadcast();

        // console output is shown only with -v flags, not stored on-chain
        console.log("NFTBadge deployed at:", address(badge));
        console.log("Owner (deployer):", badge.owner());
    }
}
