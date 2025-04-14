'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  EscrowData, 
  formatAddress, 
  getUserEscrows as getEscrows, 
  createEscrow, 
  approveEscrow, 
  cancelEscrow, 
  getEscrowStatus 
} from '../lib/contractUtils';
import { classNames } from '../lib/classNames';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Extended interface for UI display
interface UIEscrowData extends EscrowData {
  date?: string;                 // Optional date for UI
  statusString?: string;         // String representation of status
  id?: string;                   // ID used for UI operations
}

export default function EthereumEscrow() {
  const { isConnected, connectEthereum, address, provider } = useWallet();
  const router = useRouter();

  const [beneficiary, setBeneficiary] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [amount, setAmount] = useState('');
  const [terms, setTerms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeEscrows, setActiveEscrows] = useState<UIEscrowData[]>([]);
  const [loadingEscrow, setLoadingEscrow] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  // Load user's escrows on connection or address change
  useEffect(() => {
    if (isConnected && address && provider) {
      loadUserEscrows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, provider]);

  const loadUserEscrows = async () => {
    if (!isConnected || !address || !provider) return;
    
    try {
      const escrows = await getEscrows(provider, address);
      // Convert to UI format
      const uiEscrows = escrows.map(escrow => ({
        ...escrow,
        id: escrow.address,
        statusString: escrow.isApproved ? "completed" : escrow.isCancelled ? "cancelled" : "active"
      }));
      setActiveEscrows(uiEscrows);
    } catch (error) {
      console.error('Error loading escrows:', error);
      toast.error('Failed to load escrows');
    }
  };

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
      // Create loading toast
      const loadingToastId = toast.loading('Creating escrow contract...');
      
      // Create the escrow using our utility function
      const tx = await createEscrow(provider, beneficiary, arbiter, terms, amount);
      
      // Wait for transaction to be confirmed
      await tx.wait();
      
      // Update toast
      toast.dismiss(loadingToastId);
      toast.success('Escrow created successfully!');
      
      // Reset form
      setBeneficiary('');
      setArbiter('');
      setAmount('');
      setTerms('');
      
      // Refresh escrows list
      await loadUserEscrows();
      
      // Navigate to dashboard
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      toast.error(`Failed to create escrow: ${error.message || error.reason || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveEscrow = async (escrowAddress: string) => {
    if (!provider || !address) return;
    
    setLoadingEscrow(escrowAddress);
    
    try {
      const loadingToastId = toast.loading('Approving escrow...');
      
      // Approve the escrow using our utility function
      const tx = await approveEscrow(provider, escrowAddress);
      await tx.wait();
      
      toast.dismiss(loadingToastId);
      toast.success('Escrow approved successfully!');
      
      // Refresh escrows
      await loadUserEscrows();
    } catch (error: any) {
      console.error('Error approving escrow:', error);
      toast.error(`Failed to approve escrow: ${error.message || error.reason || 'Unknown error'}`);
    } finally {
      setLoadingEscrow(null);
    }
  };
  
  const handleCancelEscrow = async (escrowAddress: string) => {
    if (!provider || !address) return;
    
    setLoadingEscrow(escrowAddress);
    
    try {
      const loadingToastId = toast.loading('Cancelling escrow...');
      
      // Cancel the escrow using our utility function
      const tx = await cancelEscrow(provider, escrowAddress);
      await tx.wait();
      
      toast.dismiss(loadingToastId);
      toast.success('Escrow cancelled successfully!');
      
      // Refresh escrows
      await loadUserEscrows();
    } catch (error: any) {
      console.error('Error cancelling escrow:', error);
      toast.error(`Failed to cancel escrow: ${error.message || error.reason || 'Unknown error'}`);
    } finally {
      setLoadingEscrow(null);
    }
  };

  const handleGetDetailedStatus = async (escrowAddress: string, index: number) => {
    if (!provider || !address) return;
    
    try {
      // If already showing details, just toggle off
      if (activeEscrows[index].showDetails) {
        const updatedEscrows = [...activeEscrows];
        updatedEscrows[index] = {
          ...updatedEscrows[index],
          showDetails: false
        };
        setActiveEscrows(updatedEscrows);
        return;
      }
      
      // Get status using our utility function
      const status = await getEscrowStatus(provider, escrowAddress);
      
      // Update escrow with status
      const updatedEscrows = [...activeEscrows];
      updatedEscrows[index] = {
        ...updatedEscrows[index],
        status,
        showDetails: true
      };
      
      setActiveEscrows(updatedEscrows);
    } catch (error) {
      console.error('Error getting escrow status:', error);
    }
  };

  // Format address with adaptive size based on screen width
  const formatAddressResponsive = (address: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      // For mobile, show even shorter address
      return `${address.substring(0, 4)}...${address.substring(address.length - 2)}`;
    }
    return formatAddress(address);
  };

  const handleApprove = async (escrowId: string) => {
    // Implementation of handleApprove function
  };

  const handleCancel = async (escrowId: string) => {
    // Implementation of handleCancel function
  };

  return (
    <main className="flex flex-col items-center px-4 sm:px-6 md:px-8 pt-8 sm:pt-12 md:pt-16 grid-pattern">
      <div className="max-w-3xl w-full">
        <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-center text-neon-green">Ethereum Escrow</h1>
        
        {!isConnected ? (
          <div className="bg-charcoal p-4 sm:p-6 rounded-lg shadow-md mb-4 sm:mb-6 md:mb-8 text-center border border-neon-green/30">
            <p className="mb-3 sm:mb-4 text-gray-300">Connect your wallet to create an escrow contract</p>
            <button 
              onClick={handleConnect}
              className="neon-button py-1.5 sm:py-2 px-4 sm:px-6 rounded-lg text-sm sm:text-base"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="bg-charcoal p-4 sm:p-6 rounded-lg shadow-md mb-4 sm:mb-6 md:mb-8 border border-neon-green/30">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-neon-green">Create New Escrow</h2>
            
            <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-300" htmlFor="beneficiary">
                    Beneficiary Address
                  </label>
                  <input
                    type="text"
                    id="beneficiary"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                    className="w-full p-1.5 sm:p-2 bg-dark-gray border border-neon-green/30 focus:border-neon-green/70 rounded-md text-white focus:ring-0 focus:outline-none focus:shadow-neon-green-sm text-xs sm:text-sm"
                    placeholder="Ethereum address..."
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-300" htmlFor="arbiter">
                    Arbiter Address
                  </label>
                  <input
                    type="text"
                    id="arbiter"
                    value={arbiter}
                    onChange={(e) => setArbiter(e.target.value)}
                    className="w-full p-1.5 sm:p-2 bg-dark-gray border border-neon-green/30 focus:border-neon-green/70 rounded-md text-white focus:ring-0 focus:outline-none focus:shadow-neon-green-sm text-xs sm:text-sm"
                    placeholder="Ethereum address..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-300" htmlFor="amount">
                  Escrow Amount (ETH)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full p-1.5 sm:p-2 bg-dark-gray border border-neon-green/30 focus:border-neon-green/70 rounded-md text-white focus:ring-0 focus:outline-none focus:shadow-neon-green-sm text-xs sm:text-sm"
                  placeholder="0.0"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-300" htmlFor="terms">
                  Terms & Conditions
                </label>
                <textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                  className="w-full p-1.5 sm:p-2 bg-dark-gray border border-neon-green/30 focus:border-neon-green/70 rounded-md text-white focus:ring-0 focus:outline-none focus:shadow-neon-green-sm text-xs sm:text-sm"
                  placeholder="Describe the terms of this escrow..."
                />
              </div>
              
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full neon-button py-2 sm:py-3 px-3 sm:px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoading ? 'Creating...' : 'Create Escrow Contract'}
              </button>
            </form>
          </div>
        )}
        
        <div className="bg-charcoal p-4 sm:p-6 rounded-lg shadow-md border border-neon-green/30">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-neon-green">Your Active Escrows</h2>
          
          {!isConnected ? (
            <p className="text-center text-sm sm:text-base text-gray-400">Connect your wallet to view your active escrows</p>
          ) : activeEscrows.length === 0 ? (
            <p className="text-center text-sm sm:text-base text-gray-400">You don&apos;t have any active escrows</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {activeEscrows.map((escrow, index) => (
                <div key={index} className="border border-neon-green/30 rounded-lg p-3 sm:p-4 bg-dark-gray hover:bg-charcoal/80 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <div className="flex flex-col">
                      <h3 className="text-sm sm:text-base font-medium text-neon-green truncate">Escrow #{index + 1}</h3>
                      <p className="text-xs sm:text-sm text-gray-400">{escrow.date}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs sm:text-sm font-medium px-2 py-1 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/30">
                        {escrow.amount} ETH
                      </div>
                      <span
                        className={classNames(
                          "text-xs sm:text-sm px-2 py-1 rounded-full",
                          escrow.statusString === "active" ? "bg-green-500/10 text-green-500 border border-green-500/30" :
                          escrow.statusString === "completed" ? "bg-blue-500/10 text-blue-500 border border-blue-500/30" :
                          "bg-red-500/10 text-red-500 border border-red-500/30"
                        )}
                      >
                        {escrow.statusString && escrow.statusString.charAt(0).toUpperCase() + escrow.statusString.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-2 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-400">Beneficiary</p>
                      <p className="truncate text-white/80">{escrow.beneficiary}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Arbiter</p>
                      <p className="truncate text-white/80">{escrow.arbiter}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs sm:text-sm mb-3">
                    <p className="text-gray-400">Terms</p>
                    <p className="text-white/80 line-clamp-2">{escrow.terms}</p>
                  </div>
                  
                  {escrow.statusString === "active" && (
                    <div className="flex flex-col xs:flex-row gap-2">
                      <button 
                        onClick={() => handleApprove(escrow.id || escrow.address)}
                        disabled={isLoading}
                        className="neon-button-sm py-1.5 px-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex-1"
                      >
                        Approve &amp; Release
                      </button>
                      <button 
                        onClick={() => handleCancel(escrow.id || escrow.address)}
                        disabled={isLoading}
                        className="neon-button-alt-sm py-1.5 px-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Notification Toast */}
      {notification && (
        <div className={classNames(
          "fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg text-sm sm:text-base transition-all duration-300 max-w-md w-full",
          notification.type === "success" ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {notification.type === "success" ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5" />
              )}
              <span>{notification.message}</span>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="text-white hover:text-gray-200"
              aria-label="Close notification"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
} 