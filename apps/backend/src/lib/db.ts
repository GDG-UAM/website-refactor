import { MongoClient, Db, Document, Collection } from "mongodb";
import { UserRepository, PermissionRepository } from "../repositories";
import type { User, PermissionTemplate } from "../repositories/types";

interface MongoClientCache {
    client: MongoClient | null;
    promise: Promise<MongoClient> | null;
    db: Db | null;
}

interface RepositoryCache {
    userRepository: UserRepository | null;
    permissionRepository: PermissionRepository | null;
}

// Extend the global object to include mongo client cache
declare global {
    var mongoClient: MongoClientCache | undefined;
    var repositories: RepositoryCache | undefined;
}

const clientCache: MongoClientCache = global.mongoClient || (global.mongoClient = { client: null, promise: null, db: null });
const repositoryCache: RepositoryCache =
    global.repositories ||
    (global.repositories = {
        userRepository: null,
        permissionRepository: null
    });

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

// Get database instance
async function getDatabase(): Promise<Db> {
    if (clientCache.db) {
        return clientCache.db;
    }

    const client = getMongoClient();

    // Connect if not already connected
    try {
        await client.db().admin().ping();
    } catch {
        await client.connect();
    }

    clientCache.db = client.db();
    return clientCache.db;
}

// Initialize repositories
async function initializeRepositories(): Promise<void> {
    if (repositoryCache.userRepository && repositoryCache.permissionRepository) {
        return; // Already initialized
    }

    const db = await getDatabase();

    // Create collections references
    const userCollection = db.collection<User>("user");
    const templateCollection = db.collection<PermissionTemplate>("permissiontemplates");

    // Create permission repository first (no dependencies)
    const permissionRepo = new PermissionRepository(templateCollection);

    // Create user repository with dependencies
    const userRepo = new UserRepository(userCollection, templateCollection as unknown as Collection<Document>, permissionRepo);

    // Cache repositories
    repositoryCache.userRepository = userRepo;
    repositoryCache.permissionRepository = permissionRepo;

    // Create indexes
    await Promise.all([userRepo.createIndexes(), permissionRepo.createIndexes()]);
}

// Database connection - replaces Mongoose connection
async function dbConnect(): Promise<Db> {
    const db = await getDatabase();
    await initializeRepositories();
    return db;
}

// Get repository instances
export function getRepositories() {
    if (!repositoryCache.userRepository || !repositoryCache.permissionRepository) {
        throw new Error("Repositories not initialized. Call dbConnect() first.");
    }

    return {
        userRepository: repositoryCache.userRepository,
        permissionRepository: repositoryCache.permissionRepository
    };
}

export const client = getMongoClient();

export default {
    connect: dbConnect,
    getRepositories
};
