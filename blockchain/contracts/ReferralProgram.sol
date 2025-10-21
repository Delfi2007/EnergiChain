// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReferralProgram
 * @dev Manages ambassador referral system with commission tiers
 */
contract ReferralProgram is Ownable {
    struct Ambassador {
        bool isActive;
        uint256 totalReferrals;
        uint256 totalEarnings;
        uint8 tier; // 1=Bronze(10%), 2=Gold(20%), 3=Diamond(25%)
        string referralCode;
    }

    struct Referral {
        address ambassador;
        address customer;
        uint256 orderAmount;
        uint256 commission;
        uint256 timestamp;
    }

    mapping(address => Ambassador) public ambassadors;
    mapping(string => address) public referralCodeToAmbassador;
    mapping(address => Referral[]) public referralHistory;

    uint256 public totalAmbassadors;
    uint256 public totalCommissionPaid;

    event AmbassadorRegistered(address indexed ambassador, string referralCode);
    event ReferralRecorded(address indexed ambassador, address indexed customer, uint256 commission);
    event TierUpgraded(address indexed ambassador, uint8 newTier);

    /**
     * @dev Register as an ambassador
     */
    function registerAmbassador(string memory referralCode) public {
        require(!ambassadors[msg.sender].isActive, "Already registered");
        require(referralCodeToAmbassador[referralCode] == address(0), "Code already taken");

        ambassadors[msg.sender] = Ambassador({
            isActive: true,
            totalReferrals: 0,
            totalEarnings: 0,
            tier: 1, // Start as Bronze
            referralCode: referralCode
        });

        referralCodeToAmbassador[referralCode] = msg.sender;
        totalAmbassadors++;

        emit AmbassadorRegistered(msg.sender, referralCode);
    }

    /**
     * @dev Record a referral and pay commission
     */
    function recordReferral(
        string memory referralCode,
        address customer,
        uint256 orderAmount
    ) public onlyOwner {
        address ambassador = referralCodeToAmbassador[referralCode];
        require(ambassador != address(0), "Invalid referral code");
        require(ambassadors[ambassador].isActive, "Ambassador not active");

        Ambassador storage amb = ambassadors[ambassador];
        
        // Calculate commission based on tier
        uint256 commissionRate = _getCommissionRate(amb.tier);
        uint256 commission = (orderAmount * commissionRate) / 100;

        // Update ambassador stats
        amb.totalReferrals++;
        amb.totalEarnings += commission;

        // Check for tier upgrade
        _checkTierUpgrade(ambassador);

        // Record referral
        referralHistory[ambassador].push(Referral({
            ambassador: ambassador,
            customer: customer,
            orderAmount: orderAmount,
            commission: commission,
            timestamp: block.timestamp
        }));

        totalCommissionPaid += commission;

        emit ReferralRecorded(ambassador, customer, commission);
    }

    /**
     * @dev Get commission rate for tier
     */
    function _getCommissionRate(uint8 tier) private pure returns (uint256) {
        if (tier == 1) return 10;      // Bronze: 10%
        if (tier == 2) return 20;      // Gold: 20%
        if (tier == 3) return 25;      // Diamond: 25%
        return 10;
    }

    /**
     * @dev Check and upgrade tier based on referrals
     */
    function _checkTierUpgrade(address ambassador) private {
        Ambassador storage amb = ambassadors[ambassador];
        uint8 oldTier = amb.tier;

        if (amb.totalReferrals >= 51 && amb.tier < 3) {
            amb.tier = 3; // Diamond
        } else if (amb.totalReferrals >= 11 && amb.tier < 2) {
            amb.tier = 2; // Gold
        }

        if (amb.tier > oldTier) {
            emit TierUpgraded(ambassador, amb.tier);
        }
    }

    /**
     * @dev Get ambassador stats
     */
    function getAmbassadorStats(address ambassador) 
        public 
        view 
        returns (
            bool isActive,
            uint256 totalReferrals,
            uint256 totalEarnings,
            uint8 tier,
            string memory referralCode
        ) 
    {
        Ambassador memory amb = ambassadors[ambassador];
        return (
            amb.isActive,
            amb.totalReferrals,
            amb.totalEarnings,
            amb.tier,
            amb.referralCode
        );
    }

    /**
     * @dev Get referrals needed for next tier
     */
    function getReferralsForNextTier(address ambassador) public view returns (uint256) {
        uint8 tier = ambassadors[ambassador].tier;
        uint256 current = ambassadors[ambassador].totalReferrals;

        if (tier == 1) return 11 - current;  // Need 11 for Gold
        if (tier == 2) return 51 - current;  // Need 51 for Diamond
        return 0; // Already Diamond
    }
}
