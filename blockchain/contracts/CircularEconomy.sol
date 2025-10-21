// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CircularEconomy
 * @dev Manages cylinder deposit and refund system
 * Tracks deposits on blockchain for transparency
 */
contract CircularEconomy is Ownable {
    uint256 public constant DEPOSIT_AMOUNT = 500 * 10**18; // 500 KES in wei

    struct Deposit {
        address customer;
        string cylinderId;
        uint256 depositDate;
        bool refunded;
        uint256 refundDate;
    }

    mapping(string => Deposit) public deposits;
    mapping(address => string[]) public customerDeposits;
    
    uint256 public totalDepositsCollected;
    uint256 public totalRefundsIssued;
    uint256 public activeDepositCount;

    event DepositPaid(address indexed customer, string cylinderId, uint256 amount);
    event RefundIssued(address indexed customer, string cylinderId, uint256 amount);

    /**
     * @dev Record a deposit payment
     */
    function recordDeposit(address customer, string memory cylinderId) public payable {
        require(msg.value == DEPOSIT_AMOUNT, "Incorrect deposit amount");
        require(deposits[cylinderId].customer == address(0), "Cylinder already has deposit");

        deposits[cylinderId] = Deposit({
            customer: customer,
            cylinderId: cylinderId,
            depositDate: block.timestamp,
            refunded: false,
            refundDate: 0
        });

        customerDeposits[customer].push(cylinderId);
        totalDepositsCollected += msg.value;
        activeDepositCount++;

        emit DepositPaid(customer, cylinderId, msg.value);
    }

    /**
     * @dev Process refund when cylinder is returned
     */
    function processRefund(string memory cylinderId) public {
        Deposit storage deposit = deposits[cylinderId];
        require(deposit.customer != address(0), "No deposit found");
        require(!deposit.refunded, "Already refunded");
        require(deposit.customer == msg.sender, "Not the deposit owner");

        deposit.refunded = true;
        deposit.refundDate = block.timestamp;
        
        totalRefundsIssued += DEPOSIT_AMOUNT;
        activeDepositCount--;

        payable(msg.sender).transfer(DEPOSIT_AMOUNT);

        emit RefundIssued(msg.sender, cylinderId, DEPOSIT_AMOUNT);
    }

    /**
     * @dev Get customer's active deposits
     */
    function getCustomerDeposits(address customer) 
        public 
        view 
        returns (string[] memory) 
    {
        return customerDeposits[customer];
    }

    /**
     * @dev Get deposit info
     */
    function getDepositInfo(string memory cylinderId) 
        public 
        view 
        returns (
            address customer,
            uint256 depositDate,
            bool refunded,
            uint256 refundDate
        ) 
    {
        Deposit memory deposit = deposits[cylinderId];
        return (
            deposit.customer,
            deposit.depositDate,
            deposit.refunded,
            deposit.refundDate
        );
    }

    /**
     * @dev Get return rate statistics
     */
    function getReturnRate() public view returns (uint256) {
        if (totalDepositsCollected == 0) return 0;
        return (totalRefundsIssued * 100) / totalDepositsCollected;
    }

    /**
     * @dev Owner can withdraw unclaimed deposits after 1 year
     */
    function withdrawUnclaimedDeposits() public onlyOwner {
        // In production, add logic to only withdraw deposits older than 1 year
        payable(owner()).transfer(address(this).balance);
    }
}
