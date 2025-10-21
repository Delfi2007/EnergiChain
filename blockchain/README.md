# EnergiChain Blockchain Smart Contracts

This folder contains Solidity smart contracts for the EnergiChain platform's blockchain features.

## 📁 Contracts

### 1. **CylinderNFT.sol** (ERC-721)
- Blockchain-based digital identity for each LPG cylinder
- Tracks refill history, safety inspections, and ownership
- Prevents counterfeit cylinders

**Key Functions:**
- `mintCylinder()` - Create NFT for new cylinder
- `recordRefill()` - Log refill event on-chain
- `addSafetyInspection()` - Record safety check
- `getCylinderData()` - Retrieve cylinder info

### 2. **CarbonCreditToken.sol** (ERC-20)
- ECO token for carbon credit rewards
- 1 token = 1kg CO₂ saved
- Users earn tokens for choosing LPG over charcoal/kerosene

**Key Functions:**
- `awardTokensForRefill()` - Mint tokens based on CO₂ saved
- `redeemTokens()` - Exchange for discounts or cash
- `getUserStats()` - View total CO₂ saved and earnings
- `calculateEarnings()` - Preview token earnings

### 3. **CircularEconomy.sol**
- Manages KES 500 cylinder deposit system
- Tracks deposits and refunds on blockchain
- 94%+ return rate transparency

**Key Functions:**
- `recordDeposit()` - Log deposit payment
- `processRefund()` - Issue instant refund on return
- `getCustomerDeposits()` - View active deposits
- `getReturnRate()` - Calculate return statistics

### 4. **PricingOracle.sol**
- Immutable pricing feed for LPG
- Transparent cost breakdown (base + transport + tax)
- Regional pricing for 5 Kenya regions

**Key Functions:**
- `updatePrice()` - Update regional pricing (owner only)
- `getPrice()` - Fetch current price with breakdown
- `getAllRegions()` - List available regions
- `isPriceStale()` - Check if price needs update

### 5. **ReferralProgram.sol**
- Energy Ambassador commission system
- 3 tiers: Bronze (10%), Gold (20%), Diamond (25%)
- Automatic tier upgrades based on referrals

**Key Functions:**
- `registerAmbassador()` - Sign up with referral code
- `recordReferral()` - Log referral and pay commission
- `getAmbassadorStats()` - View earnings and tier
- `getReferralsForNextTier()` - Track progress

## 🛠️ Setup & Deployment

### Prerequisites
```bash
npm install --save-dev hardhat
npm install @openzeppelin/contracts
```

### Compile Contracts
```bash
npx hardhat compile
```

### Deploy to Testnet
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Run Tests
```bash
npx hardhat test
```

## 🔧 Technology Stack

- **Solidity:** ^0.8.0
- **OpenZeppelin:** ERC-721, ERC-20, Ownable
- **Hardhat:** Ethereum development environment
- **Ethers.js:** Blockchain interaction library

## 🌐 Networks

### Testnet (Recommended for Demo)
- **Sepolia Testnet** - Ethereum testnet with free ETH from faucets
- **Mumbai Testnet** - Polygon testnet (low gas fees)

### Mainnet (Production)
- **Ethereum Mainnet** - High security, higher gas fees
- **Polygon Mainnet** - Lower gas fees, fast transactions
- **Arbitrum/Optimism** - Layer 2 solutions for scaling

## 📝 Contract Addresses (After Deployment)

```
CylinderNFT: 0x...
CarbonCreditToken: 0x...
CircularEconomy: 0x...
PricingOracle: 0x...
ReferralProgram: 0x...
```

## 🔐 Security

- All contracts use OpenZeppelin's audited libraries
- Owner-only functions for sensitive operations
- Input validation on all public functions
- Reentrancy protection where applicable

## 🚀 Next Steps

1. Add unit tests for each contract
2. Create deployment scripts
3. Set up Hardhat config with network details
4. Deploy to testnet
5. Integrate with frontend using Web3.js or Ethers.js
6. Audit contracts before mainnet deployment

## 📚 Resources

- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
