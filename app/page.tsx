"use client";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {  WagmiProvider } from 'wagmi';
import {


  soneium,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: '2977b0e06b2534aef99c17c148fadc67',
  chains: [soneium],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

import Comp from "./Comp";

export default function Home() {

  const queryClient = new QueryClient();


  


  return (

    <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
      <div className="flex items-center justify-center h-[100vh]" style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #CE566E 0%, rgba(255, 52, 143, 0.79) 78.85%)',
            boxShadow: '0px 4px 89.4px 0px rgba(0, 0, 0, 0.25)'
        }}>      {/* Mobile screen container */}
      <div className="w-full max-w-md  rounded-3xl shadow-lg overflow-hidden    h-[100vh] flex flex-col">
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
