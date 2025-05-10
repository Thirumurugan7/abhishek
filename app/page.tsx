"use client";
import React, { useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther } from 'viem';

export default function PlayPage() {
  const { address, isConnected } = useAccount();
  const [Address, setAddress] = useState<string | undefined>(address);
  const [gameState, setGameState] = useState({
    walletConnected: false,
    stakedAmount: 0,
    gameUnlocked: false,
    gamesPlayed: 0,
    gamesRequiredToUnstake: 10,
    points: 0
  });

  const [balance, setBalance] = useState<bigint | undefined>(undefined);
  
  const publicClient = usePublicClient()

  const { writeContractAsync, isPending } = useWriteContract();

  const checkBalance = async (address: string): Promise<bigint | undefined> => {
    const balance = await publicClient?.readContract({
      address: '0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441',
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ],
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    console.log("Balance:", balance);

    setBalance(balance as bigint | undefined);
    return balance as bigint | undefined;
  };
  
  // Fetch user points when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchUserPoints(address);
      fetchClaimsData(address);

      console.log("address:", address);

      checkBalance(address);

      localStorage.setItem('address', address);
      
      setAddress(address);
      setGameState(prev => ({
        ...prev,
        walletConnected: true
      }));
      
      // Display wallet in UI
      const connectedWallet = document.getElementById('connected-wallet');
      if (connectedWallet) {
        connectedWallet.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        connectedWallet.style.display = 'block';
      }
      
      // Enable stake button
      const stakeBtn = document.getElementById('stake-btn');
      if (stakeBtn) {
        stakeBtn.classList.remove('btn-disabled');
        (stakeBtn as HTMLButtonElement).disabled = false;
      }
    }
  }, [isConnected, address]);

  // Fetch user points from API
  const fetchUserPoints = async (walletAddress: string) => {
    try {
      // Use the actual API endpoint
      const response = await fetch(`/api/points?address=${walletAddress}`);
      const data = await response.json();

      setAddress(walletAddress);
      
      // The API returns currentPoints instead of points
      if (data && data.currentPoints !== undefined) {
        const currentPoints = data.currentPoints;
        
        setGameState(prev => ({
          ...prev,
          points: currentPoints
        }));
        
        // Update points display
        updatePointsDisplay(currentPoints);
        
        // Enable start game button if points are >= 1000
        checkPointsThreshold(currentPoints);
      } else {
        // If no points found, show 0
        updatePointsDisplay(0);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
      // If error, still show 0 points
      updatePointsDisplay(0);
    }
  };
  
  // Function to check if points meet the threshold
  const checkPointsThreshold = (points: number) => {
    const startGameBtn = document.getElementById('start-game-btn');
    const unstakeBtn = document.getElementById('unstake-btn');
    const infoBox = document.getElementById('info-box-text');
    
    if (startGameBtn) {
      if (points >= 1000) {
        startGameBtn.classList.remove('btn-disabled');
        (startGameBtn as HTMLButtonElement).disabled = false;
        
        // For unstake button, check both points AND games played
        if (unstakeBtn) {
          if (gameState.gamesPlayed >= gameState.gamesRequiredToUnstake) {
            unstakeBtn.classList.remove('btn-disabled');
            (unstakeBtn as HTMLButtonElement).disabled = false;
          } else {
            unstakeBtn.classList.add('btn-disabled');
            (unstakeBtn as HTMLButtonElement).disabled = true;
          }
        }
        
        // Update info box to show game is unlocked
        if (infoBox) {
          infoBox.innerHTML = `
            GAME UNLOCKED!<br />
            YOUR POINTS: ${points}<br />
            READY TO PLAY
          `;
        }
      } else {
        startGameBtn.classList.add('btn-disabled');
        (startGameBtn as HTMLButtonElement).disabled = true;
        
        // Disable unstake button if points are < 1000
        if (unstakeBtn) {
          unstakeBtn.classList.add('btn-disabled');
          (unstakeBtn as HTMLButtonElement).disabled = true;
        }
        
        // Update info box to show points needed
        if (infoBox) {
          infoBox.innerHTML = `
            NEED 1000 POINTS TO PLAY<br />
            YOUR POINTS: ${points}<br />
            POINTS NEEDED: ${1000 - points > 0 ? 1000 - points : 0}
          `;
        }
      }
    }
  };
  
  // Update points in UI
  const updatePointsDisplay = (points: number) => {
    const pointsDisplay = document.getElementById('points-display');
    console.log("Updating points display:", points, pointsDisplay); // Add logging
    
    if (pointsDisplay) {
      pointsDisplay.textContent = `${points} PTS`;
      pointsDisplay.style.display = 'block';
    }
  };
  // Update points after game
  const updatePoints = async (newPoints: number) => {
    if (!address) return;

    
    try {
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          points: gameState.points + newPoints,
          reason: 'Game played'
        }),
      });
      
      const data = await response.json();
      
      if (data && data.currentPoints !== undefined) {
        const updatedPoints = data.currentPoints;
        
        setGameState(prev => ({
          ...prev,
          points: updatedPoints
        }));
        
        // Update points display
        updatePointsDisplay(updatedPoints);
        
        // Check if points meet threshold
        checkPointsThreshold(updatedPoints);
      }
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  useEffect(() => {
    // Initialize game elements after component mounts
    initializeGame();
    
    // Cleanup function
    return () => {
      // Remove any event listeners or timers when component unmounts
      const elements = document.querySelectorAll('.pixel-snake');
      elements.forEach(el => el.remove());
    };
  }, []);
  
  
  // Stake tokens function
  const stakeTokens = async (amount: number) => {
    console.log("Staking tokens:", amount);

    console.log("Address:", Address);

    console.log("address:", address);
    
    console.log("isConnected:", isConnected);

    const addresss = localStorage.getItem('address');

    console.log("addresss:", addresss);

    if (isConnected && address) {
      setAddress(address);
    }

    const balance = addresss ? await checkBalance(addresss) : undefined;

    console.log("balance:", balance);
    console.log("amount:", amount);
    console.log("parseEther(amount.toString()):", parseEther(amount.toString()));

    // if (balance && balance < parseEther(amount.toString())) {
    //   console.log("Not enough balance");
      
    //   // Show error message
    //   const stakeError = document.getElementById('stake-error');
    //   if (stakeError) {
    //     stakeError.textContent = `INSUFFICIENT BALANCE: YOU NEED ${amount} ASTR BUT ONLY HAVE ${parseFloat(formatEther(balance)).toFixed(2)} ASTR`;
    //     stakeError.style.display = 'block';
    //   }
      
    //   // Reset confirm button
    //   const confirmStakeBtn = document.getElementById('confirm-stake-btn');
    //   if (confirmStakeBtn) {
    //     confirmStakeBtn.textContent = 'STAKE TOKENS';
    //     (confirmStakeBtn as HTMLButtonElement).disabled = false;
    //   }
      
    //   return;
    // }
    if (!addresss) return;
    

    try {
      console.log("Staking tokens:", amount); // Add logging
      
      // Show processing state
      const confirmStakeBtn = document.getElementById('confirm-stake-btn');
      if (confirmStakeBtn) {
        confirmStakeBtn.textContent = 'PROCESSING...';
        (confirmStakeBtn as HTMLButtonElement).disabled = true;
      }

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
        args: [addresss, '0x15c416e97Ab1f7B60afA2558B4Acf92a33A886FA']
    });

    console.log("Allowance:", allowance);

    const allowanceBigInt = BigInt(allowance as bigint);
    const amountBigInt = BigInt(parseEther(amount.toString()));

    console.log("allowanceBigInt:", allowanceBigInt);
    console.log("amountBigInt:", amountBigInt);

  //   if (allowanceBigInt < amountBigInt) {
  //     console.log("Approval required");
      
  //     // Show approving modal
   

  //     const astrAmountInWei = parseEther(amount.toString());

      
  //     // Call approve with the calculated amount
  //     const approveHash = await writeContractAsync({
  //         address: '0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441',
  //         abi: [{
  //             "inputs": [
  //                 {"name": "_spender", "type": "address"},
  //                 {"name": "_value", "type": "uint256"}
  //             ],
  //             "name": "approve",
  //             "outputs": [{"name": "", "type": "bool"}],
  //             "type": "function"
  //         }],
  //         functionName: 'approve',
  //         args: ['0x15c416e97Ab1f7B60afA2558B4Acf92a33A886FA', astrAmountInWei]
  //     });

  //     // Wait for approval transaction
  //     if (approveHash) {
  //         try {
  //             await publicClient?.waitForTransactionReceipt({ 
  //                 hash: approveHash as `0x${string}` 
  //             });
  //             console.log("Approval transaction confirmed");
  //         } catch (error) {
  //             console.error("Error waiting for approval:", error);
  //             throw error;
  //         }
  //     }


  // }




    const astrAmountInWei = parseEther(amount.toString());

    console.log("astrAmountInWei:", astrAmountInWei);
    console.log("No allowance");


    // Calculate ETH cost based on token amount (0.0000055 ETH per token)
    const ethCostPerToken = 0.0000015; //0.0000015ETH per token
    const totalEthCost = amount * ethCostPerToken;
    
    // Convert to Wei
    const ethPaymentInWei = parseEther(totalEthCost.toString());
    
    console.log("Amount of tokens:", amount);
    console.log("Total ETH cost:", totalEthCost);
    console.log("Payment in Wei:", ethPaymentInWei);

    
    
    const stakeHash = await writeContractAsync({
      address: '0x155a0d960E76909905446118499Df6E0D0123122',
      abi: [{
          "inputs": [
              {"name": "_receiver", "type": "address"},
              {"name": "_quantity", "type": "uint256"}, 
              {"name": "_currency", "type": "address"},
              {"name": "_pricePerToken", "type": "uint256"},
              {"name": "_allowlistProof", "type": "tuple", "components": [
                  {"name": "proof", "type": "bytes32[]"},
                  {"name": "quantityLimitPerWallet", "type": "uint256"},
                  {"name": "pricePerToken", "type": "uint256"},
                  {"name": "currency", "type": "address"}
              ]},
              {"name": "_data", "type": "bytes"}
          ],
          "name": "claim",
          "outputs": [],
          "type": "function",
          "stateMutability": "payable"
      }],
      functionName: 'claim',
      args: [
        addresss as `0x${string}`,
        parseEther(amount.toString()),
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        BigInt("1500000000000"),

        //
      //   [
      //     [],
      //     "0",
      //     "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      //     "0x0000000000000000000000000000000000000000"
      // ]
      //
        {
          proof: [],
          quantityLimitPerWallet: BigInt('0'),
          pricePerToken: BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
          currency: '0x0000000000000000000000000000000000000000'
        },
        '0x'
      ], 
      value: ethPaymentInWei
  });

