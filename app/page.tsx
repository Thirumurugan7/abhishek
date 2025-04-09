"use client";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {  WagmiProvider } from 'wagmi';
import {

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

import Comp from "./Comp";

export default function Home() {

  const queryClient = new QueryClient();


  


  return (

    <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      {/* Mobile screen container */}
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        {/* Game header */}

   {/* <div className="flex justify-center mt-5">     <ConnectButton /></div> */}
        {/* Game content */}
   
   <Comp/>

        {/* Footer */}
      
      </div>
    </div>

    </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
