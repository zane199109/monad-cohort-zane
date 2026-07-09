// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../src/NFTBadge.sol";

contract NFTBadgeTest is Test {
    NFTBadge badge;
    address owner = address(this);
    address minter = address(0xA1);
    address holder = address(0xB2);
    address other = address(0xC3);

    function setUp() public {
        badge = new NFTBadge("CourseBadge", "CB");
        badge.setMinter(minter, true);
    }

    function test_CreateBadgeType() public {
        uint256 id = badge.createBadgeType("Week1", "finish week1", "ipfs://x");
        assertEq(id, 0);
        assertEq(badge.nextBadgeTypeId(), 1);
    }

    function test_MintAndHasBadge() public {
        uint256 typeId = badge.createBadgeType("Week1", "finish week1", "ipfs://x");
        vm.prank(minter);
        uint256 tokenId = badge.mint(holder, typeId);
        assertEq(tokenId, 0);
        assertTrue(badge.hasBadge(holder, typeId));
        assertFalse(badge.hasBadge(holder, 999));
        assertEq(badge.tokenBadgeType(tokenId), typeId);
    }

    function testRevert_MintUnknownType() public {
        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(NFTBadge.BadgeTypeNotFound.selector, 999));
        badge.mint(holder, 999);
    }

    function testRevert_UnauthorizedMint() public {
        uint256 typeId = badge.createBadgeType("Week1", "finish week1", "ipfs://x");
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(NFTBadge.NotAuthorizedMinter.selector, other));
        badge.mint(holder, typeId);
    }

    function testRevert_NonOwnerCreateType() public {
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, other));
        badge.createBadgeType("x", "y", "z");
    }
}
