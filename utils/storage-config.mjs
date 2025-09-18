/**
 * Storage Configuration Utility
 * 
 * Manages storage settings from environment variables and provides
 * factory functions for creating storage instances
 */

import * as dotenv from 'dotenv';
import { logger } from './logger.mjs';
import { createStorage } from './storage.mjs';

// Load environment variables
dotenv.config();

// Try to import SQLite storage, but handle gracefully if not available
let SQLiteWalletStorage = null;
try {
    const sqliteModule = await import('./sqlite-storage.mjs');
    SQLiteWalletStorage = sqliteModule.SQLiteWalletStorage;
} catch (error) {
    logger.warn('SQLite storage not available (better-sqlite3 not installed). Use compressed storage instead.');
}

/**
 * Get storage configuration from environment variables
 */
export function getStorageConfig() {
    const config = {
        // Storage type selection
        storageType: process.env.STORAGE_TYPE || 'compressed',
        
        // Storage location and batching
        dataDir: process.env.DATA_DIR || './data',
        batchSize: parseInt(process.env.BATCH_SIZE || '1000'),
        
        // Compression settings
        enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
        
        // Master storage switch
        enableStorage: process.env.ENABLE_STORAGE !== 'false',
        
        // Performance settings
        flushInterval: parseInt(process.env.FLUSH_INTERVAL || '30000'), // 30 seconds
        maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB || '512'),
    };

    // Validate storage type
    const validTypes = ['sqlite', 'compressed', 'stream', 'none'];
    if (!validTypes.includes(config.storageType)) {
        logger.warn(`Invalid storage type '${config.storageType}', defaulting to 'compressed'`);
        config.storageType = 'compressed';
    }

    // Validate batch size
    if (config.batchSize < 1 || config.batchSize > 10000) {
        logger.warn(`Invalid batch size ${config.batchSize}, defaulting to 1000`);
        config.batchSize = 1000;
    }

    logger.info(`Storage configuration: ${config.storageType} storage, batch size ${config.batchSize}, compression ${config.enableCompression ? 'enabled' : 'disabled'}`);
    
    return config;
}

/**
 * Create appropriate storage instance based on configuration
 */
export function createStorageInstance(config = null) {
    const storageConfig = config || getStorageConfig();
    
    // Check if storage is disabled
    if (!storageConfig.enableStorage || storageConfig.storageType === 'none') {
        logger.info('Wallet storage is disabled');
        return new NoOpStorage();
    }

    // Create storage instance based on type
    switch (storageConfig.storageType) {
        case 'sqlite':
            if (SQLiteWalletStorage) {
                logger.info('Using SQLite storage for wallet data');
                return new SQLiteWalletStorage(storageConfig);
            } else {
                logger.warn('SQLite storage requested but not available. Falling back to compressed storage.');
                return createStorage({ ...storageConfig, storageType: 'compressed' });
            }
            
        case 'compressed':
        case 'stream':
            logger.info(`Using ${storageConfig.storageType} file storage for wallet data`);
            return createStorage(storageConfig);
            
        default:
            logger.warn(`Unknown storage type: ${storageConfig.storageType}, using compressed storage`);
            return createStorage({ ...storageConfig, storageType: 'compressed' });
    }
}

/**
 * No-operation storage for when storage is disabled
 */
export class NoOpStorage {
    constructor() {
        this.totalStored = 0;
    }

    async storeWallet(wallet, metadata = {}) {
        // Do nothing
    }

    async storeWallets(wallets, metadata = {}) {
        // Do nothing
    }

    async flushBatch() {
        // Do nothing
    }

    getStats() {
        return {
            totalStored: 0,
            batchSize: 0,
            storageType: 'none',
            dataDirectory: 'disabled'
        };
    }

    async close() {
        // Do nothing
    }
}

/**
 * Storage wrapper with automatic flushing and error handling
 */
export class ManagedStorage {
    constructor(storage, config = {}) {
        this.storage = storage;
        this.config = config;
        this.flushTimer = null;
        this.isClosing = false;

        // Set up automatic flushing if enabled
        if (config.flushInterval && config.flushInterval > 0) {
            this.startAutoFlush();
        }

        // Set up graceful shutdown handlers
        this.setupShutdownHandlers();
    }

    /**
     * Start automatic batch flushing
     */
    startAutoFlush() {
        this.flushTimer = setInterval(async () => {
            try {
                await this.storage.flushBatch();
            } catch (error) {
                logger.error(`Auto-flush failed: ${error.message}`);
            }
        }, this.config.flushInterval);

        logger.debug(`Auto-flush enabled with interval: ${this.config.flushInterval}ms`);
    }

    /**
     * Set up process exit handlers for graceful shutdown
     */
    setupShutdownHandlers() {
        const shutdown = async () => {
            if (this.isClosing) return;
            this.isClosing = true;

            logger.info('Gracefully closing storage...');
            
            if (this.flushTimer) {
                clearInterval(this.flushTimer);
            }

            try {
                await this.storage.close();
            } catch (error) {
                logger.error(`Error closing storage: ${error.message}`);
            }
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('beforeExit', shutdown);
    }

    /**
     * Delegate storage operations to underlying storage
     */
    async storeWallet(wallet, metadata = {}) {
        if (this.isClosing) return;
        return await this.storage.storeWallet(wallet, metadata);
    }

    async storeWallets(wallets, metadata = {}) {
        if (this.isClosing) return;
        return await this.storage.storeWallets(wallets, metadata);
    }

    async flushBatch() {
        if (this.isClosing) return;
        return await this.storage.flushBatch();
    }

    getStats() {
        return this.storage.getStats();
    }

    async close() {
        this.isClosing = true;
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        return await this.storage.close();
    }
}

/**
 * Create a fully managed storage instance
 */
export function createManagedStorage(config = null) {
    const storageConfig = config || getStorageConfig();
    const storage = createStorageInstance(storageConfig);
    return new ManagedStorage(storage, storageConfig);
}

/**
 * Get storage performance recommendations based on system
 */
export function getPerformanceRecommendations() {
    const recommendations = {
        storageType: 'compressed',
        batchSize: 1000,
        enableCompression: true,
        flushInterval: 30000
    };

    // Platform-specific recommendations
    if (process.platform === 'linux') {
        recommendations.storageType = 'sqlite';
        recommendations.batchSize = 2000;
    } else if (process.platform === 'win32') {
        recommendations.storageType = 'compressed';
        recommendations.batchSize = 1000;
    }

    // Memory-based recommendations
    const memoryGB = process.memoryUsage().heapTotal / (1024 * 1024 * 1024);
    if (memoryGB > 4) {
        recommendations.batchSize = Math.min(5000, recommendations.batchSize * 2);
    }

    return recommendations;
}

export default {
    getStorageConfig,
    createStorageInstance,
    createManagedStorage,
    getPerformanceRecommendations,
    NoOpStorage,
    ManagedStorage
};