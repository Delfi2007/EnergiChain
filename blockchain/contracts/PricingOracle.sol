// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PricingOracle
 * @dev Immutable pricing feed for LPG across regions
 * Provides transparent, blockchain-verified pricing data
 */
contract PricingOracle is Ownable {
    struct PriceData {
        uint256 basePrice;
        uint256 transportCost;
        uint256 taxAmount;
        uint256 totalPrice;
        uint256 timestamp;
        bool isActive;
    }

    struct RegionalPrice {
        string region;
        mapping(uint8 => PriceData) prices; // cylinderSize => price
        uint256 lastUpdate;
    }

    mapping(bytes32 => RegionalPrice) public regionalPrices;
    bytes32[] public regionHashes;

    event PriceUpdated(
        string indexed region,
        uint8 cylinderSize,
        uint256 totalPrice,
        uint256 timestamp
    );

    constructor() {
        // Initialize default regions
        _initializeRegion("Nairobi");
        _initializeRegion("Mombasa");
        _initializeRegion("Kisumu");
        _initializeRegion("Nakuru");
        _initializeRegion("Eldoret");
    }

    function _initializeRegion(string memory region) private {
        bytes32 regionHash = keccak256(abi.encodePacked(region));
        regionalPrices[regionHash].region = region;
        regionalPrices[regionHash].lastUpdate = block.timestamp;
        regionHashes.push(regionHash);
    }

    /**
     * @dev Update price for a region and cylinder size
     */
    function updatePrice(
        string memory region,
        uint8 cylinderSize,
        uint256 basePrice,
        uint256 transportCost,
        uint256 taxAmount
    ) public onlyOwner {
        require(cylinderSize == 6 || cylinderSize == 13, "Invalid cylinder size");
        
        bytes32 regionHash = keccak256(abi.encodePacked(region));
        uint256 totalPrice = basePrice + transportCost + taxAmount;

        regionalPrices[regionHash].prices[cylinderSize] = PriceData({
            basePrice: basePrice,
            transportCost: transportCost,
            taxAmount: taxAmount,
            totalPrice: totalPrice,
            timestamp: block.timestamp,
            isActive: true
        });

        regionalPrices[regionHash].lastUpdate = block.timestamp;

        emit PriceUpdated(region, cylinderSize, totalPrice, block.timestamp);
    }

    /**
     * @dev Get current price for region and cylinder size
     */
    function getPrice(string memory region, uint8 cylinderSize) 
        public 
        view 
        returns (
            uint256 basePrice,
            uint256 transportCost,
            uint256 taxAmount,
            uint256 totalPrice,
            uint256 timestamp
        ) 
    {
        bytes32 regionHash = keccak256(abi.encodePacked(region));
        PriceData memory priceData = regionalPrices[regionHash].prices[cylinderSize];
        
        require(priceData.isActive, "Price not available for this region/size");

        return (
            priceData.basePrice,
            priceData.transportCost,
            priceData.taxAmount,
            priceData.totalPrice,
            priceData.timestamp
        );
    }

    /**
     * @dev Get all regions
     */
    function getAllRegions() public view returns (string[] memory) {
        string[] memory regions = new string[](regionHashes.length);
        for (uint i = 0; i < regionHashes.length; i++) {
            regions[i] = regionalPrices[regionHashes[i]].region;
        }
        return regions;
    }

    /**
     * @dev Check if price is stale (older than 24 hours)
     */
    function isPriceStale(string memory region, uint8 cylinderSize) 
        public 
        view 
        returns (bool) 
    {
        bytes32 regionHash = keccak256(abi.encodePacked(region));
        PriceData memory priceData = regionalPrices[regionHash].prices[cylinderSize];
        
        if (!priceData.isActive) return true;
        return (block.timestamp - priceData.timestamp) > 24 hours;
    }
}
