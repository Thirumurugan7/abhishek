import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import GameStartComp from './GameStartComp'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'

const LockedComp = () => {
    // State for showing game start screen
    const [showGameStartScreen, setShowGameStartScreen] = useState(false);
    
    // Mock data for demonstration
    const [userPoints, setUserPoints] = useState(0);
    const {address} = useAccount()
    const publicClient = usePublicClient()
    const { writeContractAsync } = useWriteContract()
    const getPoints = async () => {
        const response = await fetch(`/api/points?address=${address}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log(data);

        setUserPoints(data.currentPoints);

        // if(data.currentPoints >= 1000) {
        //  setShowLockedScreen(true);
        // }
        
    }
    const walletAddress = address?.substring(0, 6) + "..." + address?.substring(address?.length - 4);
    
    // State for input value and calculated output
    const [inputValue, setInputValue] = useState("1$");
    const [outputValue, setOutputValue] = useState("100");
    
    // Define the missing variables
    const inputCurrency = "ASTR/ETH";
    const outputCurrency = "GAME";

        // Add these constants at the top of your component
        const MIN_DOLLAR_AMOUNT = 10;
        const ASTR_DOLLAR_RATE = 0.029; // 1 ASTR = $0.029
        
    
    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers and decimal point
        const value = e.target.value.replace(/[^0-9.]/g, '');
        setInputValue(value);
        
        // Calculate ASTR amount based on dollar input
        const dollarAmount = parseFloat(value) || 0;
        // const astrAmount = (dollarAmount / ASTR_DOLLAR_RATE).toFixed(2);
        setOutputValue((Number(dollarAmount) * 100).toString());
    };
    // Handle next button click to go to game start screen
    const handleNextToGameStart = () => {
        setShowGameStartScreen(true);
    };

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
            if(balance){
                BigInt(balance.toString())
                const balanceInEth = (balance.toString())
                setBalance(Number(balanceInEth))
            }
            return balance;
        } catch (error) {
            console.error("Error checking ASTR balance:", error);
            return null;
        }
    }


    const [showModal, setShowModal] = useState(false);
    const [balance, setBalance] = useState(0)

    const [modalContent, setModalContent] = useState({
        title: '',
        message: ''
    });
    useEffect(() => {
        if(address) {
            checkAstrBalance(address);
        }
        getPoints();
    }, [address]);
    
    // If showing the game start screen, render GameStartComp
    if (showGameStartScreen) {
        return <GameStartComp />;
    }

    const handleLockASTR = async () => {
        try {
            // Get dollar amount from input
            const dollarAmount = parseFloat(inputValue) || 0;
            
            // Check if dollar amount is at least $10
            if (dollarAmount < MIN_DOLLAR_AMOUNT) {
                setShowModal(true);
                setModalContent({
                    title: 'Minimum Amount Required',
                    message: `Please enter at least $${MIN_DOLLAR_AMOUNT} worth of ASTR to continue.`
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
                    message: `You need ${astrAmount.toFixed(2)} ASTR (${dollarAmount.toFixed(2)}$) but you only have ${formatEther(BigInt(balance))} ASTR.`
                });
                return;
            }
            
            // Continue with approval and staking using astrAmountInWei
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
                setShowModal(true);
                setModalContent({
                    title: 'Approving ASTR',
                    message: 'Please wait while we approve ASTR...'
                });

                // Call approve with the calculated amount
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

                // Wait for approval transaction
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
                message: `Please wait while we stake ${astrAmount.toFixed(2)} ASTR...`
            });

            // Call stake function with the calculated amount
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

            // Wait for stake transaction
            if (stakeHash) {
                try {
                    await publicClient?.waitForTransactionReceipt({ 
                        hash: stakeHash as `0x${string}` 
                    });
                    console.log("Stake transaction confirmed");

                    // Post points to API after successful stake
                    try {
                        const pointsToAward = Math.floor(dollarAmount * 100) + userPoints;  // Convert ASTR amount to points
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
                        }
                    } catch (error) {
                        console.error('Error updating points:', error);
                    }
                    
                    // Hide modal and show success
                    setShowModal(false);
                    getPoints();
                    // setShowGameStartScreen(true);
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
                    : 'There was an error locking your ASTR. Please try again.'
            });
        }
    };
    
    return (
        <>
        <div className="flex flex-col items-center w-full h-full py-8 px-4 rounded-3xl overflow-hidden" style={{
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
                    <span className='text-black'>{walletAddress}</span>
                </div>
            </div>
            
            {/* RPS CORE Logo */}
            <div className="text-center mb-4">
              <Image src="/RPS.svg" alt="RPS CORE" width={150} height={150} />
            </div>
            
            {/* Tagline - Changed for locked state */}
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
                  Thanks for locking ASTR!<br />Unlock after each round!
                </p>
            </div>
            
            {/* Swap UI with overlapping arrow */}
            <div className="flex items-center justify-center relative mt-10 max-sm:flex-col max-sm:gap-2.5">
              {/* Left input box */}
              <div className="h-[52px] flex items-center w-[153px] bg-[#EEEAF4] px-[15px] py-0 rounded-[10px] max-sm:w-[80%] z-0 mr-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder='1$'
                  className="font-bold text-[13px] text-[rgba(0,0,0,0.35)] bg-transparent outline-none w-10 placeholder:text-[#B2B2B2]"
                  style={{ border: 'none' }}
                />
                <div className="text-[10px] text-[#B2B2B2] ml-0">in</div>
                <div className="font-bold text-[13px] ml-2 text-black">{inputCurrency}</div>
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
                  <span><Image src="/game.svg" alt="game" width={30} height={30} /></span>{outputCurrency}
                </div>
                <div className="font-bold text-[13px] text-[rgba(0,0,0,0.35)] ml-auto">
                  ${outputValue}
                </div>
              </div>
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
                  You have some locked ASTR,<br />Click Next to Start
                </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col w-full max-w-md gap-3 px-4">
                {/* First row - two buttons side by side */}
                <div className="flex gap-4 w-full">
                    <button 
                        onClick={handleLockASTR}
                        type="button"
                        className="flex-1 flex justify-center items-center text-black text-base font-bold shadow-lg  transition-all hover:shadow-xl"
                        style={{ 
                            fontFamily: 'Arial, sans-serif',
                            background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                            border: '1.5px solid #FFF',
                            borderRadius: '20px',
                            height: '66px',
                            padding: '15px 16px'
                        }}
                    >
                        LOCK ASTR
                    </button>
                    
                    <button
                        type="button"
                        className="flex-1 flex justify-center items-center text-gray-400 text-base font-bold shadow-lg transition-all hover:shadow-xl"
                        style={{ 
                            fontFamily: 'Arial, sans-serif',
                            background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                            border: '1.5px solid #FFF',
                            borderRadius: '20px',
                            height: '66px',
                            padding: '15px 16px'
                        }}
                    >
                        UNLOCK ASTR
                    </button>
                </div>
                
                {/* Second row - full width button with updated style */}
                <button
                    onClick={handleNextToGameStart}
                    type="button"
                    className="w-full flex justify-center items-center text-black text-base font-bold shadow-lg transition-all hover:shadow-xl"
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
                    NEXT
                </button>
            </div>
        </div>
    {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                    {/* <button 
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
                    </button> */}
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
    </>
    );
}

export default LockedComp; 