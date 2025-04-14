# Deployment Guide

This guide covers deploying the Ethereum and Solana escrow contracts to their respective testnets.

## Prerequisites

- Node.js v16 or newer
- npm
- Ethereum wallet with Sepolia ETH
- Solana wallet with Devnet SOL
- Solana CLI (for Solana deployment)
- Rust (for Solana deployment)

## Environment Setup

1. Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

2. Edit the `.env` file to add your private keys and RPC URLs.

## Ethereum Deployment (Sepolia Testnet)

### 1. Get Sepolia ETH

Obtain Sepolia ETH from a faucet such as:
- https://sepoliafaucet.com/
- https://sepolia-faucet.pk910.de/

### 2. Update the `.env` file with your Ethereum credentials:

```
PRIVATE_KEY=your_ethereum_private_key_here
SEPOLIA_URL=your_sepolia_rpc_url_here
FEE_COLLECTOR_ADDRESS=address_that_will_collect_fees
```

You can get an RPC URL from services like Infura, Alchemy, or use a public RPC endpoint.

### 3. Deploy the contracts:

```bash
npm run deploy-ethereum
```

This script will:
- Deploy the EscrowFactory contract to Sepolia
- Output the contract address
- Verify the contract on Etherscan (if possible)
- Provide instructions for updating your application

### 4. Update your application

After deployment, update `app/lib/contractUtils.ts` with the factory address from the console output.

## Solana Deployment (Devnet)

### 1. Generate a Solana Keypair (if needed)

```bash
npm run generate-solana-keypair
```

This will output a public key and private key. Add the private key to your `.env` file.

### 2. Get Devnet SOL

Get Devnet SOL from a faucet such as:
- https://solfaucet.com/

Or use the Solana CLI:
```bash
solana airdrop 2 <YOUR_PUBLIC_KEY> --url devnet
```

### 3. Install Solana CLI and Rust (if not already installed)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.14.17/install)"
```

### 4. Update the `.env` file with your Solana credentials:

```
SOLANA_PRIVATE_KEY=your_solana_private_key_as_comma_separated_numbers
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 5. Deploy the program:

```bash
npm run deploy-solana
```

This script will:
- Build the Solana program
- Deploy it to Devnet
- Output the program ID
- Provide instructions for updating your application

### 6. Update your application

After deployment, update `app/lib/contractUtils.ts` with the program ID from the console output.

## Verifying the Deployment

After deploying both contracts, you can test the functionality through the web interface:

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the Ethereum and Solana pages to create and interact with escrows.

## Mainnet Deployment

When you're ready to deploy to mainnet:

1. Update the `.env` file with mainnet credentials
2. For Ethereum, modify the hardhat.config.js to include mainnet configuration
3. For Solana, update the deployment script to use mainnet-beta instead of devnet
4. Ensure you have sufficient funds for deployment and gas costs
5. Follow the same deployment steps as above

⚠️ **IMPORTANT**: Always thoroughly test on testnet before deploying to mainnet! 