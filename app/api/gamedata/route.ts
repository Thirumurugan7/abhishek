import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabaseSnake } from '@/app/lib/mongodb';
import GameData from '@/app/models/GameData';
import { corsMiddleware } from '../../lib/cors';

// GET endpoint to fetch user game data
export async function GET(req: NextRequest) {
  return corsMiddleware(req, async (req) => {
    try {
      // Get the address from the URL query parameters
      const { searchParams } = new URL(req.url);
      const address = searchParams.get('address');

      if (!address) {
        return NextResponse.json(
          { error: 'Address parameter is required' },
          { status: 400 }
        );
      }

      // Connect to the database
      try {
        await connectToDatabaseSnake();
      } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }

      // Find the user by address or create a new one with default values
      let gameData = await GameData.findOne({ address: address.toLowerCase() });

      if (!gameData) {
        // Create new user with default values
        gameData = {
          address: address.toLowerCase(),
          totalScore: 0,
          bestScore: 0,
          lives: 3, // Default starting lives
          updatedAt: new Date(),
          createdAt: new Date()
        };
      }

      return NextResponse.json(gameData, { status: 200 });
    } catch (error) {
      console.error('Error fetching game data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch game data' },
        { status: 500 }
      );
    }
  });
}

// POST endpoint for all update operations
export async function POST(req: NextRequest) {
  return corsMiddleware(req, async (req) => {
    try {
      const body = await req.json();
      const { address, operation, value } = body;

      if (!address || !operation) {
        return NextResponse.json(
          { error: 'Address and operation are required' },
          { status: 400 }
        );
      }

      // Value must be provided for all operations
      if (value === undefined || value === null) {
        return NextResponse.json(
          { error: 'Value is required' },
          { status: 400 }
        );
      }

      // Value must be a non-negative number
      if (typeof value !== 'number' || value < 0) {
        return NextResponse.json(
          { error: 'Value must be a non-negative number' },
          { status: 400 }
        );
      }

      // Connect to the database
      try {
        await connectToDatabaseSnake();
      } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }

      // Find the user or create a new one
      let gameData = await GameData.findOne({ address: address.toLowerCase() });

      if (!gameData) {
        gameData = new GameData({
          address: address.toLowerCase(),
          totalScore: 0,
          bestScore: 0,
          lives: 3 // Default starting lives
        });
      }

      // Perform the requested operation
      switch (operation) {
        case 'increaseLives':
          gameData.lives += value;
          break;
          
        case 'decreaseLives':
          // Ensure lives don't go below 0
          gameData.lives = Math.max(0, gameData.lives - value);
          break;
          
        case 'updateScore':
          // Add the new score to total score
          gameData.totalScore += value;
          
          // Update best score if the new score is higher
          if (value > gameData.bestScore) {
            gameData.bestScore = value;
          }
          break;
          
        default:
          return NextResponse.json(
            { error: 'Invalid operation. Must be increaseLives, decreaseLives, or updateScore' },
            { status: 400 }
          );
      }

      // Update timestamp
      gameData.updatedAt = new Date();

      // Save the changes
      await gameData.save();

      // Return appropriate response based on operation
      switch (operation) {
        case 'increaseLives':
        case 'decreaseLives':
          return NextResponse.json({ lives: gameData.lives }, { status: 200 });
          
        case 'updateScore':
          return NextResponse.json({ 
            totalScore: gameData.totalScore,
            bestScore: gameData.bestScore 
          }, { status: 200 });
          
        default:
          return NextResponse.json(gameData, { status: 200 });
      }
    } catch (error) {
      console.error('Error updating game data:', error);
      return NextResponse.json(
        { error: 'Failed to update game data', details: (error as Error).message },
        { status: 500 }
      );
    }
  });
} 