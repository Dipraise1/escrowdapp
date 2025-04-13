import React from 'react'
import Link from 'next/link'
import { useWallet } from '../hooks/useWallet'

const NavBar = () => {
  const { isConnected, connectEthereum, connectSolana, disconnect, currentChain, address, balance } = useWallet();

  const connectWallet = async () => {
    if (isConnected) {
      disconnect();
      return;
    }
    
    // Default to Ethereum
    await connectEthereum();
  };

  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="bg-deep-black border-b border-neon-green/20 p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-neon-green">
            CryptoEscrow
          </span>
        </Link>
        
        <div className="flex space-x-6">
          <Link 
            href="/ethereum" 
            className="text-white hover:text-neon-green transition-colors"
          >
            Ethereum
          </Link>
          <Link 
            href="/solana" 
            className="text-white hover:text-neon-green transition-colors"
          >
            Solana
          </Link>
          <Link 
            href="/dashboard" 
            className="text-white hover:text-neon-green transition-colors"
          >
            Dashboard
          </Link>
        </div>
        
        <div className="flex items-center">
          {isConnected && (
            <div className="flex items-center mr-4">
              <div className={`h-2 w-2 rounded-full ${currentChain === 'ethereum' ? 'bg-neon-green' : 'bg-neon-green'} mr-2 shadow-neon-green-sm`}></div>
              <span className="text-white mr-3">{formatAddress(address)}</span>
              <span className="text-neon-green text-sm">{parseFloat(balance).toFixed(4)} {currentChain === 'ethereum' ? 'ETH' : 'SOL'}</span>
            </div>
          )}
          
          <button 
            onClick={connectWallet}
            className={`${
              isConnected
                ? 'bg-dark-gray border border-neon-green/50 text-neon-green hover:bg-neon-green/10'
                : 'neon-button'
            } font-bold py-2 px-4 rounded-lg transition-all shadow-md`}
          >
            {isConnected ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default NavBar 