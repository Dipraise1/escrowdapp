'use client';

import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PublicKey } from '@solana/web3.js';

export default function SolanaEscrow() {
  const { isConnected, connectSolana, address, provider } = useWallet();
  const router = useRouter();

  const [beneficiary, setBeneficiary] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('');
  const [terms, setTerms] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    await connectSolana();
  };

  // Function to validate Solana address
  const isValidSolanaAddress = (address: string) => {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate inputs
    if (!beneficiary || !arbiter || !amount || !terms) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isValidSolanaAddress(beneficiary) || !isValidSolanaAddress(arbiter)) {
      toast.error('Please enter valid Solana addresses');
      return;
    }

    // If token is provided, validate it as well
    if (token && !isValidSolanaAddress(token)) {
      toast.error('Please enter a valid token address');
      return;
    }

    setIsLoading(true);

    try {
      // In a real implementation, we would:
      // 1. Create and deploy Solana program
      // 2. Initialize escrow with parameters
      
      // For demo purposes
      toast.success('Escrow created successfully! This is a demo.');
      
      // Reset form
      setBeneficiary('');
      setArbiter('');
      setAmount('');
      setToken('');
      setTerms('');
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating escrow:', error);
      toast.error('Failed to create escrow');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center p-8 pt-16 grid-pattern">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-bold mb-8 text-center text-neon-green">Solana Escrow</h1>
        
        {!isConnected ? (
          <div className="bg-charcoal p-6 rounded-lg shadow-md mb-8 text-center border border-neon-green/30">
            <p className="mb-4 text-gray-300">Connect your wallet to create an escrow program</p>
            <button 
              onClick={handleConnect}
              className="neon-button py-2 px-6 rounded-lg"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="bg-charcoal p-6 rounded-lg shadow-md mb-8 border border-neon-green/30">
            <h2 className="text-xl font-semibold mb-4 text-neon-green">Create New Escrow</h2>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300" htmlFor="beneficiary">
                    Beneficiary Address
                  </label>
                  <input
                    type="text"
                    id="beneficiary"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                    className="w-full p-2 bg-dark-gray border border-neon-green/30 focus:border-neon-green/70 rounded-md text-white focus:ring-0 focus:outline-none focus:shadow-neon-green-sm"
                    placeholder="Solana address..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300" htmlFor="arbiter">
                    Arbiter Address
                  </label>
                  <input
                    type="text"
                    id="arbiter"
                    value={arbiter}
                    onChange={(e) => setArbiter(e.target.value)}
                    className="w-full p-2 bg-dark-gray border border-neon-green/30 focus:border-neon-green/70 rounded-md text-white focus:ring-0 focus:outline-none focus:shadow-neon-green-sm"
                    placeholder="Solana address..."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300" htmlFor="amount">
                    Escrow Amount (SOL)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full p-2 bg-dark-gray border border-neon-green/30 focus:border-neon-green/70 rounded-md text-white focus:ring-0 focus:outline-none focus:shadow-neon-green-sm"
                    placeholder="0.0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300" htmlFor="token">
                    Token (optional)
                  </label>
                  <input
                    type="text"
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full p-2 bg-dark-gray border border-neon-green/30 focus:border-neon-green/70 rounded-md text-white focus:ring-0 focus:outline-none focus:shadow-neon-green-sm"
                    placeholder="Token address (leave blank for SOL)"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300" htmlFor="terms">
                  Terms & Conditions
                </label>
                <textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                  className="w-full p-2 bg-dark-gray border border-neon-green/30 focus:border-neon-green/70 rounded-md text-white focus:ring-0 focus:outline-none focus:shadow-neon-green-sm"
                  placeholder="Describe the terms of this escrow..."
                />
              </div>
              
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full neon-button py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Escrow Program'}
              </button>
            </form>
          </div>
        )}
        
        <div className="bg-charcoal p-6 rounded-lg shadow-md border border-neon-green/30">
          <h2 className="text-xl font-semibold mb-4 text-neon-green">Your Active Escrows</h2>
          
          {!isConnected ? (
            <div className="text-center text-gray-400 py-8">
              Connect your wallet to view your escrow programs
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No active escrows found</p>
              <p className="text-sm mt-2 text-gray-500">Your wallet: <span className="text-neon-green">{address}</span></p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 