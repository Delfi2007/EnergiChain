const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting EnergiChain contract deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString(), "\n");

  // 1. Deploy CylinderNFT
  console.log("📦 Deploying CylinderNFT...");
  const CylinderNFT = await hre.ethers.getContractFactory("CylinderNFT");
  const cylinderNFT = await CylinderNFT.deploy();
  await cylinderNFT.waitForDeployment();
  console.log("✅ CylinderNFT deployed to:", await cylinderNFT.getAddress(), "\n");

  // 2. Deploy CarbonCreditToken
  console.log("📦 Deploying CarbonCreditToken...");
  const CarbonCreditToken = await hre.ethers.getContractFactory("CarbonCreditToken");
  const carbonToken = await CarbonCreditToken.deploy();
  await carbonToken.waitForDeployment();
  console.log("✅ CarbonCreditToken deployed to:", await carbonToken.getAddress(), "\n");

  // 3. Deploy CircularEconomy
  console.log("📦 Deploying CircularEconomy...");
  const CircularEconomy = await hre.ethers.getContractFactory("CircularEconomy");
  const circularEconomy = await CircularEconomy.deploy();
  await circularEconomy.waitForDeployment();
  console.log("✅ CircularEconomy deployed to:", await circularEconomy.getAddress(), "\n");

  // 4. Deploy PricingOracle
  console.log("📦 Deploying PricingOracle...");
  const PricingOracle = await hre.ethers.getContractFactory("PricingOracle");
  const pricingOracle = await PricingOracle.deploy();
  await pricingOracle.waitForDeployment();
  console.log("✅ PricingOracle deployed to:", await pricingOracle.getAddress(), "\n");

  // 5. Deploy ReferralProgram
  console.log("📦 Deploying ReferralProgram...");
  const ReferralProgram = await hre.ethers.getContractFactory("ReferralProgram");
  const referralProgram = await ReferralProgram.deploy();
  await referralProgram.waitForDeployment();
  console.log("✅ ReferralProgram deployed to:", await referralProgram.getAddress(), "\n");

  // Initialize with sample data
  console.log("🔧 Initializing contracts with sample data...\n");

  // Initialize pricing for Nairobi
  console.log("💰 Setting initial prices for Nairobi...");
  await pricingOracle.updatePrice("Nairobi", 6, 1700, 120, 180);  // 6kg
  await pricingOracle.updatePrice("Nairobi", 13, 2800, 150, 350); // 13kg
  console.log("✅ Prices set\n");

  // Summary
  console.log("🎉 Deployment Complete!\n");
  console.log("📋 Contract Addresses:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("CylinderNFT:        ", await cylinderNFT.getAddress());
  console.log("CarbonCreditToken:  ", await carbonToken.getAddress());
  console.log("CircularEconomy:    ", await circularEconomy.getAddress());
  console.log("PricingOracle:      ", await pricingOracle.getAddress());
  console.log("ReferralProgram:    ", await referralProgram.getAddress());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📝 Save these addresses to your frontend config!");
  console.log("🔗 Network:", hre.network.name);
  console.log("⛽ Gas used: Check transaction receipts above\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
