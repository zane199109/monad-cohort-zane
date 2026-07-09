// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTBadge
/// @notice A simple ERC721-based badge system. The owner defines badge types
///         and authorizes minters to issue badges. Anyone can query ownership.
contract NFTBadge is ERC721URIStorage, Ownable {
    /// @dev A badge type is a template (metadata) that badges can be minted from.
    struct BadgeType {
        string name;
        string description;
        string uri;
        bool exists;
    }

    // --- State ---
    mapping(uint256 => BadgeType) public badgeTypes;
    mapping(address => bool) public minters;
    // tokenId => badgeTypeId, so a holder's badge type can be resolved in O(1)
    mapping(uint256 => uint256) public tokenBadgeType;
    // owner => badgeTypeId => count, supports hasBadge without enumeration
    mapping(address => mapping(uint256 => uint256)) public badgeCount;

    uint256 public nextTokenId;
    uint256 public nextBadgeTypeId;

    // --- Events ---
    event BadgeTypeCreated(uint256 indexed typeId, string name, string uri);
    event BadgeMinted(uint256 indexed tokenId, uint256 indexed typeId, address indexed to);
    event MinterUpdated(address indexed account, bool isMinter);

    // --- Errors ---
    error BadgeTypeNotFound(uint256 typeId);
    error NotAuthorizedMinter(address caller);
    error EmptyName();

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
        Ownable(msg.sender)
    {}

    // --- Modifiers ---
    modifier onlyMinter() {
        if (!minters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter(msg.sender);
        }
        _;
    }

    // --- Badge type management ---
    function createBadgeType(string memory name, string memory description, string memory uri)
        external
        onlyOwner
        returns (uint256)
    {
        if (bytes(name).length == 0) revert EmptyName();
        uint256 typeId = nextBadgeTypeId++;
        badgeTypes[typeId] = BadgeType({name: name, description: description, uri: uri, exists: true});
        emit BadgeTypeCreated(typeId, name, uri);
        return typeId;
    }

    // --- Minter management ---
    function setMinter(address account, bool isMinter) external onlyOwner {
        minters[account] = isMinter;
        emit MinterUpdated(account, isMinter);
    }

    // --- Minting ---
    function mint(address to, uint256 typeId) external onlyMinter returns (uint256) {
        BadgeType storage bt = badgeTypes[typeId];
        if (!bt.exists) revert BadgeTypeNotFound(typeId);

        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, bt.uri);
        tokenBadgeType[tokenId] = typeId;
        badgeCount[to][typeId] += 1;
        emit BadgeMinted(tokenId, typeId, to);
        return tokenId;
    }

    // --- Queries ---
    function hasBadge(address account, uint256 typeId) external view returns (bool) {
        return badgeCount[account][typeId] > 0;
    }

    function getBadgeType(uint256 typeId)
        external
        view
        returns (string memory name, string memory description, string memory uri)
    {
        BadgeType storage bt = badgeTypes[typeId];
        if (!bt.exists) revert BadgeTypeNotFound(typeId);
        return (bt.name, bt.description, bt.uri);
    }
}
