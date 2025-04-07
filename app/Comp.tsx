import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import abi from "./abi.json"

const Comp = () => {
    const [isStaked, setIsStaked] = useState(false)
    const { address } = useAccount()
    
    const contractAddress = "0x26D83be2E1aB00168cc859595296C87d04221a82"
    
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
    

    // Function to fetch user points

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
                args: [[1]], // Pass the arguments as needed
            })
            
            // Update points after successful staking
    
        } catch (err) {
            console.error("Transaction failed:", err)
            alert("Transaction failed. See console for details.")
        } finally {
            setIsStaked(true);
        }
    }

    return (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            {!isStaked ? (
                <>
                    <Image
                        src="/next.svg"
                        alt="Game logo"
                        width={120}
                        height={120}
                        className="mb-6 dark:invert"
                        priority
                    />
                    <h2 className="text-xl font-bold mb-3">Ready to Play?</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Stake your tokens to join the adventure and earn amazing rewards!
                    </p>
                    <button
                        onClick={handleStake}
                        disabled={isPending || isConfirming}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending || isConfirming ? 'Processing...' : 'Stake Now'}
                    </button>
                    {error && (
                        <p className="text-red-500 mt-2">
                            Error: {error.message}
                        </p>
                    )}
                </>
            ) : (
                <>
                    <div className="mb-6 bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                        <p className="text-green-700 dark:text-green-300 font-medium">
                            You&apos;re successfully staked!
                        </p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Your adventure awaits. Click below to start playing!
                    </p>
                    <Link
                        href="/game"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full transition-colors"
                    >
                        Start Game
                    </Link>
                </>
            )}
        </div>
    )
}

export default Comp