'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Factory ABI - Only the functions we need
const EscrowFactoryABI = [
  "function createEscrow(address _arbiter, address _beneficiary, string memory _terms, uint256 _timelock) external payable returns (address)",
  "function getUserEscrows(address _user) external view returns (address[] memory)",
  "function batchGetEscrowDetails(address[] memory _escrows) external view returns (address[] memory arbiterAddresses, address[] memory beneficiaryAddresses, address[] memory depositorAddresses, uint256[] memory amounts, bool[] memory statuses)"
];

// Escrow ABI - Only the functions we need
const EscrowABI = [
  "function arbiter() external view returns (address)",
  "function beneficiary() external view returns (address)",
  "function depositor() external view returns (address)",
  "function amount() external view returns (uint256)",
  "function terms() external view returns (string memory)",
  "function isApproved() external view returns (bool)",
  "function isCancelled() external view returns (bool)",
  "function getStatus() external view returns (bool isActive, bool isLockedByTimelock, bool hasMilestonesEnabled, bool hasActiveDispute)"
];

// Contract addresses - Replace with your deployed contract addresses
const FACTORY_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"; // This is a placeholder

export default function EthereumEscrow() {
  const { isConnected, connectEthereum, address, provider } = useWallet();
  const router = useRouter();

  const [beneficiary, setBeneficiary] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [amount, setAmount] = useState('');
  const [terms, setTerms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeEscrows, setActiveEscrows] = useState<any[]>([]);

  // Load user's escrows on connection or address change
  useEffect(() => {
    const loadUserEscrows = async () => {
      if (!isConnected || !address || !provider) return;
      
      try {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const factory = new ethers.Contract(FACTORY_ADDRESS, EscrowFactoryABI, signer);
        
        // Get user's escrows
        const userEscrows = await factory.getUserEscrows(address);
        
        if (userEscrows.length > 0) {
          // Get details for all escrows
          const details = await factory.batchGetEscrowDetails(userEscrows);
          
          // Format escrow data
          const escrowsData = userEscrows.map((addr: string, i: number) => ({
            address: addr,
            arbiter: details.arbiterAddresses[i],
            beneficiary: details.beneficiaryAddresses[i],
            depositor: details.depositorAddresses[i],
            amount: ethers.formatEther(details.amounts[i]),
            isApproved: details.statuses[i],
            isYours: details.depositorAddresses[i].toLowerCase() === address.toLowerCase()
          }));
          
          setActiveEscrows(escrowsData);
        } else {
          setActiveEscrows([]);
        }
      } catch (error) {
        console.error('Error loading escrows:', error);
        toast.error('Failed to load escrows');
      }
    };
    
    loadUserEscrows();
  }, [isConnected, address, provider]);

  const handleConnect = async () => {
    await connectEthereum();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate inputs
    if (!beneficiary || !arbiter || !amount || !terms) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!ethers.isAddress(beneficiary) || !ethers.isAddress(arbiter)) {
      toast.error('Please enter valid Ethereum addresses');
      return;
    }

    setIsLoading(true);

    try {
      // Create contract instance
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const factory = new ethers.Contract(FACTORY_ADDRESS, EscrowFactoryABI, signer);
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount);
      
      // Create timelock (optional - could be added as another form field in the future)
      const timelock = 0; // No timelock for now
      
      // Create loading toast
      const loadingToastId = toast.loading('Creating escrow contract...');
      
      // Send transaction to create escrow
      const tx = await factory.createEscrow(
        arbiter,
        beneficiary,
        terms,
        timelock,
        { value: amountInWei }
      );
      
      // Wait for transaction to be confirmed
      const receipt = await tx.wait();
      
      // Update toast
      toast.dismiss(loadingToastId);
      toast.success('Escrow created successfully!');
      
      // Reset form
      setBeneficiary('');
      setArbiter('');
      setAmount('');
      setTerms('');
      
      // Refresh escrows list
      router.refresh();
      
      // Navigate to dashboard
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      toast.error(`Failed to create escrow: ${error.message || error.reason || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format address to display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <main className="flex flex-col items-center p-8 pt-16 grid-pattern">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-bold mb-8 text-center text-neon-green">Ethereum Escrow</h1>
        
        {!isConnected ? (
          <div className="bg-charcoal p-6 rounded-lg shadow-md mb-8 text-center border border-neon-green/30">
            <p className="mb-4 text-gray-300">Connect your wallet to create an escrow contract</p>
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
                    placeholder="0x..."
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
                    placeholder="0x..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300" htmlFor="amount">
                  Escrow Amount (ETH)
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
                {isLoading ? 'Creating...' : 'Create Escrow Contract'}
              </button>
            </form>
          </div>
        )}
        
        <div className="bg-charcoal p-6 rounded-lg shadow-md border border-neon-green/30">
          <h2 className="text-xl font-semibold mb-4 text-neon-green">Your Active Escrows</h2>
          
          {!isConnected ? (
            <div className="text-center text-gray-400 py-8">
              Connect your wallet to view your escrow contracts
            </div>
          ) : activeEscrows.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No active escrows found</p>
              <p className="text-sm mt-2 text-gray-500">Your wallet: <span className="text-neon-green">{address}</span></p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeEscrows.map((escrow, index) => (
                <div key={index} className="border border-neon-green/20 rounded-lg p-4 hover:border-neon-green/40 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${escrow.isApproved ? 'bg-matrix-green' : 'bg-neon-green'}`}></div>
                      <h3 className="text-lg font-medium text-white">Escrow #{index + 1}</h3>
                    </div>
                    <span className="text-sm bg-deep-black px-2 py-1 rounded text-neon-green">
                      {escrow.isApproved ? 'Completed' : 'Active'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-sm">
                    <div>
                      <span className="text-gray-400">Contract:</span> 
                      <span className="ml-2 text-neon-green">{formatAddress(escrow.address)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Amount:</span> 
                      <span className="ml-2 text-white">{escrow.amount} ETH</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Depositor:</span> 
                      <span className="ml-2 text-white">{formatAddress(escrow.depositor)} {escrow.isYours && '(You)'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Beneficiary:</span> 
                      <span className="ml-2 text-white">{formatAddress(escrow.beneficiary)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Arbiter:</span> 
                      <span className="ml-2 text-white">{formatAddress(escrow.arbiter)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 text-xs">
                    <button 
                      onClick={() => window.open(`https://sepolia.etherscan.io/address/${escrow.address}`, '_blank')}
                      className="bg-deep-black border border-neon-green/30 text-neon-green px-3 py-1 rounded hover:bg-neon-green/10"
                    >
                      View on Etherscan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 