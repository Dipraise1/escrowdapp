'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import Link from 'next/link';
import { ethers } from 'ethers';
import { 
  ETHEREUM_FACTORY_ADDRESS,
  EscrowFactoryABI,
  getUserEscrows 
} from '../lib/contractUtils';

export default function Dashboard() {
  const { isConnected, connectEthereum, connectSolana, currentChain, address, provider } = useWallet();
  const [activeFilter, setActiveFilter] = useState<'all' | 'ethereum' | 'solana'>('all');
  const [ethEscrowCount, setEthEscrowCount] = useState(0);
  const [solanaEscrowCount, setSolanaEscrowCount] = useState(0);
  const [totalEscrowCount, setTotalEscrowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userEscrows, setUserEscrows] = useState<any[]>([]);

  const handleConnect = async () => {
    if (currentChain === 'ethereum' || !currentChain) {
      await connectEthereum();
    } else {
      await connectSolana();
    }
  };

  useEffect(() => {
    const loadEscrowData = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setTotalEscrowCount(0); // Reset count before adding new values
      
      try {
        if (provider && (currentChain === 'ethereum' || !currentChain)) {
          // Load Ethereum escrows using our utility function
          const escrows = await getUserEscrows(provider, address);
          setEthEscrowCount(escrows.length);
          setTotalEscrowCount(prev => prev + escrows.length);
        }
        
        // In a real implementation, you would also load Solana escrows here
        // This is just a placeholder for demo purposes
        setSolanaEscrowCount(0);
      } catch (error) {
        console.error('Error loading escrow data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEscrowData();
  }, [isConnected, currentChain, address, provider]);

  return (
    <main className="flex flex-col items-center px-4 sm:px-6 md:px-8 pt-8 sm:pt-12 md:pt-16 grid-pattern">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-neon-green">Your Escrow Dashboard</h1>
        
        {!isConnected ? (
          <div className="bg-charcoal p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 text-center border border-neon-green/30">
            <p className="mb-4 text-gray-300">Connect your wallet to view your escrow details</p>
            <button 
              onClick={handleConnect}
              className="neon-button py-2 px-6 rounded-lg text-sm sm:text-base"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">
              <div className="bg-charcoal p-4 sm:p-6 rounded-lg shadow-md border border-neon-green/30 hover:border-neon-green/50 transition-all">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black/50 rounded-full flex items-center justify-center mr-2 sm:mr-3 border border-neon-green/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 h-3 sm:h-4 sm:w-4 text-neon-green" viewBox="0 0 784.37 1277.39">
                      <g>
                        <polygon fill="currentColor" fillRule="nonzero" points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54"/>
                        <polygon fill="currentColor" fillRule="nonzero" points="392.07,0 -0,650.54 392.07,882.29 392.07,472.33"/>
                      </g>
                    </svg>
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-neon-green">Ethereum Escrows</h2>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-white">
                  {isLoading ? (
                    <div className="animate-pulse h-6 sm:h-8 w-8 sm:w-12 bg-gray-700 rounded"></div>
                  ) : (
                    ethEscrowCount
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">Active Contracts</div>
                
                <div className="mt-3 sm:mt-4">
                  <Link 
                    href="/ethereum" 
                    className="text-neon-green hover:text-acid-green font-medium text-xs sm:text-sm inline-flex items-center"
                  >
                    Create new
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
              
              <div className="bg-charcoal p-4 sm:p-6 rounded-lg shadow-md border border-neon-green/30 hover:border-neon-green/50 transition-all">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black/50 rounded-full flex items-center justify-center mr-2 sm:mr-3 border border-neon-green/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 h-3 sm:h-4 sm:w-4 text-neon-green" viewBox="0 0 397.7 311.7">
                      <path fill="currentColor" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                    </svg>
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-neon-green">Solana Escrows</h2>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-white">
                  {isLoading ? (
                    <div className="animate-pulse h-6 sm:h-8 w-8 sm:w-12 bg-gray-700 rounded"></div>
                  ) : (
                    solanaEscrowCount
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">Active Programs</div>
                
                <div className="mt-3 sm:mt-4">
                  <Link 
                    href="/solana" 
                    className="text-neon-green hover:text-acid-green font-medium text-xs sm:text-sm inline-flex items-center"
                  >
                    Create new
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-charcoal p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 border border-neon-green/30">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-neon-green">All Escrows</h2>
                
                {isLoading ? (
                  <div className="animate-pulse h-5 sm:h-6 w-16 sm:w-24 bg-gray-700 rounded"></div>
                ) : (
                  <div className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 bg-deep-black rounded-full text-neon-green border border-neon-green/30">
                    Total: {totalEscrowCount}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button 
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
                      activeFilter === 'all' 
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                        : 'text-gray-200 hover:bg-neon-green/10 hover:text-neon-green border border-transparent'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setActiveFilter('ethereum')}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
                      activeFilter === 'ethereum' 
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                        : 'text-gray-200 hover:bg-neon-green/10 hover:text-neon-green border border-transparent'
                    }`}
                  >
                    Ethereum
                  </button>
                  <button 
                    onClick={() => setActiveFilter('solana')}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
                      activeFilter === 'solana' 
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                        : 'text-gray-200 hover:bg-neon-green/10 hover:text-neon-green border border-transparent'
                    }`}
                  >
                    Solana
                  </button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse border border-neon-green/10 rounded-lg p-3 sm:p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2 bg-gray-700"></div>
                          <div className="h-4 sm:h-6 w-16 sm:w-24 bg-gray-700 rounded"></div>
                        </div>
                        <div className="h-4 sm:h-5 w-12 sm:w-16 bg-gray-700 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 sm:h-4 w-full bg-gray-700 rounded"></div>
                        <div className="h-3 sm:h-4 w-3/4 bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : ethEscrowCount === 0 && solanaEscrowCount === 0 ? (
                <div className="text-center text-gray-400 py-10 sm:py-16">
                  <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 opacity-50">🔍</div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 text-neon-green">No escrows found</h3>
                  <p className="text-sm">Create a new escrow contract to get started</p>
                  <p className="text-xs sm:text-sm mt-2 text-gray-500 break-all">Connected wallet: <span className="text-neon-green">{address}</span></p>
                </div>
              ) : (
                <div className="flex justify-center items-center py-6 sm:py-8">
                  <Link 
                    href={ethEscrowCount > 0 ? "/ethereum" : "/solana"}
                    className="neon-button py-2 px-4 sm:px-6 rounded-lg text-sm sm:text-base"
                  >
                    View Your Escrows 
                    <span className="ml-1">→</span>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="bg-charcoal p-4 sm:p-6 rounded-lg shadow-md border border-neon-green/30">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-neon-green">Quick Links</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Link href="/ethereum" className="bg-deep-black p-3 rounded border border-neon-green/20 hover:border-neon-green/50 transition-all flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 bg-black/50 flex items-center justify-center border border-neon-green/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-neon-green" viewBox="0 0 784.37 1277.39">
                      <g>
                        <polygon fill="currentColor" fillRule="nonzero" points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54"/>
                        <polygon fill="currentColor" fillRule="nonzero" points="392.07,0 -0,650.54 392.07,882.29 392.07,472.33"/>
                      </g>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-white">Create Ethereum Escrow</h3>
                    <p className="text-[10px] sm:text-xs text-gray-400">Create a new Ethereum-based escrow contract</p>
                  </div>
                </Link>
                
                <Link href="/solana" className="bg-deep-black p-3 rounded border border-neon-green/20 hover:border-neon-green/50 transition-all flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 bg-black/50 flex items-center justify-center border border-neon-green/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-neon-green" viewBox="0 0 397.7 311.7">
                      <path fill="currentColor" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-white">Create Solana Escrow</h3>
                    <p className="text-[10px] sm:text-xs text-gray-400">Create a new Solana-based escrow program</p>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
} 