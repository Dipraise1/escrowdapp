'use client';

import React from 'react'
import Link from 'next/link'
import { useWallet } from './hooks/useWallet';

export default function Home() {
  const { isConnected } = useWallet();
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 grid-pattern">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono">
        <h1 className="text-5xl font-bold text-center mb-6 text-white">
          <span className="text-neon-green drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]">Crypto</span>Escrow
        </h1>
        <p className="text-center mb-12 text-lg text-gray-300">
          Secure transactions on both Ethereum and Solana blockchains
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Link 
            href="/ethereum"
            className="flex flex-col items-center p-8 rounded-lg bg-charcoal border border-neon-green/30 hover:shadow-neon-green-sm hover:border-neon-green/70 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4 text-neon-green" viewBox="0 0 784.37 1277.39">
              <g>
                <polygon fill="currentColor" fillRule="nonzero" points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54"/>
                <polygon fill="currentColor" fillRule="nonzero" points="392.07,0 -0,650.54 392.07,882.29 392.07,472.33"/>
                <polygon fill="currentColor" fillRule="nonzero" points="392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89"/>
                <polygon fill="currentColor" fillRule="nonzero" points="392.07,1277.38 392.07,956.52 -0,724.89"/>
              </g>
            </svg>
            <h2 className="text-2xl font-bold text-neon-green">Ethereum Escrow</h2>
            <p className="text-center mt-2 text-gray-300">Create and manage escrow contracts on Ethereum</p>
          </Link>
          
          <Link 
            href="/solana"
            className="flex flex-col items-center p-8 rounded-lg bg-charcoal border border-neon-green/30 hover:shadow-neon-green-sm hover:border-neon-green/70 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4 text-neon-green" viewBox="0 0 397.7 311.7">
              <path fill="currentColor" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
              <path fill="currentColor" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
              <path fill="currentColor" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
            </svg>
            <h2 className="text-2xl font-bold text-neon-green">Solana Escrow</h2>
            <p className="text-center mt-2 text-gray-300">Create and manage escrow programs on Solana</p>
          </Link>
        </div>
        
        {isConnected && (
          <div className="text-center mt-12">
            <Link
              href="/dashboard"
              className="neon-button inline-block py-3 px-6 rounded-lg text-lg"
            >
              View Your Dashboard
            </Link>
          </div>
        )}
      </div>
    </main>
  );
} 