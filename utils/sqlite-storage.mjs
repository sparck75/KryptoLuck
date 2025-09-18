/**
 * SQLite Database Storage for Wallet Data
 * 
 * Provides optimized SQLite storage with:
 * - Indexed searches on address and private key
 * - Balance tracking and status updates
 * - Batch insert operations
 * - Query utilities for data analysis
 * - Export/import capabilities
 */

import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from './logger.mjs';

export class SQLiteWalletStorage {
    constructor(config = {}) {
        this.config = {
            dbPath: join(config.dataDir || './data', 'wallets.db'),
            batchSize: config.batchSize || 1000,
            enableWAL: true, // Write-Ahead Logging for better performance
            ...config
        };

        this.db = null;
        this.batch = [];
        this.totalStored = 0;
        this.init();
    }

    /**
     * Initialize database and create tables
     */
    init() {
        try {
            this.db = new Database(this.config.dbPath);
            
            // Enable WAL mode for better performance
            if (this.config.enableWAL) {
                this.db.pragma('journal_mode = WAL');
            }
            
            // Optimize for bulk inserts
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('cache_size = 10000');
            this.db.pragma('temp_store = memory');

            this.createTables();
            this.prepareBatchStatements();
            
            logger.info(`SQLite database initialized: ${this.config.dbPath}`);
        } catch (error) {
            logger.error(`Failed to initialize SQLite database: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create database tables and indexes
     */
    createTables() {
        // Main wallets table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                address TEXT NOT NULL UNIQUE,
                private_key TEXT NOT NULL,
                balance TEXT DEFAULT '0',
                has_balance BOOLEAN DEFAULT FALSE,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                round INTEGER DEFAULT 0,
                generation_mode TEXT DEFAULT 'unknown',
                checked_online BOOLEAN DEFAULT FALSE,
                notes TEXT
            )
        `);

        // Create indexes for fast lookups
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_address ON wallets(address);
            CREATE INDEX IF NOT EXISTS idx_has_balance ON wallets(has_balance);
            CREATE INDEX IF NOT EXISTS idx_timestamp ON wallets(timestamp);
            CREATE INDEX IF NOT EXISTS idx_round ON wallets(round);
            CREATE INDEX IF NOT EXISTS idx_generation_mode ON wallets(generation_mode);
        `);

        // Statistics table for tracking generation progress
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS generation_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_start TEXT DEFAULT CURRENT_TIMESTAMP,
                total_generated INTEGER DEFAULT 0,
                total_with_balance INTEGER DEFAULT 0,
                mode TEXT DEFAULT 'unknown',
                last_updated TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Performance tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                wallets_per_second REAL,
                batch_size INTEGER,
                storage_type TEXT,
                memory_usage_mb REAL
            )
        `);
    }

