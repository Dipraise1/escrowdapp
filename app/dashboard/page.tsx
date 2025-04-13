'use client';

import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import Link from 'next/link';

export default function Dashboard() {
  const { isConnected, connectEthereum, connectSolana, currentChain, address } = useWallet();
  const [activeFilter, setActiveFilter] = useState<'all' | 'ethereum' | 'solana'>('all');

  const handleConnect = async () => {
    if (currentChain === 'ethereum' || !currentChain) {
      await connectEthereum();
    } else {
      await connectSolana();
    }
  };

  return (
    <main className="flex flex-col items-center p-8 pt-16 grid-pattern">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center text-neon-green">Your Escrow Dashboard</h1>
        
        {!isConnected ? (
          <div className="bg-charcoal p-6 rounded-lg shadow-md mb-8 text-center border border-neon-green/30">
            <p className="mb-4 text-gray-300">Connect your wallet to view your escrow details</p>
            <button 
              onClick={handleConnect}
              className="neon-button py-2 px-6 rounded-lg"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <div className="bg-charcoal p-6 rounded-lg shadow-md border border-neon-green/30 hover:border-neon-green/50 transition-all">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center mr-3 border border-neon-green/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neon-green" viewBox="0 0 784.37 1277.39">
                      <g>
                        <polygon fill="currentColor" fillRule="nonzero" points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54"/>
                        <polygon fill="currentColor" fillRule="nonzero" points="392.07,0 -0,650.54 392.07,882.29 392.07,472.33"/>
                      </g>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-neon-green">Ethereum Escrows</h2>
                </div>
                <div className="text-3xl font-bold mb-2 text-white">0</div>
                <div className="text-sm text-gray-400">Active Contracts</div>
                
                <div className="mt-4">
                  <Link 
                    href="/ethereum" 
                    className="text-neon-green hover:text-acid-green font-medium text-sm inline-flex items-center"
                  >
                    Create new
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
              
              <div className="bg-charcoal p-6 rounded-lg shadow-md border border-neon-green/30 hover:border-neon-green/50 transition-all">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center mr-3 border border-neon-green/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neon-green" viewBox="0 0 397.7 311.7">
                      <path fill="currentColor" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-neon-green">Solana Escrows</h2>
                </div>
                <div className="text-3xl font-bold mb-2 text-white">0</div>
                <div className="text-sm text-gray-400">Active Programs</div>
                
                <div className="mt-4">
                  <Link 
                    href="/solana" 
                    className="text-neon-green hover:text-acid-green font-medium text-sm inline-flex items-center"
                  >
                    Create new
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-charcoal p-6 rounded-lg shadow-md mb-8 border border-neon-green/30">
              <h2 className="text-xl font-semibold mb-4 text-neon-green">All Escrows</h2>
              
              <div className="mb-4">
                <div className="flex space-x-2 mb-4">
                  <button 
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 rounded-md font-medium ${
                      activeFilter === 'all' 
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                        : 'text-gray-200 hover:bg-neon-green/10 hover:text-neon-green border border-transparent'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setActiveFilter('ethereum')}
                    className={`px-4 py-2 rounded-md font-medium ${
                      activeFilter === 'ethereum' 
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                        : 'text-gray-200 hover:bg-neon-green/10 hover:text-neon-green border border-transparent'
                    }`}
                  >
                    Ethereum
                  </button>
                  <button 
                    onClick={() => setActiveFilter('solana')}
                    className={`px-4 py-2 rounded-md font-medium ${
                      activeFilter === 'solana' 
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                        : 'text-gray-200 hover:bg-neon-green/10 hover:text-neon-green border border-transparent'
                    }`}
                  >
                    Solana
                  </button>
                </div>
              </div>
              
              <div className="text-center text-gray-400 py-16">
                <div className="text-5xl mb-4 opacity-50">🔍</div>
                <h3 className="text-xl font-medium mb-2 text-neon-green">No escrows found</h3>
                <p>Create a new escrow contract to get started</p>
                <p className="text-sm mt-2 text-gray-500">Connected wallet: <span className="text-neon-green">{address}</span></p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
} 