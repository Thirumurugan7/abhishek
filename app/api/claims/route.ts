import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/app/lib/mongodb';
import { corsMiddleware } from '../../lib/cors';

// Define the Claims schema
const ClaimsSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  lastClaimed: { type: Date, default: Date.now }
});

// Get the model (or create it if it doesn't exist)
const Claims = mongoose.models.Claims || mongoose.model('Claims', ClaimsSchema);

// GET handler to retrieve the number of claims for a user
export async function GET(req: NextRequest) {
  return corsMiddleware(req, async (req) => {
    try {
      await connectToDatabase();
      
      const { searchParams } = new URL(req.url);
      const address = searchParams.get('address');

      if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
      }
      
      const claimsRecord = await Claims.findOne({ address: address.toLowerCase() });
      
      return NextResponse.json({ 
        address: address.toLowerCase(),
        claimCount: claimsRecord?.count || 0,
        lastClaimed: claimsRecord?.lastClaimed || null
      });
    } catch (error) {
      console.error('Error getting claims:', error);
      return NextResponse.json({ error: 'Failed to get claims' }, { status: 500 });
    }
  });
}

// POST handler to increment the number of claims for a user
export async function POST(req: NextRequest) {
  return corsMiddleware(req, async (req) => {
    try {
      await connectToDatabase();
      
      const body = await req.json();
      const { address } = body;

      if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
      }
      
      // Find the current record or create a new one
      let claimsRecord = await Claims.findOne({ address: address.toLowerCase() });
      
      if (!claimsRecord) {
        claimsRecord = new Claims({
          address: address.toLowerCase(),
          count: 0
        });
      }
      
      // Increment the count and update last claimed time
      claimsRecord.count += 1;
      claimsRecord.lastClaimed = new Date();
      
      // Save the updated record
      await claimsRecord.save();

      return NextResponse.json({ 
        address: address.toLowerCase(),
        claimCount: claimsRecord.count,
        lastClaimed: claimsRecord.lastClaimed,
        success: true 
      });
    } catch (error) {
      console.error('Error updating claims:', error);
      return NextResponse.json({ error: 'Failed to update claims' }, { status: 500 });
    }
  });
} 