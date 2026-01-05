import { MongoClient, Db } from "mongodb";
import { UserRepository, PermissionRepository, PermissionTemplateRepository } from "../repositories";
import type { User, Permission, PermissionTemplate } from "../repositories/types";

interface MongoClientCache {
    client: MongoClient | null;
    promise: Promise<MongoClient> | null;
    db: Db | null;
}

interface RepositoryCache {
    userRepository: UserRepository | null;
    permissionRepository: PermissionRepository | null;
    permissionTemplateRepository: PermissionTemplateRepository | null;
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
        permissionRepository: null,
        permissionTemplateRepository: null
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
    if (repositoryCache.userRepository && repositoryCache.permissionRepository && repositoryCache.permissionTemplateRepository) {
        return; // Already initialized
    }

    const db = await getDatabase();

    // Create repository instances
    const userRepo = new UserRepository(db.collection<User>("user"));
    const templateRepo = new PermissionTemplateRepository(db.collection<PermissionTemplate>("permissiontemplates"));
    const permissionRepo = new PermissionRepository(db.collection<Permission>("permissions"), templateRepo, userRepo);

    // Cache repositories
    repositoryCache.userRepository = userRepo;
    repositoryCache.permissionRepository = permissionRepo;
    repositoryCache.permissionTemplateRepository = templateRepo;

    // Create indexes
    await Promise.all([userRepo.createIndexes(), permissionRepo.createIndexes(), templateRepo.createIndexes()]);
}

// Database connection - replaces Mongoose connection
async function dbConnect(): Promise<Db> {
    const db = await getDatabase();
    await initializeRepositories();
    return db;
}

// Get repository instances
export function getRepositories() {
    if (!repositoryCache.userRepository || !repositoryCache.permissionRepository || !repositoryCache.permissionTemplateRepository) {
        throw new Error("Repositories not initialized. Call dbConnect() first.");
    }

    return {
        userRepository: repositoryCache.userRepository,
        permissionRepository: repositoryCache.permissionRepository,
        permissionTemplateRepository: repositoryCache.permissionTemplateRepository
    };
}

export const client = getMongoClient();

export default {
    connect: dbConnect,
    getRepositories
};
