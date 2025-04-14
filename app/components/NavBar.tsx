import React, { useState } from 'react'
import Link from 'next/link'
import { useWallet } from '../hooks/useWallet'
import { classNames } from '../lib/classNames'

const NavBar = () => {
  const { isConnected, connectEthereum, connectSolana, disconnect, currentChain, address, balance } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const connectWallet = async () => {
    if (isConnected) {
      disconnect();
      return;
    }
    
    // Default to Ethereum
    await connectEthereum();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="bg-deep-black border-b border-neon-green/20 p-4 shadow-md relative z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl sm:text-2xl font-bold text-neon-green">
            CryptoEscrow
          </span>
        </Link>
        
        {/* Hamburger menu button - only visible on mobile */}
        <button 
          onClick={toggleMenu}
          className="md:hidden flex flex-col space-y-1.5 p-2 focus:outline-none"
          aria-label="Toggle menu"
        >
          <span className={classNames(
            "w-6 h-0.5 bg-neon-green transition-transform duration-300",
            isMenuOpen ? "transform rotate-45 translate-y-2" : ""
          )}></span>
          <span className={classNames(
            "w-6 h-0.5 bg-neon-green transition-opacity duration-300",
            isMenuOpen ? "opacity-0" : "opacity-100"
          )}></span>
          <span className={classNames(
            "w-6 h-0.5 bg-neon-green transition-transform duration-300",
            isMenuOpen ? "transform -rotate-45 -translate-y-2" : ""
          )}></span>
        </button>
        
        {/* Desktop navigation links */}
        <div className="hidden md:flex space-x-6">
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
        
        {/* Desktop wallet button */}
        <div className="hidden md:flex items-center">
          {isConnected && (
            <div className="flex items-center mr-4">
              <div className={`h-2 w-2 rounded-full bg-neon-green mr-2 shadow-neon-green-sm`}></div>
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
      
      {/* Mobile menu - only visible when menu is open */}
      <div className={classNames(
        "md:hidden fixed inset-0 bg-deep-black bg-opacity-95 z-40 transition-all duration-300 transform",
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full pt-20 px-6 pb-8">
          <div className="flex flex-col space-y-4 mb-8">
            <Link 
              href="/ethereum" 
              className="text-white hover:text-neon-green transition-colors py-2 border-b border-neon-green/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Ethereum
            </Link>
            <Link 
              href="/solana" 
              className="text-white hover:text-neon-green transition-colors py-2 border-b border-neon-green/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Solana
            </Link>
            <Link 
              href="/dashboard" 
              className="text-white hover:text-neon-green transition-colors py-2 border-b border-neon-green/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          </div>
          
          {/* Mobile wallet info */}
          <div className="mt-auto">
            {isConnected && (
              <div className="flex flex-col space-y-2 mb-4 p-3 bg-charcoal rounded-lg border border-neon-green/20">
                <div className="flex items-center">
                  <div className={`h-2 w-2 rounded-full bg-neon-green mr-2 shadow-neon-green-sm`}></div>
                  <span className="text-gray-300 text-sm">Connected as</span>
                </div>
                <div className="text-neon-green break-all text-sm">{address}</div>
                <div className="text-white text-sm">{parseFloat(balance).toFixed(4)} {currentChain === 'ethereum' ? 'ETH' : 'SOL'}</div>
              </div>
            )}
            
            <button 
              onClick={() => {
                connectWallet();
                setIsMenuOpen(false);
              }}
              className={`w-full ${
                isConnected
                  ? 'bg-dark-gray border border-neon-green/50 text-neon-green hover:bg-neon-green/10'
                  : 'neon-button'
              } font-bold py-3 px-4 rounded-lg transition-all shadow-md`}
            >
              {isConnected ? 'Disconnect' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavBar 