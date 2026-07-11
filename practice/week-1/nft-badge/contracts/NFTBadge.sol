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
    // tokenId => badgeTypeId
    mapping(uint256 => uint256) public tokenBadgeType;
    // owner => badgeTypeId => count
    mapping(address => mapping(uint256 => uint256)) public badgeCount;
    // owner => list of tokenIds (for enumeration)
    mapping(address => uint256[]) public ownerTokens;
    // tokenId => owner (lookup for removal)
    mapping(uint256 => address) public tokenOwner;

    uint256 public nextTokenId;
    uint256 public nextBadgeTypeId;

    // --- Events ---
    event BadgeTypeCreated(uint256 indexed typeId, string name, string uri);
    event BadgeTypesCreated(uint256[] typeIds);
    event BadgeMinted(uint256 indexed tokenId, uint256 indexed typeId, address indexed to);
    event MinterUpdated(address indexed account, bool isMinter);

    // --- Errors ---
    error BadgeTypeNotFound(uint256 typeId);
    error NotAuthorizedMinter(address caller);
    error EmptyName();
    error ZeroLengthArray();
    error ArrayMismatch();

    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {}

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

    /// @notice Batch create multiple badge types in one transaction
    /// @param names Array of badge type names
    /// @param descriptions Array of badge type descriptions
    /// @param uris Array of badge type URIs
    function createBadgeTypes(string[] calldata names, string[] calldata descriptions, string[] calldata uris)
        external
        onlyOwner
        returns (uint256[] memory typeIds)
    {
        if (names.length == 0) revert ZeroLengthArray();
        if (names.length != descriptions.length || names.length != uris.length) revert ArrayMismatch();

        typeIds = new uint256[](names.length);
        for (uint256 i = 0; i < names.length; i++) {
            if (bytes(names[i]).length == 0) revert EmptyName();
            typeIds[i] = nextBadgeTypeId;
            badgeTypes[nextBadgeTypeId] =
                BadgeType({name: names[i], description: descriptions[i], uri: uris[i], exists: true});
            emit BadgeTypeCreated(nextBadgeTypeId, names[i], uris[i]);
            nextBadgeTypeId++;
        }
        emit BadgeTypesCreated(typeIds);
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
        ownerTokens[to].push(tokenId);
        tokenOwner[tokenId] = to;
        emit BadgeMinted(tokenId, typeId, to);
        return tokenId;
    }

    /// @notice Mint multiple badges of the same type to a single recipient
    /// @param to Recipient address
    /// @param typeId Badge type to mint
    /// @param amount Number of badges to mint
    function mintBatch(address to, uint256 typeId, uint256 amount) external onlyMinter {
        if (amount == 0) revert ZeroLengthArray();
        BadgeType storage bt = badgeTypes[typeId];
        if (!bt.exists) revert BadgeTypeNotFound(typeId);

        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = nextTokenId++;
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, bt.uri);
            tokenBadgeType[tokenId] = typeId;
            badgeCount[to][typeId] += 1;
            ownerTokens[to].push(tokenId);
            tokenOwner[tokenId] = to;
            emit BadgeMinted(tokenId, typeId, to);
        }
    }

    /// @notice Airdrop one badge of a type to multiple recipients
    /// @param typeId Badge type to distribute
    /// @param recipients Array of recipient addresses
    function airdrop(uint256 typeId, address[] calldata recipients) external onlyMinter {
        if (recipients.length == 0) revert ZeroLengthArray();
        BadgeType storage bt = badgeTypes[typeId];
        if (!bt.exists) revert BadgeTypeNotFound(typeId);

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = nextTokenId++;
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, bt.uri);
            tokenBadgeType[tokenId] = typeId;
            badgeCount[recipients[i]][typeId] += 1;
            ownerTokens[recipients[i]].push(tokenId);
            tokenOwner[tokenId] = recipients[i];
            emit BadgeMinted(tokenId, typeId, recipients[i]);
        }
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

    /// @notice Get all token IDs owned by an address
    /// @param owner Address to query
    /// @return Array of token IDs owned by the address
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return ownerTokens[owner];
    }
}
