import { MongoClient, Db, Document, Collection } from "mongodb";
import {
    UserRepository,
    PermissionRepository,
    ArticleRepository,
    EventRepository,
    LinkRepository,
    HackathonRepository,
    TrackRepository,
    TeamRepository,
    CertificateRepository,
    CertificateTemplateRepository
} from "../repositories";
import type { User, PermissionTemplate, Article, Event, Link, Hackathon, Track, Team, Certificate, CertificateTemplate } from "../repositories/types";

interface MongoClientCache {
    client: MongoClient | null;
    promise: Promise<MongoClient> | null;
    db: Db | null;
}

interface RepositoryCache {
    userRepository: UserRepository | null;
    permissionRepository: PermissionRepository | null;
    articleRepository: ArticleRepository | null;
    eventRepository: EventRepository | null;
    linkRepository: LinkRepository | null;
    hackathonRepository: HackathonRepository | null;
    trackRepository: TrackRepository | null;
    teamRepository: TeamRepository | null;
    certificateRepository: CertificateRepository | null;
    certificateTemplateRepository: CertificateTemplateRepository | null;
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
        articleRepository: null,
        eventRepository: null,
        linkRepository: null,
        hackathonRepository: null,
        trackRepository: null,
        teamRepository: null,
        certificateRepository: null,
        certificateTemplateRepository: null
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
    if (
        repositoryCache.userRepository &&
        repositoryCache.permissionRepository &&
        repositoryCache.articleRepository &&
        repositoryCache.eventRepository &&
        repositoryCache.linkRepository &&
        repositoryCache.hackathonRepository &&
        repositoryCache.trackRepository &&
        repositoryCache.teamRepository &&
        repositoryCache.certificateRepository &&
        repositoryCache.certificateTemplateRepository
    ) {
        return; // Already initialized
    }

    const db = await getDatabase();

    // Create collections references
    const userCollection = db.collection<User>("user");
    const templateCollection = db.collection<PermissionTemplate>("permissiontemplates");
    const articleCollection = db.collection<Article>("articles");
    const eventCollection = db.collection<Event>("events");
    const linkCollection = db.collection<Link>("links");
    const hackathonCollection = db.collection<Hackathon>("hackathons");
    const trackCollection = db.collection<Track>("tracks");
    const teamCollection = db.collection<Team>("teams");
    const certificateCollection = db.collection<Certificate>("certificates");
    const certificateTemplateCollection = db.collection<CertificateTemplate>("certificatetemplates");

    // Create permission repository first (no dependencies)
    const permissionRepo = new PermissionRepository(templateCollection);

    // Create user repository with dependencies
    const userRepo = new UserRepository(userCollection, templateCollection as unknown as Collection<Document>, permissionRepo);

    // Create other repositories
    const articleRepo = new ArticleRepository(articleCollection);
    const eventRepo = new EventRepository(eventCollection);
    const linkRepo = new LinkRepository(linkCollection);
    const hackathonRepo = new HackathonRepository(hackathonCollection);
    const trackRepo = new TrackRepository(trackCollection);
    const teamRepo = new TeamRepository(teamCollection);
    const certificateRepo = new CertificateRepository(certificateCollection);
    const certificateTemplateRepo = new CertificateTemplateRepository(certificateTemplateCollection, certificateRepo, hackathonRepo, teamRepo, userRepo);

    // Set cross-dependencies to allow synchronization
    hackathonRepo.setTemplateRepository(certificateTemplateRepo);
    teamRepo.setTemplateRepository(certificateTemplateRepo);

    // Cache repositories
    repositoryCache.userRepository = userRepo;
    repositoryCache.permissionRepository = permissionRepo;
    repositoryCache.articleRepository = articleRepo;
    repositoryCache.eventRepository = eventRepo;
    repositoryCache.linkRepository = linkRepo;
    repositoryCache.hackathonRepository = hackathonRepo;
    repositoryCache.trackRepository = trackRepo;
    repositoryCache.teamRepository = teamRepo;
    repositoryCache.certificateRepository = certificateRepo;
    repositoryCache.certificateTemplateRepository = certificateTemplateRepo;

    // Create indexes
    await Promise.all([
        userRepo.createIndexes(),
        permissionRepo.createIndexes(),
        articleRepo.createIndexes(),
        eventRepo.createIndexes(),
        linkRepo.createIndexes(),
        hackathonRepo.createIndexes(),
        trackRepo.createIndexes(),
        teamRepo.createIndexes(),
        certificateRepo.createIndexes()
    ]);
}

// Database connection - replaces Mongoose connection
async function dbConnect(): Promise<Db> {
    const db = await getDatabase();
    await initializeRepositories();
    return db;
}

// Get repository instances
export function getRepositories() {
    if (
        !repositoryCache.userRepository ||
        !repositoryCache.permissionRepository ||
        !repositoryCache.articleRepository ||
        !repositoryCache.eventRepository ||
        !repositoryCache.linkRepository ||
        !repositoryCache.hackathonRepository ||
        !repositoryCache.trackRepository ||
        !repositoryCache.teamRepository ||
        !repositoryCache.certificateRepository ||
        !repositoryCache.certificateTemplateRepository
    ) {
        throw new Error("Repositories not initialized. Call dbConnect() first.");
    }

    return {
        userRepository: repositoryCache.userRepository,
        permissionRepository: repositoryCache.permissionRepository,
        articleRepository: repositoryCache.articleRepository,
        eventRepository: repositoryCache.eventRepository,
        linkRepository: repositoryCache.linkRepository,
        hackathonRepository: repositoryCache.hackathonRepository,
        trackRepository: repositoryCache.trackRepository,
        teamRepository: repositoryCache.teamRepository,
        certificateRepository: repositoryCache.certificateRepository,
        certificateTemplateRepository: repositoryCache.certificateTemplateRepository
    };
}

export const client = getMongoClient();

export default {
    connect: dbConnect,
    getRepositories
};
