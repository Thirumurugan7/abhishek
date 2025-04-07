import mongoose from 'mongoose';

// Get MongoDB URI from environment variables with a fallback
const MONGODB_URI = "mongodb+srv://devultimate:Msdthiru7!@cluster0.nt80u.mongodb.net/abi" ;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Define a type for our cached connection
interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Create a cached connection object
const globalWithMongo = global as typeof globalThis & {
  mongooseCache?: CachedConnection;
};

// Initialize the cache
if (!globalWithMongo.mongooseCache) {
  globalWithMongo.mongooseCache = {
    conn: null,
    promise: null
  };
}

export async function connectToDatabase() {
  const cached = globalWithMongo.mongooseCache!;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
} 