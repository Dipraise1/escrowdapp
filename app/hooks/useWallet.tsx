'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';

type WalletContextType = {
  isConnected: boolean;
  connectEthereum: () => Promise<boolean | void>;
  connectSolana: () => Promise<boolean | undefined | void>;
  disconnect: () => void;
  currentChain: 'ethereum' | 'solana' | null;
  address: string | null;
  provider: any;
  balance: string;
};

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  connectEthereum: async () => {},
  connectSolana: async () => {},
  disconnect: () => {},
  currentChain: null,
  address: null,
  provider: null,
  balance: '0',
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentChain, setCurrentChain] = useState<'ethereum' | 'solana' | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [balance, setBalance] = useState('0');
  const [isBrowser, setIsBrowser] = useState(false);

  // Set isBrowser to true when component mounts in the browser
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Check if wallet is already connected on load
  useEffect(() => {
    if (!isBrowser) return;
    
    const checkConnection = async () => {
      // Check for Ethereum connection
      if (window.ethereum && window.ethereum.selectedAddress) {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);
        setAddress(window.ethereum.selectedAddress);
        setCurrentChain('ethereum');
        setIsConnected(true);
        
        try {
          const balance = await ethProvider.getBalance(window.ethereum.selectedAddress);
          setBalance(ethers.formatEther(balance));
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
      
      // Check for Solana Phantom wallet
      else if (window.solana?.isPhantom && window.solana.isConnected) {
        setProvider(window.solana);
        setAddress(window.solana.publicKey.toString());
        setCurrentChain('solana');
        setIsConnected(true);
        
        try {
          const connection = new Connection('https://api.mainnet-beta.solana.com');
          const balance = await connection.getBalance(new PublicKey(window.solana.publicKey));
          setBalance((balance / 1000000000).toString()); // Convert lamports to SOL
        } catch (error) {
          console.error('Error fetching Solana balance:', error);
        }
      }
    };

    checkConnection();
  }, [isBrowser]);

  const connectEthereum = async () => {
    if (!isBrowser) return false;
    
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        
        setProvider(ethProvider);
        setAddress(accounts[0]);
        setCurrentChain('ethereum');
        setIsConnected(true);
        
        // Get balance
        const balance = await ethProvider.getBalance(accounts[0]);
        setBalance(ethers.formatEther(balance));
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          setAddress(accounts[0] || null);
          setIsConnected(!!accounts[0]);
        });
        
        return true;
      } catch (error) {
        console.error('Error connecting to MetaMask', error);
        return false;
      }
    } else {
      console.log('Please install MetaMask!');
      return false;
    }
  };

  const connectSolana = async () => {
    if (!isBrowser) return false;
    
    if ('solana' in window) {
      try {
        const solana = window.solana;
        if (solana.isPhantom) {
          const response = await solana.connect();
          const publicKey = response.publicKey.toString();
          
          setProvider(solana);
          setAddress(publicKey);
          setCurrentChain('solana');
          setIsConnected(true);
          
          // Get balance
          const connection = new Connection('https://api.mainnet-beta.solana.com');
          const balance = await connection.getBalance(new PublicKey(publicKey));
          setBalance((balance / 1000000000).toString()); // Convert lamports to SOL
          
          return true;
        }
      } catch (error) {
        console.error('Error connecting to Phantom wallet', error);
        return false;
      }
    } else {
      console.log('Please install Phantom wallet!');
      return false;
    }
  };

  const disconnect = () => {
    if (!isBrowser) return;
    
    if (currentChain === 'solana' && provider) {
      provider.disconnect();
    }
    
    setProvider(null);
    setAddress(null);
    setCurrentChain(null);
    setIsConnected(false);
    setBalance('0');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        connectEthereum,
        connectSolana,
        disconnect,
        currentChain,
        address,
        provider,
        balance
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);

// Add window type definitions
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
} 