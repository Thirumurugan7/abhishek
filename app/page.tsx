"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { useWriteContract, WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { useAccount } from 'wagmi';
import Comp from "./Comp";

export default function Home() {

  const queryClient = new QueryClient();

  const [isStaked, setIsStaked] = useState(false);

  


  return (

    <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      {/* Mobile screen container */}
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col">
        {/* Game header */}
        <div className="p-6 bg-indigo-600 dark:bg-indigo-800 text-white">
          <h1 className="text-2xl font-bold">Crypto Quest</h1>
          <p className="text-sm opacity-80 mt-1">The ultimate blockchain adventure</p>
        </div>
   <div className="flex justify-center mt-5">     <ConnectButton /></div>
        {/* Game content */}
   
   <Comp/>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
          Powered by Blockchain Technology
        </div>
      </div>
    </div>

    </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