const res =   await publicClient?.waitForTransactionReceipt({ 
    hash: stakeHash as `0x${string}` 
});

console.log("res:", res);


console.log("Stake transaction confirmed");

  
if(res && res.status === "success") {
    // Update game state
    setGameState(prev => ({
      ...prev,
      stakedAmount: amount,
      gameUnlocked: true,
      gamesPlayed: 0
    }));

    try {
      console.log("Awarding points for staking"); // Add logging
      
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: addresss,
          points: gameState.points + amount * 1,
          reason: 'Staking tokens'
        }),
      });
      
      const data = await response.json();
      console.log("Points API response:", data); // Add logging
      
      if (data && data.currentPoints !== undefined) {
        const updatedPoints = data.currentPoints;
        
        setGameState(prev => ({
          ...prev,
          points: updatedPoints,
          stakedAmount: amount,
          gameUnlocked: true
        }));
        
        // Update points display
        updatePointsDisplay(updatedPoints);
        
        // Check if points meet threshold
        checkPointsThreshold(updatedPoints);
        
        // Also fetch claims data to ensure everything is in sync
        if (addresss) {
          fetchClaimsData(addresss);
        }
        
        // Update UI elements directly
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn && updatedPoints >= 1000) {
          startGameBtn.classList.remove('btn-disabled');
          (startGameBtn as HTMLButtonElement).disabled = false;
          startGameBtn.textContent = 'START GAME';
        }
        
        // Update the info box
        const infoBox = document.getElementById('info-box-text');
        if (infoBox && updatedPoints >= 1000) {
          infoBox.innerHTML = `
            GAME UNLOCKED!<br />
            YOUR POINTS: ${updatedPoints}<br />
            READY TO PLAY
          `;
        }
      }
    } catch (error) {
      console.error('Error updating points after staking:', error);
    }

    const stakeSuccess = document.getElementById('stake-success');
    if (stakeSuccess) {
      stakeSuccess.textContent = 'PURCHASE SUCCESSFUL! +1000 POINTS AWARDED!';
      stakeSuccess.style.display = 'block';
    }
    
    const stakeBtn = document.getElementById('stake-btn');
    if (stakeBtn) {
      stakeBtn.classList.add('btn-disabled');
      stakeBtn.textContent = `PURCHASED: ${amount} TOKENS`;
      (stakeBtn as HTMLButtonElement).disabled = true;
    }
}


    
      

      
  
      
      // Award 1000 points for staking
  
      
      // Update UI
  
      
      // Close modal after delay
      setTimeout(() => {
        const stakeModal = document.getElementById('stake-modal');
        if (stakeModal) stakeModal.style.display = 'none';
      }, 2000);
      
    } catch (error) {
      console.error('Staking error:', error);
      
      // Show error
      const stakeError = document.getElementById('stake-error');
      if (stakeError) {
        stakeError.textContent = 'TRANSACTION FAILED. PLEASE TRY AGAIN.';
        stakeError.style.display = 'block';
      }
      
      // Reset button
      const confirmStakeBtn = document.getElementById('confirm-stake-btn');
      if (confirmStakeBtn) {
      confirmStakeBtn.textContent = 'PURCHASE TOKENS';
        (confirmStakeBtn as HTMLButtonElement).disabled = false;
      }
    }
  };
  
  // Unstake tokens function
  const unstakeTokens = async () => {
    console.log("Unstaking tokens");
    
    const addresss = localStorage.getItem('address');
    if (!addresss) return;
    
    try {
      // Show processing state
      const unstakeBtn = document.getElementById('unstake-btn');
      if (unstakeBtn) {
        unstakeBtn.textContent = 'PROCESSING...';
        (unstakeBtn as HTMLButtonElement).disabled = true;
      }
      
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
        args: [addresss as `0x${string}`]
    });

    console.log(stakedBalance);
    console.log(stakedBalance?.[2]);
    if (!stakedBalance) {
        throw new Error('Could not get Purchase balance');
    }

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


