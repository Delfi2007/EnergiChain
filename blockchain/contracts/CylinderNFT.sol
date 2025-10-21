// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CylinderNFT
 * @dev ERC-721 NFT for LPG cylinder digital identity
 * Each physical cylinder gets a unique blockchain-based digital twin
 */
contract CylinderNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct CylinderData {
        string cylinderId;      // Physical ID (e.g., "CYL-7892341")
        uint256 manufactureDate;
        uint8 size;            // 6kg or 13kg
        uint16 refillCount;
        uint256 lastRefillDate;
        bool isCertified;
        string[] safetyInspections; // Array of inspection hashes
    }

    mapping(uint256 => CylinderData) public cylinders;
    mapping(string => uint256) public cylinderIdToTokenId;

    event CylinderMinted(uint256 indexed tokenId, string cylinderId, uint8 size);
    event CylinderRefilled(uint256 indexed tokenId, uint256 refillDate);
    event SafetyInspection(uint256 indexed tokenId, string inspectionHash);

    constructor() ERC721("EnergiChain Cylinder", "ECYL") {}

    /**
     * @dev Mint a new cylinder NFT
     */
    function mintCylinder(
        address owner,
        string memory cylinderId,
        uint8 size,
        uint256 manufactureDate
    ) public onlyOwner returns (uint256) {
        require(cylinderIdToTokenId[cylinderId] == 0, "Cylinder already exists");
        require(size == 6 || size == 13, "Invalid cylinder size");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(owner, newTokenId);

        cylinders[newTokenId] = CylinderData({
            cylinderId: cylinderId,
            manufactureDate: manufactureDate,
            size: size,
            refillCount: 0,
            lastRefillDate: 0,
            isCertified: true,
            safetyInspections: new string[](0)
        });

        cylinderIdToTokenId[cylinderId] = newTokenId;

        emit CylinderMinted(newTokenId, cylinderId, size);
        return newTokenId;
    }

    /**
     * @dev Record a refill event
     */
    function recordRefill(string memory cylinderId) public onlyOwner {
        uint256 tokenId = cylinderIdToTokenId[cylinderId];
        require(tokenId != 0, "Cylinder does not exist");

        cylinders[tokenId].refillCount++;
        cylinders[tokenId].lastRefillDate = block.timestamp;

        emit CylinderRefilled(tokenId, block.timestamp);
    }

    /**
     * @dev Add safety inspection record
     */
    function addSafetyInspection(
        string memory cylinderId,
        string memory inspectionHash
    ) public onlyOwner {
        uint256 tokenId = cylinderIdToTokenId[cylinderId];
        require(tokenId != 0, "Cylinder does not exist");

        cylinders[tokenId].safetyInspections.push(inspectionHash);

        emit SafetyInspection(tokenId, inspectionHash);
    }

    /**
     * @dev Get cylinder data
     */
    function getCylinderData(string memory cylinderId) 
        public 
        view 
        returns (
            uint8 size,
            uint16 refillCount,
            uint256 lastRefillDate,
            bool isCertified,
            uint256 manufactureDate
        ) 
    {
        uint256 tokenId = cylinderIdToTokenId[cylinderId];
        require(tokenId != 0, "Cylinder does not exist");

        CylinderData memory data = cylinders[tokenId];
        return (
            data.size,
            data.refillCount,
            data.lastRefillDate,
            data.isCertified,
            data.manufactureDate
        );
    }

    /**
     * @dev Revoke certification (e.g., cylinder failed inspection)
     */
    function revokeCertification(string memory cylinderId) public onlyOwner {
        uint256 tokenId = cylinderIdToTokenId[cylinderId];
        require(tokenId != 0, "Cylinder does not exist");
        cylinders[tokenId].isCertified = false;
    }
}
