import mongoose, { Schema } from 'mongoose';

// Define the points history schema
const PointsHistorySchema = new Schema({
  points: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  reason: {
    type: String,
    required: true,
  }
});

// Define the main user points schema
const UserPointsSchema = new Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  currentPoints: {
    type: Number,
    default: 0,
  },
  highestPoints: {
    type: Number,
    default: 0,
  },
  totalPoints: {
    type: Number,
    default: 0,
  },
  pointsHistory: [PointsHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Create and export the model
export default mongoose.models.UserPoints || mongoose.model('UserPoints', UserPointsSchema); 