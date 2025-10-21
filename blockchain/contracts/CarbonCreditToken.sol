// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CarbonCreditToken
 * @dev ERC-20 token for carbon credits (ECO tokens)
 * Users earn tokens by choosing LPG over traditional fuels
 */
contract CarbonCreditToken is ERC20, Ownable {
    // CO2 savings in grams per refill (LPG vs charcoal)
    uint256 public constant CO2_SAVED_PER_6KG = 12000;   // 12kg CO2 saved
    uint256 public constant CO2_SAVED_PER_13KG = 26000;  // 26kg CO2 saved
    uint256 public constant GRAMS_PER_TOKEN = 1000;      // 1 token = 1kg CO2 saved

    struct UserStats {
        uint256 totalRefills;
        uint256 totalCO2Saved;      // in grams
        uint256 tokensEarned;
        uint256 lastRefillDate;
    }

    mapping(address => UserStats) public userStats;

    event TokensEarned(address indexed user, uint256 amount, uint256 co2Saved);
    event TokensRedeemed(address indexed user, uint256 amount, string redemptionType);

    constructor() ERC20("EnergiChain Carbon Credit", "ECO") {
        // Mint initial supply for liquidity
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * @dev Award tokens for a refill
     */
    function awardTokensForRefill(address user, uint8 cylinderSize) public onlyOwner {
        require(cylinderSize == 6 || cylinderSize == 13, "Invalid cylinder size");

        uint256 co2Saved = cylinderSize == 6 ? CO2_SAVED_PER_6KG : CO2_SAVED_PER_13KG;
        uint256 tokensToAward = co2Saved / GRAMS_PER_TOKEN;

        _mint(user, tokensToAward * 10**decimals());

        userStats[user].totalRefills++;
        userStats[user].totalCO2Saved += co2Saved;
        userStats[user].tokensEarned += tokensToAward;
        userStats[user].lastRefillDate = block.timestamp;

        emit TokensEarned(user, tokensToAward, co2Saved);
    }

    /**
     * @dev Redeem tokens for discount or cash
     */
    function redeemTokens(uint256 amount, string memory redemptionType) public {
        require(balanceOf(msg.sender) >= amount * 10**decimals(), "Insufficient balance");
        
        _burn(msg.sender, amount * 10**decimals());

        emit TokensRedeemed(msg.sender, amount, redemptionType);
    }

    /**
     * @dev Get user statistics
     */
    function getUserStats(address user) 
        public 
        view 
        returns (
            uint256 totalRefills,
            uint256 totalCO2Saved,
            uint256 tokensEarned,
            uint256 currentBalance
        ) 
    {
        UserStats memory stats = userStats[user];
        return (
            stats.totalRefills,
            stats.totalCO2Saved,
            stats.tokensEarned,
            balanceOf(user) / 10**decimals()
        );
    }

    /**
     * @dev Calculate potential earnings for a refill
     */
    function calculateEarnings(uint8 cylinderSize) public pure returns (uint256) {
        require(cylinderSize == 6 || cylinderSize == 13, "Invalid cylinder size");
        uint256 co2Saved = cylinderSize == 6 ? CO2_SAVED_PER_6KG : CO2_SAVED_PER_13KG;
        return co2Saved / GRAMS_PER_TOKEN;
    }
}
