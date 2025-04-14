// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  // We get the contract factories
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  
  // Get fee collector address from .env or use deployer address
  const [deployer] = await hre.ethers.getSigners();
  const feeCollector = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;
  
  // Initial fee set at 0.25% (25 basis points)
  const initialFee = 25;
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Fee collector address:", feeCollector);
  
  // Deploy the escrow factory
  const escrowFactory = await EscrowFactory.deploy(feeCollector, initialFee);
  await escrowFactory.deployed();
  
  console.log("EscrowFactory deployed to:", escrowFactory.address);
  
  // Wait for 5 confirmations to ensure deployment is stable
  console.log("Waiting for 5 confirmations...");
  await escrowFactory.deployTransaction.wait(5);
  
  console.log("Deployment confirmed. Verifying contract...");
  
  // Verify the contract on Etherscan (if not on a local network)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    try {
      await hre.run("verify:verify", {
        address: escrowFactory.address,
        constructorArguments: [feeCollector, initialFee],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Error verifying contract: ", error.message);
    }
  }

  // Update configuration for frontend to use this contract
  console.log("\n----------------------------------------------------");
  console.log("📝 Add this to your app/lib/contractUtils.ts file:");
  console.log(`export const ETHEREUM_FACTORY_ADDRESS = "${escrowFactory.address}";`);
  console.log("----------------------------------------------------\n");
  
  return {
    factoryAddress: escrowFactory.address,
    feeCollector,
    initialFee
  };
}

// Execute the deployment
main()
  .then((deployedContracts) => {
    console.log("Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 