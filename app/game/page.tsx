"use client";
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { formatEther, parseEther } from 'viem'

const GamePage = () => {
    const router = useRouter();
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    
    // State for wallet and points
    const [userPoints, setUserPoints] = useState(0);
    const [claimCount, setClaimCount] = useState(0);
    const walletAddress = address?.substring(0, 6) + "..." + address?.substring(address?.length - 4);
    
    // State for input value and calculated output
    const [inputValue, setInputValue] = useState("1");
    const [outputValue, setOutputValue] = useState("100");
    const [balance, setBalance] = useState(0);
    
    // State for modal
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        message: '',
        isClaimModal: false
    });
    
    // Add these state variables
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Constants for conversion
    const MIN_DOLLAR_AMOUNT = 10;
    const ASTR_DOLLAR_RATE = 0.029; // 1 ASTR = $0.029
    

    
    // Function to check ASTR balance
    const checkAstrBalance = async (addressToCheck: string) => {
        try {
            const balance = await publicClient?.readContract({
                address: '0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441',
                abi: [{
                    "constant": true,
                    "inputs": [{"name": "_owner", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "balance", "type": "uint256"}],
                    "type": "function"
                }],
                functionName: 'balanceOf',
                args: [addressToCheck]
            });
            
            console.log(`ASTR Balance for ${addressToCheck}: ${balance}`);
            setBalance(Number(balance?.toString() || '0'));
            return balance;
        } catch (error) {
            console.error("Error checking ASTR balance:", error);
            return null;
        }
    };
    
    // Get user points from API
    const getPoints = async () => {
        if (!address) return;
        
        try {
            const response = await fetch(`/api/points?address=${address}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log("User points:", data);
            setUserPoints(data.currentPoints);
        } catch (error) {
            console.error("Error fetching points:", error);
        }
    };
    
    // Get claim count from API
    const getClaims = async () => {
        if (!address) return;
        
        try {
            const response = await fetch(`/api/claims?address=${address}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log("User claims:", data);
            setClaimCount(data.claimCount);
        } catch (error) {
            console.error("Error fetching claims:", error);
        }
    };
    
    // Update output value whenever input changes
    useEffect(() => {
        // Calculate ASTR amount based on dollar input
        const dollarAmount = parseFloat(inputValue) || 0;
        // const astrAmount = (dollarAmount / ASTR_DOLLAR_RATE).toFixed(2);
        setOutputValue(Number(dollarAmount * 100).toString());
    }, [inputValue]);
    
    // Check balance and get points when address changes
    useEffect(() => {
        if (address) {
            checkAstrBalance(address);
            getPoints();
            getClaims();
        }
    }, [address]);
    
    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers and decimal point
        const value = e.target.value.replace(/[^0-9.]/g, '');
        setInputValue(value);
    };
    
    // Handle claim button click
    const handleClaim = async () => {
        if (!address) {
            setShowModal(true);
            setModalContent({
                title: 'Wallet Not Connected',
                message: 'Please connect your wallet to continue.',
                isClaimModal: true
            });
            return;
        }
        
        try {
            // Show claiming modal
            setShowModal(true);
            setModalContent({
                title: 'Claiming',
                message: 'Processing your claim...',
                isClaimModal: true
            });
            
            // Call claim function on contract
            const hash = await writeContractAsync({
                address: '0x16c70B621Ba8A14c13804B2318a0BcBf0D21Ec98',
                abi: [{
                    "inputs": [
                        {"internalType": "address", "name": "_receiver", "type": "address"},
                        {"internalType": "uint256", "name": "_quantity", "type": "uint256"},
                        {"internalType": "address", "name": "_currency", "type": "address"},
                        {"internalType": "uint256", "name": "_pricePerToken", "type": "uint256"},
                        {"internalType": "tuple", "name": "_allowlistProof", "type": "tuple", 
                         "components": [
                             {"internalType": "bytes32[]", "name": "", "type": "bytes32[]"},
                             {"internalType": "uint256", "name": "", "type": "uint256"},
                             {"internalType": "uint256", "name": "", "type": "uint256"},
                             {"internalType": "address", "name": "", "type": "address"}
                         ]},
                        {"internalType": "bytes", "name": "_data", "type": "bytes"}
                    ],
                    "name": "claim",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }],
                functionName: 'claim',
                args: [
                    address, // receiver
                    BigInt(10000000000000000000), // quantity 
                    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // currency address (zero for native)
                    BigInt(500000000000), // price per token
                    [
                        [], // bytes32[]
                        BigInt(0), // uint256
                        BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'), // max uint256
                        "0x0000000000000000000000000000000000000000" // address
                    ],
                    '0x' // empty data
                ]
            });

            if (!hash) {
                throw new Error('Transaction failed');
            }

       
            await publicClient?.waitForTransactionReceipt({ 
                hash: hash as `0x${string}` 
            });

            // Call the claims API
            const response = await fetch('/api/claims', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: address
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to claim');
            }
            
            const data = await response.json();
            
            // Award points for claiming
            await fetch('/api/points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: address,
                    points: 0, // Award 10 points per claim
                    reason: 'claiming'
                })
            });
            
            // Refresh data
            await getPoints();
            await getClaims();
            
            // Show success modal
            setModalContent({
                title: 'Success!',
                message: `You have successfully claimed and earned 10 points! Total claims: ${data.claimCount}`,
                isClaimModal: true
            });


            
            // Hide modal after a delay
            setTimeout(() => {
                setShowModal(false);
            }, 3000);
            
        } catch (error) {
            console.error("Error claiming:", error);
            
            // Show error modal with isClaimModal flag
            setShowModal(true);
            setModalContent({
                title: 'Error',
                message: error instanceof Error 
                    ? `Error claiming: ${error.message}` 
                    : 'There was an error processing your claim. Please try again.',
                isClaimModal: true
            });
        }
    };
    
    // Handle lock ASTR button click
    const handleLockASTR = async () => {
        if (!address) {
            setShowModal(true);
            setModalContent({
                title: 'Wallet Not Connected',
                message: 'Please connect your wallet to continue.',
                isClaimModal: false
            });
            return;
        }
        
        try {
            // Get dollar amount from input
            const dollarAmount = parseFloat(inputValue) || 0;
            
            // Check if dollar amount is at least $10
            if (dollarAmount < MIN_DOLLAR_AMOUNT) {
                setShowModal(true);
                setModalContent({
                    title: 'Minimum Amount Required',
                    message: `Please enter at least $${MIN_DOLLAR_AMOUNT} worth of ASTR to continue.`,
                    isClaimModal: false
                });
                return;
            }
            
            // Calculate ASTR amount needed
            const astrAmount = dollarAmount / ASTR_DOLLAR_RATE;
            const astrAmountInWei = parseEther(astrAmount.toString());
            
            console.log(`Dollar amount: $${dollarAmount}`);
            console.log(`ASTR amount: ${astrAmount}`);
            console.log(`ASTR in wei: ${astrAmountInWei}`);
            
            // Check if user has enough ASTR
            if (BigInt(balance) < astrAmountInWei) {
                setShowModal(true);
                setModalContent({
                    title: 'Insufficient ASTR Balance',
                    message: `You need ${astrAmount.toFixed(2)} ASTR (${dollarAmount.toFixed(2)}$) but you only have ${formatEther(BigInt(balance))} ASTR.`,
                    isClaimModal: false
                });
                return;
            }
            
            // Show modal
            setShowModal(true);
            
            // Check allowance first
            const allowance = await publicClient?.readContract({
                address: '0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441',
                abi: [{
                    "constant": true,
                    "inputs": [
                        {"name": "_owner", "type": "address"},
                        {"name": "_spender", "type": "address"}
                    ],
                    "name": "allowance", 
                    "outputs": [{"name": "", "type": "uint256"}],
                    "type": "function"
                }],
                functionName: 'allowance',
                args: [address, '0x15c416e97Ab1f7B60afA2558B4Acf92a33A886FA']
            });

            if ((allowance as bigint) < astrAmountInWei) {
                console.log("Approval required");
                
                // Show approving modal
                setModalContent({
                    title: 'Approving ASTR',
                    message: 'Please confirm the transaction in your wallet to approve ASTR...',
                    isClaimModal: false
                });

                // Call approve
                const approveHash = await writeContractAsync({
                    address: '0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441',
                    abi: [{
                        "inputs": [
                            {"name": "_spender", "type": "address"},
                            {"name": "_value", "type": "uint256"}
                        ],
                        "name": "approve",
                        "outputs": [{"name": "", "type": "bool"}],
                        "type": "function"
                    }],
                    functionName: 'approve',
                    args: ['0x15c416e97Ab1f7B60afA2558B4Acf92a33A886FA', astrAmountInWei]
                });

                // For the approval transaction
                if (approveHash) {
                    try {
                        await publicClient?.waitForTransactionReceipt({ 
                            hash: approveHash as `0x${string}` 
                        });
                        console.log("Approval transaction confirmed");
                    } catch (error) {
                        console.error("Error waiting for approval:", error);
                        throw error;
                    }
                }
            }

            // Show staking modal
            setModalContent({
                title: 'Staking ASTR',
                message: `Please confirm the transaction in your wallet to stake ${astrAmount.toFixed(2)} ASTR...`,
                isClaimModal: false
            });

            // Call stake function
            const stakeHash = await writeContractAsync({
                address: '0x15c416e97Ab1f7B60afA2558B4Acf92a33A886FA',
                abi: [{
                    "inputs": [
                        {"name": "_amount", "type": "uint256"}
                    ],
                    "name": "stake",
                    "outputs": [],
                    "type": "function"
                }],
                functionName: 'stake',
                args: [astrAmountInWei]
            });

            // For the stake transaction
            if (stakeHash) {
                try {
                    await publicClient?.waitForTransactionReceipt({ 
                        hash: stakeHash as `0x${string}` 
                    });
                    console.log("Stake transaction confirmed");
                    
                    // Post points to API after successful stake
                    try {
                        const pointsToAward = Math.floor(dollarAmount * 100) + userPoints; // Convert dollar amount to points
                        const response = await fetch('/api/points', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                address: address,
                                points: pointsToAward,
                                reason: 'locking'
                            })
                        });

                        if (!response.ok) {
                            console.error('Failed to update points:', await response.text());
                        } else {
                     
                            
                            // Refresh points and claims
                            await getPoints();
                            await getClaims();
                        }
                    } catch (error) {
                        console.error('Error updating points:', error);
                    }
                    
                    // Show success modal
                    setModalContent({
                        title: 'Success!',
                        message: `You have successfully locked ${astrAmount.toFixed(2)} ASTR and earned points!`,
                        isClaimModal: false 
                    });
                    
                    // Redirect to game start after a delay
                    // setTimeout(() => {
                    //     setShowModal(false);
                    //     router.push('/game/start');
                    // }, 3000);
                    
                } catch (error) {
                    console.error("Error waiting for stake:", error);
                    throw error;
                }
            }
            
        } catch (error) {
            console.error("Error locking ASTR:", error);
            // Add detailed error logging
            if (error instanceof Error) {
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
            }
            
            // Show more specific error message to user
            setShowModal(true);
            setModalContent({
                title: 'Error',
                message: error instanceof Error 
                    ? `Error: ${error.message}` 
                    : 'There was an error locking your ASTR. Please try again.',
                isClaimModal: false
            });
        }
    };

    // Update the handleUnlockASTR function
    const handleUnlockASTR = async () => {
        console.log("Unlocking ASTR");

        if(!address) {
            setShowModal(true);
            setModalContent({
                title: 'Wallet Not Connected',
                message: 'Please connect your wallet to continue.',
                isClaimModal: false
            });
            return;
        }

        // Show confirmation modal instead of proceeding directly
        setShowConfirmModal(true);
    };

    // Add a new function to handle the actual unlock after confirmation
    const confirmUnlockASTR = async () => {
        setShowConfirmModal(false);
        
        try {
            if(userPoints > 1000) {
                console.log("Unlocking ASTR");

                // Show processing modal
                setShowModal(true);
                setModalContent({
                    title: 'Processing',
                    message: 'Withdrawing your staked ASTR...',
                    isClaimModal: false
                });

                // Get staked balance
                const stakedBalance = await publicClient?.readContract({
                    address: '0x15c416e97Ab1f7B60afA2558B4Acf92a33A886FA',
                    abi: [{
                        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
                        "name": "stakers",
                        "outputs": [
                            {"internalType": "uint128", "name": "timeOfLastUpdate", "type": "uint128"},
                            {"internalType": "uint64", "name": "conditionIdOflastUpdate", "type": "uint64"},
                            {"internalType": "uint256", "name": "amountStaked", "type": "uint256"},
                            {"internalType": "uint256", "name": "unclaimedRewards", "type": "uint256"}
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    }],
                    functionName: 'stakers',
                    args: [address as `0x${string}`]
                });

                console.log(stakedBalance);
                console.log(stakedBalance?.[2]);
                if (!stakedBalance) {
                    throw new Error('Could not get staked balance');
                }

   
                // Call withdraw function
                const hash = await writeContractAsync({
                    address: '0x15c416e97Ab1f7B60afA2558B4Acf92a33A886FA',
                    abi: [{
                        "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
                        "name": "withdraw", 
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }],
                    functionName: 'withdraw',
                    args: [stakedBalance[2]]
                });

                if (!hash) {
                    throw new Error('Transaction failed');
                }

                // Wait for transaction confirmation
                 await publicClient?.waitForTransactionReceipt({ hash });

                setModalContent({
                    title: 'Success!',
                    message: `Successfully withdrew ${formatEther(stakedBalance[2] as bigint)} ASTR`,
                    isClaimModal: true
                });
            } else {
                setShowModal(true);
                setModalContent({
                    title: 'Insufficient Points',
                    message: 'You need more than 1000 points to unlock ASTR.',
                    isClaimModal: false
                });
            }
        } catch (error) {
            console.error("Error unlocking ASTR:", error);
            
            // Show error modal
            setShowModal(true);
            setModalContent({
                title: 'Error',
                message: error instanceof Error 
                    ? `Error: ${error.message}` 
                    : 'There was an error unlocking your ASTR. Please try again.',
                isClaimModal: false
            });
        }
    };
    
    return (
        <div className="flex items-center justify-center h-[100vh]" style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #CE566E 0%, rgba(255, 52, 143, 0.79) 78.85%)',
            boxShadow: '0px 4px 89.4px 0px rgba(0, 0, 0, 0.25)'
        }}>
            {/* Mobile screen container */}
            <div className="w-full max-w-md rounded-3xl shadow-lg overflow-hidden h-[100vh] flex flex-col">
                <div className="flex flex-col items-center justify-center w-full h-full py-8 px-4 rounded-3xl" style={{
                    background: 'radial-gradient(circle at center, #CE56C0 0%, #CE56C0 30%, #DC0070 70%, #DC0070 100%)',
                    minHeight: '600px'
                }}>
                    {/* Header with points and wallet address */}
                    <div className="flex justify-between w-full mb-6">
                        {/* Points display with coin icon */}
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center mr-2">
                                <Image src="/points.svg" alt="coin" width={24} height={24} />
                            </div>
                            <span className="text-white font-bold text-xl">{userPoints}</span>
                        </div>
                        
                        {/* Wallet address */}
                        <div className="bg-white rounded-full px-4 py-2 text-sm">
                            <span className="text-black">{walletAddress || "Not connected"}</span>
                        </div>
                    </div>
                    
                    {/* RPS CORE Logo */}
                    <div className="text-center mb-4">
                        <Image src="/RPS.svg" alt="RPS CORE" width={150} height={150} />
                    </div>
                    
                    {/* Tagline */}
                    <div className="text-center mb-6">
                        <p style={{ 
                            fontFamily: "'Jersey 25', sans-serif",
                            fontSize: '30px',
                            fontWeight: 400,
                            lineHeight: '100%',
                            letterSpacing: '0',
                            color: '#DDFBFF',
                            textAlign: 'center'
                        }}>
                          Claim 10+ times daily or more<br />to double daily ACS reward!
                        </p>
                    </div>
                    
                    {/* Swap UI with overlapping arrow */}
                    <div className="flex items-center justify-center relative mt-10 max-sm:flex-col max-sm:gap-2.5">
                        {/* Left input box */}
                        <div className="h-[52px] flex items-center w-[153px] bg-[#EEEAF4] px-[15px] py-0 rounded-[10px] max-sm:w-[80%] z-0 mr-1">
                            <div className="font-bold text-[13px] text-black">$</div>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder='10'
                                className="font-bold text-[13px] text-[rgba(0,0,0,0.35)] bg-transparent outline-none w-10 placeholder:text-[#B2B2B2]"
                                style={{ border: 'none' }}
                            />
                            <div className="  text-black ml-0 font-bold text-[13px]">ASTR</div>
                        </div>
                        
                        {/* Overlapping arrow in the middle */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                            <div className="w-10 h-10 flex items-center justify-center bg-[#D9D9D9] rounded-full">
                                <Image src="/ar.svg" alt="arrow" width={24} height={24} />
                            </div>
                        </div>
                        
                        {/* Right output box */}
                        <div className="h-[52px] flex items-center w-[153px] bg-[#EEEAF4] px-[15px] py-0 rounded-[10px] max-sm:w-[90%] z-0 ml-1">
                            <div className="font-bold text-[13px] text-black flex justify-center items-center gap-2">
                                <span><Image src="/game.svg" alt="game" width={24} height={24} /></span>GAME
                            </div>
                            <div className="font-bold text-[13px] text-[rgba(0,0,0,0.35)] ml-auto">
                                {outputValue}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 text-white text-sm">
                        Balance: {formatEther(BigInt(balance || 0))} ASTR
                    </div>
                    
                    <div className='flex flex-grow'></div>
                    
                    <div className="text-center mb-8 mt-2 pt-4">
                        <p style={{ 
                            fontFamily: "'Jersey 25', sans-serif",
                            fontSize: '24px',
                            fontWeight: 400,
                            lineHeight: '120%',
                            letterSpacing: '0',
                            color: '#DDFBFF',
                            textAlign: 'center'
                        }}>
                          Current Claims: {claimCount}
                        </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col w-full max-w-md gap-3 px-4">
                        <button
                            onClick={handleClaim}
                            type="button"
                            className="w-full flex justify-center items-center text-black text-md font-bold shadow-lg transition-all hover:shadow-xl"
                            style={{ 
                                fontFamily: 'Arial, sans-serif',
                                background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                                color: '#000000',
                                border: '1.5px solid #FFF',
                                borderRadius: '20px',
                                height: '66px',
                                padding: '8px 16px'
                            }}
                        >
                            CLAIM COIN
                        </button>
                        
                        {/* First row - two buttons side by side */}
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={handleLockASTR}
                                type="button"
                                className="flex-1 flex justify-center items-center text-black text-base font-bold shadow-lg transition-all hover:shadow-xl"
                                style={{ 
                                    fontFamily: 'Arial, sans-serif',
                                    background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                                    color: '#000000',
                                    border: '1.5px solid #FFF',
                                    borderRadius: '20px',
                                    height: '66px',
                                    padding: '8px 16px'
                                }}
                            >
                                LOCK ASTR
                            </button>
                            
                            <button
                                onClick={handleUnlockASTR}
                                type="button"
                                className="flex-1 flex justify-center items-center text-black text-base font-bold shadow-lg transition-all hover:shadow-xl"
                                style={{ 
                                    fontFamily: 'Arial, sans-serif',
                                    background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                                    border: '1.5px solid #FFF',
                                    borderRadius: '20px',
                                    height: '66px',
                                    padding: '8px 16px'
                                }}
                            >
                                UNLOCK ASTR
                            </button>
                        </div>

                        <button
                            onClick={()=> router.push('/play')}
                            type="button"
                            className="w-full flex justify-center items-center text-black text-xl font-bold shadow-lg transition-all hover:shadow-xl"
                            style={{ 
                                fontFamily: 'Arial, sans-serif',
                                background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                                color: '#000000',
                                border: '1.5px solid #FFF',
                                borderRadius: '20px',
                                height: '66px',
                                padding: '8px 16px'
                            }}
                        >
Start Game                        </button>
                    
                    </div>
                </div>
            </div>
            
            {/* Modal for transaction status */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{
                    background: 'radial-gradient(50% 50% at 50% 50%, #CE566E 0%, rgba(255, 52, 143, 0.79) 78.85%)',
                    boxShadow: '0px 4px 89.4px 0px rgba(0, 0, 0, 0.25)'
                }}>
                    <div className="bg-white p-6 rounded-3xl max-w-xs w-full shadow-lg" style={{
                        background: 'radial-gradient(circle at center, #CE56C0 0%, #CE56C0 30%, #DC0070 70%, #DC0070 100%)',
                    }}>
                        <h3 className="text-xl font-bold mb-4 text-white text-center" style={{ 
                            fontFamily: "'Jersey 25', sans-serif",
                        }}>{modalContent.title}</h3>
                        
                        <p className="mb-6 text-center text-white" style={{ 
                            fontFamily: "'Jersey 25', sans-serif",
                            fontSize: '18px',
                        }}>
                            {modalContent.message}
                        </p>
                        
                        <div className="flex flex-col gap-3">
{/* {
    !modalContent.isClaimModal && (
        <button 
            onClick={() => window.open('https://app.kyo.finance/swap', '_blank')}
            className="w-full flex justify-center items-center text-black text-base font-bold shadow-lg"
            style={{ 
                fontFamily: 'Arial, sans-serif',
                background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                color: '#000000',
                border: '1.5px solid #FFF',
                borderRadius: '20px',
                height: '50px',
                padding: '8px 16px'
            }}
        >
            Get ASTR
        </button>
    )
} */}
                            <button 
                                onClick={() => setShowModal(false)}
                                className="w-full flex justify-center items-center text-black text-base font-bold shadow-lg"
                                style={{ 
                                    fontFamily: 'Arial, sans-serif',
                                    background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                                    color: '#000000',
                                    border: '1.5px solid #FFF',
                                    borderRadius: '20px',
                                    height: '50px',
                                    padding: '8px 16px'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for Unlock ASTR */}
{showConfirmModal && (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{
        background: 'radial-gradient(50% 50% at 50% 50%, #CE566E 0%, rgba(255, 52, 143, 0.79) 78.85%)',
        boxShadow: '0px 4px 89.4px 0px rgba(0, 0, 0, 0.25)'
    }}>
        <div className="bg-white p-6 rounded-3xl max-w-xs w-full shadow-lg" style={{
            background: 'radial-gradient(circle at center, #CE56C0 0%, #CE56C0 30%, #DC0070 70%, #DC0070 100%)',
        }}>
            <div className="flex justify-end">
                <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="text-white hover:text-gray-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <h3 className="text-xl font-bold mb-4 text-center text-white" style={{ 
                fontFamily: "'Jersey 25', sans-serif",
            }}>ARE YOU SURE ?</h3>
            
            <p className="mb-6 text-center text-white" style={{ 
                fontFamily: "'Jersey 25', sans-serif",
                fontSize: '18px',
            }}>
                If you unlock ASTR now, you wont be able to Claim COINs
            </p>
            
            <div className="flex justify-center">
                <button 
                    onClick={confirmUnlockASTR}
                    className="w-full flex justify-center items-center text-black text-base font-bold shadow-lg"
                    style={{ 
                        fontFamily: 'Arial, sans-serif',
                        background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                        color: '#000000',
                        border: '1.5px solid #FFF',
                        borderRadius: '20px',
                        height: '50px',
                        padding: '8px 16px'
                    }}
                >
                    UNLOCK
                </button>
            </div>
        </div>
    </div>
)}
        </div>
    );
};

export default GamePage; 