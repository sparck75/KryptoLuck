/**
 * Wallet Storage System
 * 
 * Optimized storage solutions for generated wallet data with multiple backends:
 * - SQLite: Structured storage with indexing for fast queries
 * - Compressed JSON: Lightweight bulk storage with gzip compression  
 * - Stream: High-performance streaming writes for continuous generation
 * 
 * Features:
 * - Configurable storage backend
 * - Batch writes for performance
 * - Compression to minimize disk usage
 * - Indexing for fast lookups
 * - Export/import capabilities
 */

import { existsSync, mkdirSync, createWriteStream, createReadStream } from 'fs';
import { writeFile, readFile, appendFile } from 'fs/promises';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { join, dirname } from 'path';
import { logger } from './logger.mjs';

/**
 * Base storage interface for wallet data
 */
export class WalletStorage {
    constructor(config = {}) {
        this.config = {
            storageType: 'compressed', // 'sqlite', 'compressed', 'stream'
            dataDir: './data',
            batchSize: 1000,
            enableCompression: true,
            ...config
        };
        
        this.ensureDataDirectory();
        this.batch = [];
        this.totalStored = 0;
    }

    /**
     * Ensure data directory exists
     */
    ensureDataDirectory() {
        if (!existsSync(this.config.dataDir)) {
            mkdirSync(this.config.dataDir, { recursive: true });
            logger.info(`Created data directory: ${this.config.dataDir}`);
        }
    }

    /**
     * Store a single wallet
     * @param {Object} wallet - Wallet object with address and privateKey
     * @param {Object} metadata - Additional metadata (balance, timestamp, etc.)
     */
    async storeWallet(wallet, metadata = {}) {
        const walletData = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            timestamp: new Date().toISOString(),
            balance: metadata.balance || '0',
            hasBalance: metadata.hasBalance || false,
            round: metadata.round || 0,
            ...metadata
        };

        this.batch.push(walletData);
        
        if (this.batch.length >= this.config.batchSize) {
            await this.flushBatch();
        }
    }

    /**
     * Store multiple wallets at once
     * @param {Array} wallets - Array of wallet objects
     * @param {Object} metadata - Common metadata for all wallets
     */
    async storeWallets(wallets, metadata = {}) {
        for (const wallet of wallets) {
            await this.storeWallet(wallet, metadata);
        }
    }

    /**
     * Flush current batch to storage
     */
    async flushBatch() {
        if (this.batch.length === 0) return;

        try {
            switch (this.config.storageType) {
                case 'compressed':
                    await this.writeCompressedBatch();
                    break;
                case 'stream':
                    await this.writeStreamBatch();
                    break;
                case 'sqlite':
                    await this.writeSQLiteBatch();
                    break;
                default:
                    throw new Error(`Unknown storage type: ${this.config.storageType}`);
            }

            this.totalStored += this.batch.length;
            logger.debug(`Stored batch of ${this.batch.length} wallets. Total: ${this.totalStored}`);
            this.batch = [];
        } catch (error) {
            logger.error(`Failed to flush batch: ${error.message}`);
            throw error;
        }
    }

    /**
     * Write batch to compressed JSON file
     */
    async writeCompressedBatch() {
        const filename = join(this.config.dataDir, `wallets_${Date.now()}.json.gz`);
        const data = JSON.stringify(this.batch);
        
        if (this.config.enableCompression) {
            // Write directly to gzip stream
            const writeStream = createWriteStream(filename);
            const gzipStream = createGzip({ level: 6 }); // Good compression/speed balance
            
            gzipStream.pipe(writeStream);
            gzipStream.write(data);
            gzipStream.end();
            
            // Wait for completion
            return new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });
        } else {
            // Write uncompressed
            const plainFilename = filename.replace('.gz', '');
            await writeFile(plainFilename, data, 'utf8');
        }
    }

    /**
     * Write batch to streaming file (append mode)
     */
    async writeStreamBatch() {
        const filename = join(this.config.dataDir, 'wallets_stream.jsonl');
        const lines = this.batch.map(wallet => JSON.stringify(wallet)).join('\n') + '\n';
        
        await appendFile(filename, lines, 'utf8');
    }

    /**
     * Write batch to SQLite database (placeholder for future implementation)
     */
    async writeSQLiteBatch() {
        // TODO: Implement SQLite storage
        logger.warn('SQLite storage not yet implemented, falling back to compressed storage');
        await this.writeCompressedBatch();
    }

    /**
     * Get storage statistics
     */
    getStats() {
        return {
            totalStored: this.totalStored,
            batchSize: this.batch.length,
            storageType: this.config.storageType,
            dataDirectory: this.config.dataDir
        };
    }

    /**
     * Close storage and flush any remaining data
     */
    async close() {
        if (this.batch.length > 0) {
            await this.flushBatch();
        }
        logger.info(`Storage closed. Total wallets stored: ${this.totalStored}`);
    }
}

