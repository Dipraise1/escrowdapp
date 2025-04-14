const fs = require('fs');
const { exec } = require('child_process');
const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
require('dotenv').config();

// Ensure the SOLANA_PRIVATE_KEY is in the .env file
if (!process.env.SOLANA_PRIVATE_KEY) {
  console.error('🔴 Missing SOLANA_PRIVATE_KEY in .env file');
  process.exit(1);
}

// Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

// Load the keypair from the .env file
const loadWallet = () => {
  try {
    const keypairData = Uint8Array.from(
      process.env.SOLANA_PRIVATE_KEY.split(',').map(num => parseInt(num.trim()))
    );
    return Keypair.fromSecretKey(keypairData);
  } catch (error) {
    console.error('🔴 Error loading wallet from SOLANA_PRIVATE_KEY:', error);
    console.error('Make sure your SOLANA_PRIVATE_KEY is correctly formatted as a comma-separated list of integers');
    process.exit(1);
  }
};

// Generate a keypair file for Solana CLI if it doesn't exist
const generateKeypairFile = (keypair) => {
  const secretKeyArray = Array.from(keypair.secretKey);
  const keypairJson = JSON.stringify(secretKeyArray);
  
  // Save to deploy-keypair.json in scripts directory
  fs.writeFileSync('./deploy-keypair.json', keypairJson);
  console.log('✅ Generated deploy-keypair.json for Solana CLI');
  
  return './deploy-keypair.json';
};

// Check account balance
const checkBalance = async (keypair) => {
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < LAMPORTS_PER_SOL) {
    console.log('⚠️ Low balance. For devnet, you can get SOL from a faucet.');
    console.log('Visit https://solfaucet.com/');
    console.log(`Your address: ${keypair.publicKey.toString()}`);
  }
  
  return balance;
};

// Build and deploy the Solana program
const buildAndDeployProgram = () => {
  return new Promise((resolve, reject) => {
    console.log('🔨 Building Solana program...');
    
    // Run cargo build-bpf
    exec('cd contracts/solana && cargo build-bpf', (error, stdout, stderr) => {
      if (error) {
        console.error('🔴 Build error:', error);
        console.log(stderr);
        reject(error);
        return;
      }
      
      console.log(stdout);
      console.log('✅ Build successful');
      
      // Deploy the program to devnet
      console.log('🚀 Deploying to Solana devnet...');
      
      exec(
        'solana program deploy --keypair ./deploy-keypair.json ./contracts/solana/target/deploy/escrow.so --url devnet',
        (error, stdout, stderr) => {
          if (error) {
            console.error('🔴 Deployment error:', error);
            console.log(stderr);
            reject(error);
            return;
          }
          
          console.log(stdout);
          
          // Extract program ID from output
          const match = stdout.match(/Program Id: ([A-Za-z0-9]+)/);
          const programId = match ? match[1] : null;
          
          if (programId) {
            console.log('✅ Deployment successful');
            console.log(`📝 Program ID: ${programId}`);
            
            // Instructions for frontend configuration
            console.log("\n----------------------------------------------------");
            console.log("📝 Add this to your app/lib/contractUtils.ts file:");
            console.log(`export const SOLANA_PROGRAM_ID = "${programId}";`);
            console.log("----------------------------------------------------\n");
            
            resolve(programId);
          } else {
            console.error('🔴 Failed to extract Program ID from output');
            reject(new Error('Program ID not found in deployment output'));
          }
        }
      );
    });
  });
};

// Main function
async function main() {
  try {
    // Load wallet
    const keypair = loadWallet();
    console.log(`🔑 Deploying with account: ${keypair.publicKey.toString()}`);
    
    // Generate keypair file for CLI
    const keypairFile = generateKeypairFile(keypair);
    
    // Check balance
    await checkBalance(keypair);
    
    // Build and deploy
    const programId = await buildAndDeployProgram();
    
    return { programId, publicKey: keypair.publicKey.toString() };
  } catch (error) {
    console.error('🔴 Deployment failed:', error);
    process.exit(1);
  }
}

// Execute the deployment
main()
  .then((result) => {
    console.log('🎉 Deployment complete!');
    console.log(`Program ID: ${result.programId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('🔴 Deployment failed:', error);
    process.exit(1);
  }); 