import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi';
import GameComp from './GameComp';

const GameStartComp = () => {
    const router = useRouter();
    
    // Add state for showing GameComp
    const [showGameComp, setShowGameComp] = useState(false);

    const [claimCount, setClaimCount] = useState(0);
    
    // Mock data for demonstration
    const [userPoints, setUserPoints] = useState(0);
    const {address} = useAccount()
    const walletAddress = address?.substring(0, 6) + "..." + address?.substring(address?.length - 4);
    
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
    }

    const handleClaim = async () => {
        const response = await fetch(`/api/claims?address=${address}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log(data);

        setClaimCount(data.claimCount);
    }

    useEffect(() => {
        handleClaim();
        getPoints();
    }, [address]);
    
    // Handle start game button click
    const handleStartGame = () => {
        router.push('/play');
    };
    
    // Handle lock ASTR button click
    const handleLockAstr = () => {
        setShowGameComp(true);
    };
    
    // Handle back from GameComp
    const handleBackFromGameComp = () => {
        setShowGameComp(false);
    };
    
    // If showing GameComp, render it
    if (showGameComp) {
        return <GameComp goBack={handleBackFromGameComp} />;
    }

  
    
    return (
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
            
            {/* Tagline - Changed for game start */}
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
                  Start your first match now!<br />Win rounds for COINs & ACS!
                </p>
            </div>
            
            {/* Game token display - only right side */}
            <div className="flex items-center justify-center mt-10">
              {/* Centered and larger game token display */}
              <div className="h-[60px] flex items-center w-[200px] bg-[#EEEAF4] px-[20px] py-0 rounded-[10px]">
                <div className="font-bold text-[16px] text-black flex justify-center items-center gap-2">
                  <span><Image src="/game.svg" alt="game" width={36} height={36} /></span>GAME
                </div>
                <div className="font-bold text-[16px] text-[rgba(0,0,0,0.35)] ml-auto">
                  ${userPoints}
                </div>
              </div>
            </div>

                     
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
                  Current Round Played: {claimCount}
                </p>
            </div>
         
            <div className='flex flex-grow'></div>
      
            
            
            {/* Start Game Button */}
            {/* <div className="w-full max-w-md px-4 mb-4">
                <button
                    onClick={handleStartGame}
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
                    START GAME
                </button>
            </div> */}

            <div className="flex flex-col w-full max-w-md gap-3 px-4">
                {/* First row - two buttons side by side */}
                <div className="flex gap-4 w-full">
                    <button 
                        onClick={handleLockAstr}
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
                    onClick={handleStartGame}
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
                    START GAME
                </button>
            </div>
        </div>
    );
}

export default GameStartComp; 