/**
 * Compressed file storage implementation
 */
export class CompressedStorage extends WalletStorage {
    constructor(config = {}) {
        super({ ...config, storageType: 'compressed' });
    }

    /**
     * Read wallets from a specific compressed file
     * @param {string} filename - Filename to read from
     */
    async readWalletsFromFile(filename) {
        const filepath = join(this.config.dataDir, filename);
        
        if (!existsSync(filepath)) {
            throw new Error(`File not found: ${filepath}`);
        }

        try {
            if (filepath.endsWith('.gz')) {
                // Read compressed file
                const readStream = createReadStream(filepath);
                const gunzipStream = createGunzip();
                let data = '';
                
                await pipeline(
                    readStream,
                    gunzipStream,
                    async function* (source) {
                        for await (const chunk of source) {
                            data += chunk.toString();
                        }
                    }
                );
                
                return JSON.parse(data);
            } else {
                // Read uncompressed file
                const data = await readFile(filepath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            logger.error(`Failed to read wallets from ${filename}: ${error.message}`);
            throw error;
        }
    }

    /**
     * List all wallet files
     */
    async listWalletFiles() {
        const fs = await import('fs/promises');
        try {
            const files = await fs.readdir(this.config.dataDir);
            return files.filter(file => 
                file.startsWith('wallets_') && 
                (file.endsWith('.json') || file.endsWith('.json.gz'))
            );
        } catch (error) {
            logger.error(`Failed to list wallet files: ${error.message}`);
            return [];
        }
    }

    /**
     * Get total count of stored wallets across all files
     */
    async getTotalWalletCount() {
        const files = await this.listWalletFiles();
        let total = 0;
        
        for (const file of files) {
            try {
                const wallets = await this.readWalletsFromFile(file);
                total += wallets.length;
            } catch (error) {
                logger.warn(`Could not count wallets in ${file}: ${error.message}`);
            }
        }
        
        return total;
    }
}

/**
 * Stream storage implementation for high-performance writes
 */
export class StreamStorage extends WalletStorage {
    constructor(config = {}) {
        super({ ...config, storageType: 'stream' });
        this.streamFile = join(this.config.dataDir, 'wallets_stream.jsonl');
    }

    /**
     * Read all wallets from stream file
     */
    async readAllWallets() {
        if (!existsSync(this.streamFile)) {
            return [];
        }

        try {
            const data = await readFile(this.streamFile, 'utf8');
            const lines = data.split('\n').filter(line => line.trim());
            return lines.map(line => JSON.parse(line));
        } catch (error) {
            logger.error(`Failed to read stream file: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get total wallet count from stream file
     */
    async getTotalWalletCount() {
        if (!existsSync(this.streamFile)) {
            return 0;
        }

        try {
            const data = await readFile(this.streamFile, 'utf8');
            const lines = data.split('\n').filter(line => line.trim());
            return lines.length;
        } catch (error) {
            logger.error(`Failed to count wallets in stream file: ${error.message}`);
            return 0;
        }
    }
}

/**
 * Factory function to create appropriate storage instance
 * @param {Object} config - Storage configuration
 */
export function createStorage(config = {}) {
    switch (config.storageType) {
        case 'compressed':
            return new CompressedStorage(config);
        case 'stream':
            return new StreamStorage(config);
        case 'sqlite':
            logger.warn('SQLite storage not yet implemented, using compressed storage');
            return new CompressedStorage(config);
        default:
            return new CompressedStorage(config);
    }
}

export default { WalletStorage, CompressedStorage, StreamStorage, createStorage };