    /**
     * Prepare batch insert statements for better performance
     */
    prepareBatchStatements() {
        this.insertWallet = this.db.prepare(`
            INSERT OR IGNORE INTO wallets 
            (address, private_key, balance, has_balance, timestamp, round, generation_mode, checked_online, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        this.updateBalance = this.db.prepare(`
            UPDATE wallets 
            SET balance = ?, has_balance = ?, checked_online = TRUE 
            WHERE address = ?
        `);

        this.batchInsert = this.db.transaction((wallets) => {
            for (const wallet of wallets) {
                this.insertWallet.run(
                    wallet.address,
                    wallet.privateKey,
                    wallet.balance || '0',
                    wallet.hasBalance || false,
                    wallet.timestamp || new Date().toISOString(),
                    wallet.round || 0,
                    wallet.generationMode || 'unknown',
                    wallet.checkedOnline || false,
                    wallet.notes || null
                );
            }
        });
    }

    /**
     * Store a single wallet
     * @param {Object} wallet - Wallet object with address and privateKey
     * @param {Object} metadata - Additional metadata
     */
    async storeWallet(wallet, metadata = {}) {
        const walletData = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            balance: metadata.balance || '0',
            hasBalance: metadata.hasBalance || false,
            timestamp: new Date().toISOString(),
            round: metadata.round || 0,
            generationMode: metadata.generationMode || 'unknown',
            checkedOnline: metadata.checkedOnline || false,
            notes: metadata.notes || null
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
        const walletData = wallets.map(wallet => ({
            address: wallet.address,
            privateKey: wallet.privateKey,
            balance: metadata.balance || '0',
            hasBalance: metadata.hasBalance || false,
            timestamp: new Date().toISOString(),
            round: metadata.round || 0,
            generationMode: metadata.generationMode || 'unknown',
            checkedOnline: metadata.checkedOnline || false,
            notes: metadata.notes || null
        }));

        this.batch.push(...walletData);
        
        if (this.batch.length >= this.config.batchSize) {
            await this.flushBatch();
        }
    }

    /**
     * Flush current batch to database
     */
    async flushBatch() {
        if (this.batch.length === 0) return;

        try {
            this.batchInsert(this.batch);
            this.totalStored += this.batch.length;
            
            logger.debug(`Stored batch of ${this.batch.length} wallets to SQLite. Total: ${this.totalStored}`);
            this.batch = [];
        } catch (error) {
            logger.error(`Failed to flush batch to SQLite: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update wallet balance information
     * @param {string} address - Wallet address
     * @param {string} balance - Balance amount
     * @param {boolean} hasBalance - Whether wallet has balance
     */
    updateWalletBalance(address, balance, hasBalance = false) {
        try {
            this.updateBalance.run(balance, hasBalance, address);
            if (hasBalance) {
                logger.info(`🎉 Updated wallet ${address} with balance: ${balance}`);
            }
        } catch (error) {
            logger.error(`Failed to update wallet balance: ${error.message}`);
        }
    }

    /**
     * Find wallet by address
     * @param {string} address - Wallet address to find
     */
    findWalletByAddress(address) {
        const stmt = this.db.prepare('SELECT * FROM wallets WHERE address = ?');
        return stmt.get(address);
    }

    /**
     * Get wallets with balance
     * @param {number} limit - Maximum number of results
     */
    getWalletsWithBalance(limit = 100) {
        const stmt = this.db.prepare(`
            SELECT * FROM wallets 
            WHERE has_balance = TRUE 
            ORDER BY timestamp DESC 
            LIMIT ?
        `);
        return stmt.all(limit);
    }

    /**
     * Get generation statistics
     */
    getGenerationStats() {
        const totalWallets = this.db.prepare('SELECT COUNT(*) as count FROM wallets').get();
        const walletsWithBalance = this.db.prepare('SELECT COUNT(*) as count FROM wallets WHERE has_balance = TRUE').get();
        const latestWallet = this.db.prepare('SELECT timestamp FROM wallets ORDER BY id DESC LIMIT 1').get();
        const oldestWallet = this.db.prepare('SELECT timestamp FROM wallets ORDER BY id ASC LIMIT 1').get();

        return {
            totalGenerated: totalWallets.count,
            totalWithBalance: walletsWithBalance.count,
            latestGeneration: latestWallet?.timestamp,
            oldestGeneration: oldestWallet?.timestamp,
            currentBatchSize: this.batch.length,
            storageType: 'sqlite'
        };
    }

    /**
     * Export wallets to JSON file
     * @param {string} filename - Output filename
     * @param {Object} options - Export options
     */
    async exportToJSON(filename, options = {}) {
        const {
            limit = null,
            onlyWithBalance = false,
            includePrivateKeys = true
        } = options;

        let query = 'SELECT * FROM wallets';
        const params = [];

        if (onlyWithBalance) {
            query += ' WHERE has_balance = TRUE';
        }

        query += ' ORDER BY timestamp DESC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(limit);
        }

        const stmt = this.db.prepare(query);
        const wallets = stmt.all(...params);

        // Remove private keys if requested
        if (!includePrivateKeys) {
            wallets.forEach(wallet => delete wallet.private_key);
        }

        const fs = await import('fs/promises');
        await fs.writeFile(filename, JSON.stringify(wallets, null, 2));
        logger.info(`Exported ${wallets.length} wallets to ${filename}`);

        return wallets.length;
    }

    /**
     * Search wallets with various criteria
     * @param {Object} criteria - Search criteria
     */
    searchWallets(criteria = {}) {
        const {
            hasBalance,
            generationMode,
            fromDate,
            toDate,
            round,
            limit = 1000
        } = criteria;

        let query = 'SELECT * FROM wallets WHERE 1=1';
        const params = [];

        if (hasBalance !== undefined) {
            query += ' AND has_balance = ?';
            params.push(hasBalance);
        }

        if (generationMode) {
            query += ' AND generation_mode = ?';
            params.push(generationMode);
        }

        if (fromDate) {
            query += ' AND timestamp >= ?';
            params.push(fromDate);
        }

        if (toDate) {
            query += ' AND timestamp <= ?';
            params.push(toDate);
        }

        if (round !== undefined) {
            query += ' AND round = ?';
            params.push(round);
        }

        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(limit);

        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    /**
     * Get database size and optimization info
     */
    getDatabaseInfo() {
        const pageCount = this.db.pragma('page_count');
        const pageSize = this.db.pragma('page_size');
        const dbSize = pageCount * pageSize;

        return {
            sizeBytes: dbSize,
            sizeMB: (dbSize / 1024 / 1024).toFixed(2),
            pageCount,
            pageSize,
            walletCount: this.getGenerationStats().totalGenerated
        };
    }

    /**
     * Optimize database (VACUUM and ANALYZE)
     */
    optimize() {
        logger.info('Optimizing SQLite database...');
        this.db.exec('VACUUM');
        this.db.exec('ANALYZE');
        logger.info('Database optimization completed');
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.batch.length > 0) {
            await this.flushBatch();
        }
        
        if (this.db) {
            this.db.close();
            logger.info(`SQLite database closed. Total wallets stored: ${this.totalStored}`);
        }
    }
}

export default SQLiteWalletStorage;