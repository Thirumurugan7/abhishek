import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import UserPoints from '@/app/models/UserPoints';

export async function GET(request: NextRequest) {
  try {
    // Get the address from the URL query parameters
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
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
  } catch (error) {
    console.error('Error fetching user points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user points' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    return NextResponse.json(userPoints, { status: 200 });
  } catch (error) {
    console.error('Error updating user points:', error);
    return NextResponse.json(
      { error: 'Failed to update user points', details: (error as Error).message },
      { status: 500 }
    );
  }
}