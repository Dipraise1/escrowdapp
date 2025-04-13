# Crypto Escrow

A decentralized escrow service supporting both Ethereum and Solana blockchains with a modern web interface.

## Features

- **Dual Blockchain Support**: Create and manage escrow contracts on both Ethereum and Solana
- **Smart Contract Escrow**: Secure funds in smart contracts until conditions are met
- **Multi-party Escrow**: Involves a depositor, beneficiary, and arbiter for transaction security
- **Modern UI**: Responsive and user-friendly interface with dark mode support
- **Wallet Integration**: Connect with popular wallets like MetaMask (Ethereum) and Phantom (Solana)

## Architecture

### Frontend
- Next.js with App Router
- React for UI components
- TailwindCSS for styling
- Web3 wallet connections with ethers.js and @solana/web3.js

### Smart Contracts
- **Ethereum**: Solidity contracts for the escrow logic with factory pattern
- **Solana**: Rust program implementing escrow functionality

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MetaMask extension for Ethereum interactions
- Phantom wallet for Solana interactions

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/crypto-escrow.git
cd crypto-escrow

# Install dependencies
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Connect your wallet (MetaMask for Ethereum or Phantom for Solana)
2. Select the blockchain you want to use (Ethereum or Solana)
3. Fill in the escrow details (beneficiary, arbiter, amount, terms)
4. Create the escrow contract
5. As an arbiter, you can approve the escrow to release funds
6. As a depositor, you can cancel the escrow if it hasn't been approved yet

## Development

This project uses:
- TypeScript for type safety
- ESLint for code linting
- TailwindCSS for styling
- Next.js for routing and API

## License

MIT # escrowdapp
