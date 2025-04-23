import mongoose, { Schema } from 'mongoose';

// Define the interface for the game data
interface IGameData {
  address: string;
  totalScore: number;
  bestScore: number;
  lives: number;
  updatedAt: Date;
  createdAt: Date;
}

// Create the schema
const GameDataSchema = new Schema<IGameData>(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    totalScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    bestScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    lives: {
      type: Number,
      default: 3, // Start with 3 lives by default
      min: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create and export the model
const GameData = mongoose.models.GameData || mongoose.model<IGameData>('GameData', GameDataSchema);

export default GameData; 