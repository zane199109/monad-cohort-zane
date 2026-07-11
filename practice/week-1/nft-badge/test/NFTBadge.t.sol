// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../contracts/NFTBadge.sol";

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

    function test_CreateBadgeTypes_Batch() public {
        string[] memory names = new string[](3);
        names[0] = "Week2";
        names[1] = "Week3";
        names[2] = "Week4";
        string[] memory descs = new string[](3);
        descs[0] = "desc2";
        descs[1] = "desc3";
        descs[2] = "desc4";
        string[] memory uris = new string[](3);
        uris[0] = "u2";
        uris[1] = "u3";
        uris[2] = "u4";

        uint256[] memory ids = badge.createBadgeTypes(names, descs, uris);
        assertEq(ids.length, 3);
        assertEq(ids[0], 0);
        assertEq(ids[1], 1);
        assertEq(ids[2], 2);
        assertEq(badge.nextBadgeTypeId(), 3);
    }

    function testRevert_CreateBadgeTypes_ArrayMismatch() public {
        string[] memory names = new string[](2);
        string[] memory descs = new string[](1);
        string[] memory uris = new string[](2);
        names[0] = "a";
        names[1] = "b";
        descs[0] = "c";
        uris[0] = "d";
        uris[1] = "e";
        vm.expectRevert(NFTBadge.ArrayMismatch.selector);
        badge.createBadgeTypes(names, descs, uris);
    }

    function testRevert_CreateBadgeTypes_Empty() public {
        string[] memory names = new string[](0);
        string[] memory descs = new string[](0);
        string[] memory uris = new string[](0);
        vm.expectRevert(NFTBadge.ZeroLengthArray.selector);
        badge.createBadgeTypes(names, descs, uris);
    }

    function test_MintBatch() public {
        uint256 typeId = badge.createBadgeType("Test", "desc", "uri");
        vm.prank(minter);
        badge.mintBatch(holder, typeId, 3);
        assertEq(badge.balanceOf(holder), 3);
        assertTrue(badge.hasBadge(holder, typeId));
    }

    function test_Airdrop() public {
        uint256 typeId = badge.createBadgeType("Test", "desc", "uri");
        address[] memory recipients = new address[](3);
        recipients[0] = address(0xD1);
        recipients[1] = address(0xD2);
        recipients[2] = address(0xD3);
        vm.prank(minter);
        badge.airdrop(typeId, recipients);
        for (uint256 i = 0; i < recipients.length; i++) {
            assertEq(badge.balanceOf(recipients[i]), 1);
            assertTrue(badge.hasBadge(recipients[i], typeId));
        }
    }

    function test_TokensOfOwner() public {
        uint256 typeId = badge.createBadgeType("Test", "desc", "uri");
        vm.prank(minter);
        badge.mint(holder, typeId);
        vm.prank(minter);
        badge.mint(holder, typeId);
        uint256[] memory tokens = badge.tokensOfOwner(holder);
        assertEq(tokens.length, 2);
        assertEq(tokens[0], 0);
        assertEq(tokens[1], 1);
    }

    function testRevert_MintBatch_ZeroAmount() public {
        uint256 typeId = badge.createBadgeType("Test", "desc", "uri");
        vm.prank(minter);
        vm.expectRevert(NFTBadge.ZeroLengthArray.selector);
        badge.mintBatch(holder, typeId, 0);
    }

    function testRevert_Airdrop_EmptyRecipients() public {
        uint256 typeId = badge.createBadgeType("Test", "desc", "uri");
        address[] memory recipients = new address[](0);
        vm.prank(minter);
        vm.expectRevert(NFTBadge.ZeroLengthArray.selector);
        badge.airdrop(typeId, recipients);
    }

    function testRevert_UnauthorizedMintBatch() public {
        uint256 typeId = badge.createBadgeType("Test", "desc", "uri");
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(NFTBadge.NotAuthorizedMinter.selector, other));
        badge.mintBatch(holder, typeId, 1);
    }

    function testRevert_UnauthorizedAirdrop() public {
        uint256 typeId = badge.createBadgeType("Test", "desc", "uri");
        address[] memory recipients = new address[](1);
        recipients[0] = holder;
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(NFTBadge.NotAuthorizedMinter.selector, other));
        badge.airdrop(typeId, recipients);
    }

    function test_TokensOfOwner_Empty() public {
        uint256[] memory tokens = badge.tokensOfOwner(other);
        assertEq(tokens.length, 0);
    }

    function test_GetBadgeType() public {
        uint256 typeId = badge.createBadgeType("Week1", "finish week1", "ipfs://QmWeek1");
        (string memory name, string memory desc, string memory uri) = badge.getBadgeType(typeId);
        assertEq(name, "Week1");
        assertEq(desc, "finish week1");
        assertEq(uri, "ipfs://QmWeek1");
    }

    function testRevert_GetBadgeType_NotFound() public {
        vm.expectRevert(abi.encodeWithSelector(NFTBadge.BadgeTypeNotFound.selector, 999));
        badge.getBadgeType(999);
    }
}