try {
  const response = await fetch('/api/points', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: addresss,
      points: 0,
      reason: 'Unstaking tokens'
    }),
  });  

  const data = await response.json();
  console.log("Points API response:", data); // Add logging
} catch (error) {
  console.error('Error updating points after unstaking:', error);
}      

      
      // Update UI
      const stakeSuccess = document.getElementById('stake-success');
      if (stakeSuccess) {
        // convert stakedBalance[2] to a ether amount
        const etherAmount = formatEther(stakedBalance[2]);
        stakeSuccess.textContent = `UNSTAKED ${etherAmount} ASTR!`;
        stakeSuccess.style.display = 'block';
      }
      
      const stakeBtn = document.getElementById('stake-btn');
      if (stakeBtn) {
        stakeBtn.classList.remove('btn-disabled');
        stakeBtn.textContent = 'PURCHASE TOKENS';
        (stakeBtn as HTMLButtonElement).disabled = false;
      }
      
      const startGameBtn = document.getElementById('start-game-btn');
      if (startGameBtn) {
        startGameBtn.classList.add('btn-disabled');
        startGameBtn.textContent = 'START GAME';
        (startGameBtn as HTMLButtonElement).disabled = true;
      }
      
      // Close modal after delay
      setTimeout(() => {
        const stakeModal = document.getElementById('stake-modal');
        if (stakeModal) stakeModal.style.display = 'none';
      }, 2000);
      
    } catch (error) {
      console.error('Unstaking error:', error);
      
      // Show error
      const stakeError = document.getElementById('stake-error');
      if (stakeError) {
        stakeError.textContent = 'TRANSACTION FAILED. PLEASE TRY AGAIN.';
        stakeError.style.display = 'block';
      }
      
      // Reset button
      const unstakeBtn = document.getElementById('unstake-btn');
      if (unstakeBtn) {
        unstakeBtn.textContent = 'UNSTAKE TOKENS';
        (unstakeBtn as HTMLButtonElement).disabled = false;
      }
    }
  };
  
  function initializeGame() {
    // Create initial snakes
    for (let i = 0; i < 5; i++) {
      setTimeout(createPixelSnake, i * 2000);
    }
    
    // Continue creating snakes periodically
    const snakeInterval = setInterval(createPixelSnake, 3000);
    
    // Random static effects
    const staticInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        addStatic();
      }
    }, 5000);
    
    // Set up event listeners
    setupEventListeners();
    
    // Return cleanup function
    return () => {
      clearInterval(snakeInterval);
      clearInterval(staticInterval);
    };
  }
  
  // Rest of your existing functions...
  function createPixelSnake() {
    // Your existing implementation...
  }
  
  function addStatic() {
    // Your existing implementation...
  }
  
  // Modified play game function to update points and claims
  const playGame = () => {
    if (!address) return;
    
    // Increment games played locally
    const newGamesPlayed = gameState.gamesPlayed + 1;
    
    setGameState(prev => ({
      ...prev,
      gamesPlayed: newGamesPlayed
    }));
    
    // Update play counter
    const playCounter = document.getElementById('play-counter');
    if (playCounter) {
      playCounter.textContent = `GAMES PLAYED: ${newGamesPlayed}/${gameState.gamesRequiredToUnstake}`;
    }
    
    // Update claims data in API
    try {
      fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          gamesPlayed: newGamesPlayed
        }),
      });
    } catch (error) {
      console.error('Error updating claims data:', error);
    }
    
    // If we've reached the required games, enable unstake button
    if (newGamesPlayed >= gameState.gamesRequiredToUnstake) {
      const unstakeBtn = document.getElementById('unstake-btn');
      if (unstakeBtn) {
        (unstakeBtn as HTMLButtonElement).disabled = false;
        unstakeBtn.textContent = 'UNSTAKE TOKENS';
        unstakeBtn.style.display = 'block';
      }
    }
    
    // Award random points between 50-200
    const pointsEarned = Math.floor(Math.random() * 151) + 50;
    updatePoints(pointsEarned);
    
    // Show points earned
    const pointsEarnedDisplay = document.getElementById('points-earned');
    if (pointsEarnedDisplay) {
      pointsEarnedDisplay.textContent = `+${pointsEarned} POINTS`;
      pointsEarnedDisplay.style.display = 'block';
      
      // Hide after 3 seconds
      setTimeout(() => {
        pointsEarnedDisplay.style.display = 'none';
      }, 3000);
    }
  };
  
  function setupEventListeners() {
    // Sample scores data
    const sampleScores = [
      { name: "CRYPTO_SNAKE", score: 9850, wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
      { name: "NEON_NINJA", score: 8720, wallet: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" },
      { name: "PIXEL_OVERLORD", score: 7650, wallet: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed" },
      { name: "BLOCKCHAIN_BANDIT", score: 6540, wallet: "0x4fB7aA3b8DcC3325F5eB4C5Dd6cB7e5B9F2a3456" },
      { name: "DIGITAL_DEMON", score: 5430, wallet: "0x28a874BEFeC42e8B0aD6a6b1f5F5eD5eF8aB3456" }
    ];
    
    // Populate scores list
    const scoresList = document.getElementById('scores-list');
    if (scoresList) {
      scoresList.innerHTML = '';
      sampleScores.forEach((player, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        
        const rankName = document.createElement('div');
        rankName.innerHTML = `<span style="color: #ff00ff;">#${index + 1}</span> ${player.name}`;
        
        const scoreWallet = document.createElement('div');
        scoreWallet.className = 'text-right';
        scoreWallet.innerHTML = `
          <div style="color: #00ffff;">${player.score.toLocaleString()} PTS</div>
          <div class="wallet-address">${player.wallet}</div>
        `;
        
        scoreItem.appendChild(rankName);
        scoreItem.appendChild(scoreWallet);
        scoresList.appendChild(scoreItem);
      });
    }
    
    // Connect wallet button - now uses RainbowKit
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    if (connectWalletBtn) {
      connectWalletBtn.addEventListener('click', function() {
        // Instead of showing modal, we'll trigger the RainbowKit modal
        // This is handled by the ConnectButton component
        const rainbowkitBtn = document.querySelector('.rainbowkit-connect-btn');
        if (rainbowkitBtn) {
          (rainbowkitBtn as HTMLElement).click();
        }
        addStatic();
      });
    }
    
    // Stake button
    const stakeBtn = document.getElementById('stake-btn');
    const stakeModal = document.getElementById('stake-modal');
    
    if (stakeBtn) {
      console.log("Found stake button, adding event listener"); // Add logging
      stakeBtn.addEventListener('click', function() {
        console.log("Stake button clicked"); // Add logging
        if (stakeModal) {
          console.log("Showing stake modal"); // Add logging
          stakeModal.style.display = 'block';
        }
        addStatic();
      });
    }
    
    // Stake amount selection
    const stakeAmounts = document.querySelectorAll('.stake-amount');
    const stakeInput = document.getElementById('stake-input') as HTMLInputElement;
    
    stakeAmounts.forEach(amount => {
      amount.addEventListener('click', function(this: HTMLElement) {
        // Remove active class from all amounts
        stakeAmounts.forEach(a => a.classList.remove('active'));
        
        // Add active class to clicked amount
        this.classList.add('active');
        
        // Set input value
        if (stakeInput) {
          stakeInput.value = this.getAttribute('data-amount') || '';
        }
      });
    });
    
    // Confirm stake button
    const confirmStakeBtn = document.getElementById('confirm-stake-btn');
    if (confirmStakeBtn && stakeInput) {
      confirmStakeBtn.addEventListener('click', function() {

        console.log("Confirm stake button clicked"); // Add logging
        const amount = parseFloat(stakeInput.value);
        const stakeError = document.getElementById('stake-error');
        
        if (isNaN(amount) || amount < 1000) {
          if (stakeError) {
            stakeError.textContent = 'PLEASE ENTER A VALID AMOUNT (MIN 1000)';
            stakeError.style.display = 'block';
          }
          return;
        }
        
        // Call the staking function
        stakeTokens(amount);
      });
    }
    
    // Close stake modal
    const closeStakeModal = document.getElementById('close-stake-modal');
    if (closeStakeModal) {
      closeStakeModal.addEventListener('click', function() {
        if (stakeModal) stakeModal.style.display = 'none';
        addStatic();
      });
    }
    
    // Start game button
    const startGameBtn = document.getElementById('start-game-btn');
    const gameScreen = document.getElementById('game-screen');
    
    if (startGameBtn) {
      startGameBtn.addEventListener('click', function() {
        // Navigate to /play route
        window.location.href = '/play';
        addStatic();
      });
    }
    
    // Play game button
    const playGameBtn = document.getElementById('play-game-btn');
    if (playGameBtn) {
      playGameBtn.addEventListener('click', function() {
        playGame();
        
        // Close game screen after "playing"
        setTimeout(() => {
          const gameScreen = document.getElementById('game-screen');
          if (gameScreen) gameScreen.style.display = 'none';
          addStatic();
        }, 2000);
      });
    }
    
    // Close game screen
    const closeGameBtn = document.getElementById('close-game');
    if (closeGameBtn) {
      closeGameBtn.addEventListener('click', function() {
        if (gameScreen) gameScreen.style.display = 'none';
        addStatic();
      });
    }
    
    // Scores button
    const scoresBtn = document.getElementById('scores-btn');
    const scoresContainer = document.getElementById('scores-container');
    const closeScores = document.getElementById('close-scores');
    
    if (scoresBtn) {
      scoresBtn.addEventListener('click', function() {
        fetchLeaderboard();
        addStatic();
      });
    }
    
    if (closeScores) {
      closeScores.addEventListener('click', function() {
        if (scoresContainer) scoresContainer.style.display = 'none';
        addStatic();
      });
    }

    // Unstake button
    const unstakeBtn = document.getElementById('unstake-btn');
    if (unstakeBtn) {
      unstakeBtn.addEventListener('click', function() {
        // Only proceed if button is not disabled
        if (!(unstakeBtn as HTMLButtonElement).disabled) {
          console.log("Unstake button clicked");
          unstakeTokens();
        } else {
          // Show alert if trying to unstake before playing enough games
          alert(`You need to play at least ${gameState.gamesRequiredToUnstake} games to unstake. You have played ${gameState.gamesPlayed} games.`);
        }
      });
    }
  }

  // Add a function to fetch claims data
  const fetchClaimsData = async (walletAddress: string) => {
    try {
      // Use the claims API endpoint
      const response = await fetch(`/api/claims?address=${walletAddress}`);
      const data = await response.json();
      
      console.log("Claims data:", data);
      
      // Get games played from API or default to 0
      const gamesPlayed = data?.claimsData?.gamesPlayed || 0;
      
      // Update the games played counter
      const playCounter = document.getElementById('play-counter');
      if (playCounter) {
        playCounter.textContent = `GAMES PLAYED: ${gamesPlayed}/${gameState.gamesRequiredToUnstake}`;
      }
      
      // Update game state
      setGameState(prev => ({
        ...prev,
        gamesPlayed: gamesPlayed
      }));
      
      // Check if enough games have been played to enable unstake
      const unstakeBtn = document.getElementById('unstake-btn');
      if (unstakeBtn) {
        // Check BOTH games played AND points
        if (gamesPlayed >= gameState.gamesRequiredToUnstake && gameState.points >= 1000) {
          // Enable unstake button if both conditions are met
          unstakeBtn.classList.remove('btn-disabled');
          (unstakeBtn as HTMLButtonElement).disabled = false;
        } else {
          // Disable unstake button if either condition is not met
          unstakeBtn.classList.add('btn-disabled');
          (unstakeBtn as HTMLButtonElement).disabled = true;
        }
      }
    } catch (error) {
      console.error('Error fetching claims data:', error);
    }
  };

  // Add this function to fetch and display the leaderboard
  const fetchLeaderboard = async () => {
    try {
      // Show loading state
      const scoresContainer = document.getElementById('scores-container');
      const scoresList = document.getElementById('scores-list');
      
      if (scoresContainer && scoresList) {
        scoresContainer.style.display = 'block';
        scoresList.innerHTML = '<div class="text-center my-4">LOADING LEADERBOARD...</div>';
        
        // Add static effect
        addStatic();
        
        // Fetch leaderboard data
        const response = await fetch('/api/points?leaderboard=true');
        const data = await response.json();
        
        if (data && data.leaderboard && data.leaderboard.length > 0) {
          // Clear loading message
          scoresList.innerHTML = '';
          
          // Populate scores list
          //ts-ignore

          // Define interface for leaderboard player data
          interface LeaderboardPlayer {
            address: string;
            currentPoints: number;
            highestPoints: number;
            updatedAt: string;
          }
          data.leaderboard.forEach((player: LeaderboardPlayer, index: number) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            
            const rankName = document.createElement('div');
            rankName.innerHTML = `<span style="color: #ff00ff;">#${index + 1}</span> ${player.address.substring(0, 6)}...${player.address.substring(player.address.length - 4)}`;
            
            const scoreWallet = document.createElement('div');
            scoreWallet.className = 'text-right';
            scoreWallet.innerHTML = `
              <div style="color: #00ffff;">${player.currentPoints.toLocaleString()} PTS</div>
            `;
            
            scoreItem.appendChild(rankName);
            scoreItem.appendChild(scoreWallet);
            scoresList.appendChild(scoreItem);
          });
        } else {
          scoresList.innerHTML = '<div class="text-center my-4">NO SCORES FOUND</div>';
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      
      // Show error message
      const scoresList = document.getElementById('scores-list');
      if (scoresList) {
        scoresList.innerHTML = '<div class="text-center my-4 text-red-500">ERROR LOADING LEADERBOARD</div>';
      }
    }
  };

  return (
    <div className="crt">
      {/* Hidden RainbowKit connect button */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        <ConnectButton />
      </div>
      
      {/* Background elements */}
      <div className="grid-bg"></div>
      <div className="scanlines"></div>
      
      {/* Points display - positioned on the left */}
      <div id="points-display" className="points-display" style={{display: 'none'}}>0 PTS</div>
      
      {/* Connected Wallet Display - positioned on the right */}
      <div id="connected-wallet" className="connected-wallet" style={{display: 'none'}}></div>
      
      {/* Main content */}
      <div className="menu-container">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl mb-6 floating-text">
            RPS <span className="text-pink-500">CORE</span>
          </h1>
          <p className="text-sm md:text-base text-green-400 mb-8">
            RETRO FUTURISM IN DIGITAL FORM
          </p>
        </div>
        
        {/* Vertical button layout */}
        <div className="flex flex-col items-center">
          <button className="neon-btn flex justify-center items-center">
            <ConnectButton label='CONNECT WALLET' />
          </button>
          <button id="stake-btn" className="neon-btn btn-disabled" disabled>PURCHASE TOKENS</button>
          <button id="start-game-btn" className="neon-btn btn-disabled" disabled>START GAME</button>
          {/* <button id="unstake-btn" className="neon-btn btn-disabled" disabled>UNSTAKE TOKENS</button> */}
        <button id="scores-btn" className="neon-btn">SCORES</button> 
        </div>
        
        {/* Info box */}
        <div className="border-2 border-green-400 p-6 max-w-md text-center relative mt-12">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black px-4 text-green-400">SYSTEM INFO</div>
          <p id="info-box-text" className="text-xs md:text-sm text-green-300 leading-relaxed mt-4">
            NEED 1000 POINTS TO PLAY<br />
            YOUR POINTS: {gameState.points}<br />
            POINTS NEEDED: {1000 - gameState.points > 0 ? 1000 - gameState.points : 0}
          </p>
        </div>
      </div>
      
      {/* Scores Page */}
      <div id="scores-container" className="scores-container">
        <button className="close-scores" id="close-scores">✕</button>
        <div className="scores-header">LEADERBOARD</div>
        <div id="scores-list" className="scores-list">
          {/* Scores will be populated here */}
        </div>
      </div>
      
      {/* Stake Modal */}
      <div id="stake-modal" className="stake-modal">
        <h3 className="text-lg mb-6">PURCHASE TOKENS TO PLAY</h3>
        <div className="stake-info">
          PURCHASE TOKENS TO UNLOCK THE GAME<br />
          MINIMUM PURCHASE: 1000 TOKENS<br />
          PLAY 10 GAMES TO UNLOCK UNSTAKE
        </div>
        
        <div className="stake-amounts">
          <div className="stake-amount" data-amount="1000">1000</div>
          <div className="stake-amount" data-amount="5000">5000</div>
          <div className="stake-amount" data-amount="10000">10000</div>
          <div className="stake-amount" data-amount="15000">15000</div>
        </div>

        <div className="stake-balance">
          BALANCE: {balance ? formatEther(balance) : '0'}
        </div>
        
        <input type="number" id="stake-input" className="stake-input" placeholder="ENTER AMOUNT" min="10" step="1" />
        
        <div className="play-counter" id="play-counter">
          GAMES PLAYED: {gameState.gamesPlayed}/{gameState.gamesRequiredToUnstake}
        </div>
        
        <div className="stake-error" id="stake-error"></div>
        
        <button id="confirm-stake-btn" className="stake-btn" disabled={isPending}>
          {isPending ? 'PROCESSING...' : 'PURCHASING TOKENS'}
        </button>
        
        <button id="unstake-btn" className="unstake-btn" disabled>UNSTAKE TOKENS</button>
        
        <div className="stake-success" id="stake-success">
          PURCHASE SUCCESSFUL! GAME UNLOCKED.
        </div>
        
        <button id="close-stake-modal" className="neon-btn w-full mt-4">CANCEL</button>
      </div>
      
      {/* Game Screen */}
      <div id="game-screen" className="game-screen">
        <button className="close-game" id="close-game">✕</button>
        <div className="game-container">
          {/* Game will be rendered here */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <h2 className="text-2xl text-green-400 mb-4">GAME SCREEN</h2>
            <p className="text-green-300 mb-6">PLAYING WILL INCREASE YOUR PLAY COUNTER</p>
            <div id="points-earned" className="points-earned" style={{display: 'none'}}>+0 POINTS</div>
            <button id="play-game-btn" className="neon-btn">PLAY GAME</button>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        body {
          font-family: 'Press Start 2P', cursive;
          background-color: #0a0a1a;
          color: #00ff00;
          overflow-x: hidden;
          min-height: 100vh;
        }
        
        /* Neon grid background */
        .grid-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          z-index: -1;
        }
        
        /* Pixel snake */
        .pixel-snake {
          position: absolute;
          display: flex;
          pointer-events: none;
          z-index: -1;
          filter: drop-shadow(0 0 5px #00ff00);
        }
        
        .pixel {
          width: 8px;
          height: 8px;
          background-color: #00ff00;
          margin: 1px;
          animation: pixelGlow 2s infinite alternate;
        }
        
        @keyframes pixelGlow {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        /* Neon buttons */
        .neon-btn {
          position: relative;
          background: transparent;
          color: #00ff00;
          border: 2px solid #00ff00;
          padding: 15px 24px;
          font-family: 'Press Start 2P', cursive;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
          text-transform: uppercase;
          letter-spacing: 2px;
          overflow: hidden;
          width: 300px;
          margin: 10px auto;
          text-align: center;
        }
        
        .neon-btn:hover {
          color: #0a0a1a;
          background: #00ff00;
          box-shadow:
            0 0 10px #00ff00,
            0 0 20px #00ff00,
            0 0 40px #00ff00;
          text-shadow: 0 0 5px #0a0a1a;
        }
        
        .neon-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.4), transparent);
          transition: 0.5s;
        }
        
        .neon-btn:hover::before {
          left: 100%;
        }
        
        /* Scanline effect */
        .scanlines {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(0, 0, 0, 0.7) 1px, transparent 1px);
          background-size: 100% 2px;
          pointer-events: none;
          z-index: 100;
          opacity: 0.3;
        }
        
        /* CRT effect */
        .crt::before {
          content: " ";
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: rgba(0, 255, 0, 0.03);
          pointer-events: none;
          z-index: 100;
        }
        
        .crt::after {
          content: " ";
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background:
            radial-gradient(circle, transparent 50%, rgba(0, 0, 0, 0.7) 100%),
            repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0px, rgba(0, 0, 0, 0.2) 1px, transparent 1px, transparent 2px);
          pointer-events: none;
          z-index: 100;
        }
        
        /* Floating text effect */
        .floating-text {
          animation: float 3s ease-in-out infinite;
          text-shadow: 0 0 10px #00ff00;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        /* Scores page styles */
        .scores-container {
          display: none;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          max-width: 800px;
          max-height: 80vh;
          background-color: rgba(10, 10, 26, 0.9);
          border: 3px solid #00ff00;
          box-shadow: 0 0 20px #00ff00;
          padding: 20px;
          z-index: 1000;
          overflow-y: auto;
        }
        
        .scores-header {
          text-align: center;
          margin-bottom: 20px;
          font-size: 24px;
          color: #00ff00;
          text-shadow: 0 0 10px #00ff00;
        }
        
        .score-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          margin-bottom: 10px;
          background-color: rgba(0, 255, 0, 0.05);
          border: 1px solid rgba(0, 255, 0, 0.3);
        }
        
        .score-item:nth-child(odd) {
          background-color: rgba(0, 255, 0, 0.1);
        }
        
        .wallet-address {
          font-size: 10px;
          color: #00cc00;
          word-break: break-all;
        }
        
        .close-scores {
          position: absolute;
          top: 10px;
          right: 10px;
          background: transparent;
          border: none;
          color: #ff0000;
          font-size: 20px;
          cursor: pointer;
        }
        
        /* Wallet connection modal */
        .wallet-modal {
          display: none;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(10, 10, 26, 0.95);
          border: 3px solid #00ff00;
          box-shadow: 0 0 20px #00ff00;
          padding: 30px;
          z-index: 1000;
          width: 300px;
          text-align: center;
        }
        
        .wallet-option {
          display: block;
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          color: #00ff00;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .wallet-option:hover {
          background: rgba(0, 255, 0, 0.3);
          box-shadow: 0 0 10px #00ff00;
        }
        
        .connected-wallet {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          padding: 8px 12px;
          font-size: 10px;
          color: #00ff00;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          z-index: 100;
        }
        
        /* Game screen */
        .game-screen {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #000;
          z-index: 2000;
        }
        
        .game-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90vw;
          max-width: 800px;
          aspect-ratio: 9/19;
          background-color: #111;
          border: 2px solid #00ff00;
          box-shadow: 0 0 30px #00ff00;
        }
        
        .close-game {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: #ff0000;
          font-size: 20px;
          cursor: pointer;
          z-index: 2001;
        }
        
        /* Stake Modal */
        .stake-modal {
          display: none;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(10, 10, 26, 0.95);
          border: 3px solid #00ff00;
          box-shadow: 0 0 20px #00ff00;
          padding: 30px;
          z-index: 1000;
          width: 400px;
          text-align: center;
        }

        .stake-input {
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 15px;
          width: 100%;
          margin: 20px 0;
          font-family: 'Press Start 2P', cursive;
          font-size: 14px;
          text-align: center;
        }

        .stake-input:focus {
          outline: none;
          box-shadow: 0 0 10px #00ff00;
        }

        .stake-amounts {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
        }

        .stake-amount {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 10px;
          cursor: pointer;
          transition: all 0.3s;
          flex: 1;
          margin: 0 5px;
          font-size: 12px;
        }

        .stake-amount:hover {
          background: rgba(0, 255, 0, 0.3);
          box-shadow: 0 0 10px #00ff00;
        }

        .stake-amount.active {
          background: #00ff00;
          color: #0a0a1a;
          box-shadow: 0 0 10px #00ff00;
        }

        .stake-info {
          font-size: 10px;
          color: #00cc00;
          margin: 15px 0;
          line-height: 1.5;
        }

        .stake-btn {
          width: 100%;
          padding: 15px;
          margin-top: 20px;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          color: #00ff00;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Press Start 2P', cursive;
          font-size: 14px;
        }

        .stake-btn:hover {
          background: rgba(0, 255, 0, 0.3);
          box-shadow: 0 0 10px #00ff00;
        }
        
        .stake-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(0, 255, 0, 0.05);
          box-shadow: none;
        }
        
        .unstake-btn {
          width: 100%;
          padding: 15px;
          margin-top: 10px;
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid #ff0000;
          color: #ff0000;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Press Start 2P', cursive;
          font-size: 14px;
          display: none;
        }
        
        .unstake-btn:hover {
          background: rgba(255, 0, 0, 0.3);
          box-shadow: 0 0 10px #ff0000;
        }
        
        .unstake-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(255, 0, 0, 0.05);
          box-shadow: none;
        }
        
        .stake-success {
          display: none;
          color: #00ff00;
          font-size: 14px;
          margin: 20px 0;
          text-align: center;
        }
        
        .stake-error {
          display: none;
          color: #ff0000;
          font-size: 12px;
          margin: 10px 0;
          text-align: center;
        }
        
        .play-counter {
          font-size: 10px;
          color: #00cc00;
          margin: 10px 0;
          text-align: center;
        }
        
        /* Button states */
        .btn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(0, 255, 0, 0.05);
          box-shadow: none;
        }
        
        .btn-disabled:hover {
          color: #00ff00;
          background: transparent;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
        }
        
        /* Main menu container */
        .menu-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }
        
        /* Hidden RainbowKit button */
        .rainbowkit-container {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        
        .points-display {
          position: fixed;
          top: 20px;
          left: 20px;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          padding: 8px 12px;
          font-size: 14px;
          color: #00ff00;
          font-family: 'Press Start 2P', cursive;
          z-index: 1000;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }
        
        .points-earned {
          color: #00ffff;
          font-size: 24px;
          margin: 20px 0;
          text-shadow: 0 0 10px #00ffff;
          animation: pulse 1s infinite alternate;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
