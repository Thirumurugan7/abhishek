import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import NextComp from './NextComp'

const Comp = () => {
    const [showNextScreen, setShowNextScreen] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [astrBalance, setAstrBalance] = useState("0")
    const [hasEnoughAstr, setHasEnoughAstr] = useState(false)
    const { address } = useAccount()
    const publicClient = usePublicClient()
    
    // const contractAddress = "0x1E86eD75Fd3a8faaf2FB6e51FCF86A0784da1606"
    
    // Use Wagmi's hooks for contract interaction
    const { data: hash } = useWriteContract()
    
    // Monitor transaction status
    const {  } = 
        useWaitForTransactionReceipt({ 
            hash,
        })

        const [userPoints, setUserPoints] = useState(0);

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
    
    // Check ASTR balance when address changes
    useEffect(() => {
        if (address) {
            checkAstrBalance(address);


            getPoints();
        }
    }, [address, publicClient])
    
    // Update UI when transaction is confirmed

    
  

    // Handle navigation to next screen
    const handleNext = () => {
        if (hasEnoughAstr) {
            setShowNextScreen(true)
        } else {
            setShowModal(true)
        }
    }

    // Handle navigation back to main screen

    
    // Handle Get ASTR button click
    const handleGetAstr = () => {
        window.open('https://app.kyo.finance/swap', '_blank')
    }

    // If showing the next screen, render NextComp
    if (showNextScreen) {
        return <NextComp  />
    }




    const walletAddress = address?.substring(0, 6) + "..." + address?.substring(address?.length - 4);

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

if(balance){
    BigInt(balance.toString())
    const balanceInEth = formatEther(BigInt(balance.toString()))

    setAstrBalance(balanceInEth)

    const hasEnough = parseFloat(balanceInEth) >= 0.1
    setHasEnoughAstr(hasEnough)
    
    // If balance is good, automatically trigger next screen
    if (hasEnough) {
        setShowNextScreen(true)
    }
    return balance;

}           
        } catch (error) {
            console.error("Error checking ASTR balance:", error);
            return null;
        }
    }

    return (
        !address ? (
            <div className="flex flex-col items-center justify-center w-full h-full py-8 px-4 rounded-3xl " style={{
                background: 'radial-gradient(circle at center, #CE56C0 0%, #CE56C0 30%, #DC0070 70%, #DC0070 100%)',
                minHeight: '600px'
            }}>
                  
                {/* RPS CORE Logo */}
                <div className="text-center mb-8 mt-0">
                  <Image src="/RPS.svg" alt="RPS CORE" width={150} height={150} />
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
                <ConnectButton.Custom>
                    {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        authenticationStatus,
                        mounted,
                    }) => {
                        const ready = mounted && authenticationStatus !== 'loading';
                        const connected =
                            ready &&
                            account &&
                            chain &&
                            (!authenticationStatus ||
                                authenticationStatus === 'authenticated');
                        return (
                            <div
                                {...(!ready && {
                                    'aria-hidden': true,
                                    'style': {
                                        opacity: 0,
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    },
                                })}
                            >
                                {(() => {
                                    if (!connected) {
                                        return (
                                            <button
                                                onClick={openConnectModal}
                                                type="button"
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
                                                Connect Wallet
                                            </button>
                                        );
                                    }
                                    if (chain.unsupported) {
                                        return (
                                            <button
                                                onClick={openChainModal}
                                                type="button"
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
                                                Wrong network
                                            </button>
                                        );
                                    }
                                    return (
                                        <div className="flex justify-center items-center gap-2 mt-8 mb-4">
                                            <button
                                                onClick={openChainModal}
                                                type="button"
                                                className="flex justify-center items-center gap-2 text-black text-xl font-bold shadow-lg transition-all hover:shadow-xl"
                                                style={{ 
                                                    fontFamily: 'Arial, sans-serif',
                                                    background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                                                    color: '#000000',
                                                    border: '1.5px solid #FFF',
                                                    borderRadius: '20px',
                                                    padding: '8px 16px'
                                                }}
                                            >
                                                {chain.hasIcon && (
                                                    <div
                                                        style={{
                                                            background: chain.iconBackground,
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: 999,
                                                            overflow: 'hidden',
                                                            marginRight: 4,
                                                        }}
                                                    >
                                                        {chain.iconUrl && (
                                                            <img
                                                                alt={chain.name ?? 'Chain icon'}
                                                                src={chain.iconUrl}
                                                                style={{ width: 12, height: 12 }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                {chain.name}
                                            </button>
                                            <button
                                                onClick={openAccountModal}
                                                type="button"
                                                className="flex justify-center items-center gap-2 text-black text-xl font-bold shadow-lg transition-all hover:shadow-xl"
                                                style={{ 
                                                    fontFamily: 'Arial, sans-serif',
                                                    background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                                                    color: '#000000',
                                                    border: '1.5px solid #FFF',
                                                    borderRadius: '20px',
                                                    padding: '8px 16px'
                                                }}
                                            >
                                                {account.displayName}
                                                {account.displayBalance
                                                    ? ` (${account.displayBalance})`
                                                    : ''}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    }}
                </ConnectButton.Custom>
            </div>
        ) : (
            <>
                <div className="flex flex-col items-center justify-center w-full h-full py-8 px-4 rounded-3xl overflow-hidden my-5" style={{
                    background: 'radial-gradient(circle at center, #CE56C0 0%, #CE56C0 30%, #DC0070 70%, #DC0070 100%)',
                    minHeight: '600px'
                }}>
                    <div className="flex justify-between w-full mb-6">
                        {/* Points display with coin icon */}
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center mr-2">
                                <Image src="/points.svg" alt="coin" width={32} height={32} />
                            </div>
                            <span className="text-white font-bold text-xl">{userPoints}</span>
                        </div>
                        
                        {/* Wallet address */}
                        <div className="bg-white rounded-full px-4 py-2 text-sm">
                            <span className='text-black'>{walletAddress}</span>
                        </div>
                    </div>
                    {/* RPS CORE Logo */}
                    <div className="text-center mb-8 mt-0">
                      <Image src="/RPS.svg" alt="RPS CORE" width={150} height={150} />
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
                          {hasEnoughAstr ? 'ASTR OK! Tap Next to get Coins!' : 'Low ASTR ? Get it on KYO Finance to Start!'}
                        </p>
                    </div>
                    
                    {/* Spacer to push button to bottom */}
                    <div className="flex-grow"></div>

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
                            ASTR needed: $10
                        </p>
                        <p className="text-white text-sm mt-2">
                            Your balance: {formatEther(BigInt(astrBalance))} ASTR
                        </p>
                    </div>
                    
                    <button
                        onClick={handleGetAstr}
                        type="button"
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
                        Get ASTR
                    </button>
                    <button
                        onClick={handleNext}
                        type="button"
                        className={`flex justify-center items-center gap-2 text-xl font-bold shadow-lg transition-all hover:shadow-xl mt-0 mb-4 ${hasEnoughAstr ? 'text-black' : 'text-[#8C8C8C]'}`}
                        style={{ 
                            fontFamily: 'Arial, sans-serif',
                            background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
                            border: '1.5px solid #FFF',
                            borderRadius: '20px',
                            width: '264px',
                            height: '66px',
                            padding: '8px 16px 8px 13px'
                        }}
                    >
                        NEXT
                    </button>
                </div>

                {/* Modal as a separate element outside the main component */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-3xl max-w-xs w-full shadow-lg" style={{
                            background: 'radial-gradient(circle at center, #CE56C0 0%, #CE56C0 30%, #DC0070 70%, #DC0070 100%)',
                        }}>
                            <h3 className="text-xl font-bold mb-4 text-white text-center" style={{ 
                                fontFamily: "'Jersey 25', sans-serif",
                            }}>Insufficient ASTR</h3>
                            
                            <p className="mb-6 text-center text-white" style={{ 
                                fontFamily: "'Jersey 25', sans-serif",
                                fontSize: '18px',
                            }}>
                                You need at least 0.1 ASTR to proceed.<br/>
                                Your balance: {astrBalance} ASTR
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleGetAstr}
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
                                
                                <button 
                                    onClick={() => setShowModal(false)}
                                    className="w-full flex justify-center items-center text-gray-600 text-base font-bold shadow-lg"
                                    style={{ 
                                        fontFamily: 'Arial, sans-serif',
                                        background: 'linear-gradient(90deg, #F7CBBF 0%, #CDAFFA 100%)',
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
        )
    );
}

export default Comp