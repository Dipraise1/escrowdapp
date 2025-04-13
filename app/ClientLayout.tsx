'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import NavBar from './components/NavBar';
import { WalletProvider } from './hooks/useWallet';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <NavBar />
      <Toaster position="bottom-right" />
      {children}
    </WalletProvider>
  );
} 