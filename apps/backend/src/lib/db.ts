import mongoose from "mongoose";
import { MongoClient } from "mongodb";

interface MongooseCache {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
}

interface MongoClientCache {
    client: MongoClient | null;
    promise: Promise<MongoClient> | null;
}

// Extend the global object to include mongoose cache
declare global {
    var mongoose: MongooseCache | undefined;
    var mongoClient: MongoClientCache | undefined;
}

const mongooseCache: MongooseCache = global.mongoose || (global.mongoose = { conn: null, promise: null });
const clientCache: MongoClientCache = global.mongoClient || (global.mongoClient = { client: null, promise: null });

// MongoDB Client for Better Auth - lazy initialization
function getMongoClient(): MongoClient {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
    }

    if (!clientCache.client) {
        clientCache.client = new MongoClient(MONGODB_URI);
    }

    return clientCache.client;
}

// Mongoose connection for other use
async function dbConnect() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
    }

    if (mongooseCache.conn) {
        return mongooseCache.conn;
    }

    if (!mongooseCache.promise) {
        const opts = {
            bufferCommands: false
        };

        mongooseCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose.connection;
        });
    }
    mongooseCache.conn = await mongooseCache.promise;
    return mongooseCache.conn;
}

export const client = getMongoClient();

export default {
    connect: dbConnect
};
