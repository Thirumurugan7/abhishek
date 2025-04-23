import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import UserPoints from '@/app/models/UserPoints';
import { corsMiddleware } from '../../lib/cors';

// Simple in-memory storage for demo purposes
// In a real app, you'd use a database
// const userPoints = new Map<string, number>();

export async function GET(req: NextRequest) {
  return corsMiddleware(req, async (req) => {
    try {
      // Get the address from the URL query parameters
      const { searchParams } = new URL(req.url);
      const address = searchParams.get('address');
      const leaderboard = searchParams.get('leaderboard');

      // Connect to the database
      try {
        await connectToDatabase();
      } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }

      // If leaderboard parameter is present, return the leaderboard
      if (leaderboard === 'true') {
        const topUsers = await UserPoints.find({})
          .sort({ currentPoints: -1 }) // Sort by points in descending order
          .limit(10) // Get top 10 users
          .select('address currentPoints highestPoints updatedAt'); // Select only needed fields
        
        return NextResponse.json({ leaderboard: topUsers }, { status: 200 });
      }

      // If address is provided, return user points
      if (address) {
        // Find the user by address
        const userPoints = await UserPoints.findOne({ address: address.toLowerCase() });

        if (!userPoints) {
          return NextResponse.json(
            { 
              address,
              currentPoints: 0,
              highestPoints: 0,
              pointsHistory: []
            },
            { status: 200 }
          );
        }

        return NextResponse.json(userPoints, { status: 200 });
      }

      // If neither leaderboard nor address is provided
      return NextResponse.json(
        { error: 'Either address or leaderboard parameter is required' },
        { status: 400 }
      );
    } catch (error) {
      console.error('Error fetching data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return corsMiddleware(req, async (req) => {
    try {
      const body = await req.json();
      const { address, points, reason } = body;

      if (!address || points === undefined || !reason) {
        return NextResponse.json(
          { error: 'Address, points, and reason are required' },
          { status: 400 }
        );
      }

      // Connect to the database
      try {
        await connectToDatabase();
      } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }

      // Find the user or create a new one
      let userPoints = await UserPoints.findOne({ address: address.toLowerCase() });

      if (!userPoints) {
        userPoints = new UserPoints({
          address: address.toLowerCase(),
          currentPoints: points,  // Set initial current points
          highestPoints: points,  // Initial highest is same as current
          pointsHistory: [{
            points,
            reason,
            timestamp: new Date()
          }]
        });
      } else {
        // Update existing user
        // Set current points to the new points value (not cumulative)
        userPoints.currentPoints = points;
        
        // Update highest points only if the new points are higher
        if (points > userPoints.highestPoints) {
          userPoints.highestPoints = points;
        }
        
        // Add to points history
        userPoints.pointsHistory.push({
          points,
          reason,
          timestamp: new Date()
        });
        
        userPoints.updatedAt = new Date();
      }

      // Save the changes
      await userPoints.save();

      // Get updated leaderboard
      const leaderboard = await UserPoints.find({})
        .sort({ currentPoints: -1 })
        .limit(10)
        .select('address currentPoints highestPoints updatedAt');

      return NextResponse.json({
        ...userPoints.toObject(),
        leaderboard
      }, { status: 200 });
    } catch (error) {
      console.error('Error updating user points:', error);
      return NextResponse.json(
        { error: 'Failed to update user points', details: (error as Error).message },
        { status: 500 }
      );
    }
  });
}