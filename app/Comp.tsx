import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import abi from "./abi.json"

const Comp = () => {
    const [isStaked, setIsStaked] = useState(false)
    const { address } = useAccount()
    
    const contractAddress = "0x1E86eD75Fd3a8faaf2FB6e51FCF86A0784da1606"
    
    // Use Wagmi's hooks for contract interaction
    const { data: hash, isPending, error, writeContract } = useWriteContract()
    
    // Monitor transaction status
    const { isLoading: isConfirming, isSuccess: isConfirmed } = 
        useWaitForTransactionReceipt({ 
            hash,
        })
    
    // Update UI when transaction is confirmed
    useEffect(() => {
        if (isConfirmed) {
            setIsStaked(true)
        }
    }, [isConfirmed])
    
    const handleStake = async () => {
        if (!address) {
            console.log("Please connect your wallet")
            alert("Please connect your wallet")
            return
        }
        
        try {
            localStorage.setItem("address", address)
            // Call the contract using Wagmi
            writeContract({
                address: contractAddress,
                abi: abi,
                functionName: 'stake',
                args: [1], // Pass the arguments as needed
            })
        } catch (err) {
            console.error("Transaction failed:", err)
            alert("Transaction failed. See console for details.")
        } finally {
            setIsStaked(true);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center w-full h-full py-8 px-4 rounded-3xl" style={{
            background: 'radial-gradient(circle at center, #CE56C0 0%, #CE56C0 30%, #DC0070 70%, #DC0070 100%)',
            minHeight: '600px'
        }}>
            {/* RPS CORE Logo */}
            <div className="text-center mb-8 mt-0">
              <Image src="/logo.png" alt="RPS CORE" width={150} height={150} />
            </div>
            
            {/* Tagline */}
            <div className="text-center mb-auto">
                <p style={{ 
                    fontFamily: "'Jersey 25', sans-serif",
                    fontSize: '30px',
                    fontWeight: 400,
                    lineHeight: '100%',
                    letterSpacing: '0',
                    color: '#DDFBFF',
                    textAlign: 'center'
                }}>
                    Play RPS, Lock ASTR, Win<br />GAME Tokens!
                </p>
            </div>
            
            {/* Spacer to push button to bottom */}
            <div className="flex-grow"></div>
            
            {/* Connect Wallet Button (Bottom) */}
            <button
                onClick={handleStake}
                disabled={isPending || isConfirming}
                className="flex justify-center items-center gap-2 text-black text-xl font-bold shadow-lg transition-all hover:shadow-xl mt-8 mb-4"
                style={{ 
                    fontFamily: 'Arial, sans-serif',
                    background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                    color: '#000000',
                    border: '1.5px solid #FFF',
                    borderRadius: '20px',
                    width: '264px',
                    height: '66px',
                    padding: '8px 16px 8px 13px'
                }}
            >
                {isPending || isConfirming ? 'Processing...' : 'Connect Wallet'}
            </button>
        </div>
    )
}

export default Comp