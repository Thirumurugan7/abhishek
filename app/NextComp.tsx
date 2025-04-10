import React, { useState } from 'react'
import Image from 'next/image'
import GameComp from './GameComp'
const NextComp = () => {
    const [showGameScreen, setShowGameScreen] = useState(false);
    
    // Handle navigation to game screen
    const handleNext = () => {
        setShowGameScreen(true);
    }
    
    // Handle navigation back to this screen
    const handleGameBack = () => {
        setShowGameScreen(false);
    }
    
    // If showing the game screen, render GameComp
    if (showGameScreen) {
        return <GameComp goBack={handleGameBack} />;
    }

   
    return (
        <div className="flex flex-col items-center justify-center w-full h-full py-8 px-4 rounded-3xl overflow-hidden my-5" style={{
            background: 'radial-gradient(circle at center, #CE56C0 0%, #CE56C0 30%, #DC0070 70%, #DC0070 100%)',
            minHeight: '600px'
        }}>
            {/* RPS CORE Logo */}
            <div className="text-center mb-8 mt-0">
              <Image src="/RPS.svg" alt="RPS CORE" width={150} height={150} />
            </div>
            
            {/* Tagline - Changed as requested */}
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
                  ASTR OK! Tap Next to get Coins!
                </p>
            </div>
            
            {/* Spacer to push button to bottom */}
            <div className="flex-grow"></div>
            
            <button
                onClick={handleNext}
                type="button"
                className="flex justify-center items-center gap-2 text-black text-xl font-bold shadow-lg transition-all hover:shadow-xl mt-0 mb-4"
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
    );
}

export default NextComp; 