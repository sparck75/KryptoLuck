#!/usr/bin/env node

/**
 * Wallet Data Analysis and Export Utility
 * 
 * Command-line tool for querying, analyzing, and exporting stored wallet data.
 * Supports multiple storage backends and provides various analysis options.
 * 
 * Usage:
 *   node wallet-tools.mjs [command] [options]
 * 
 * Commands:
 *   stats       - Show storage statistics
 *   export      - Export wallet data to JSON
 *   search      - Search wallets by criteria
 *   jackpots    - Show wallets with balance
 *   analyze     - Perform data analysis
 *   optimize    - Optimize storage (SQLite only)
 *   cleanup     - Clean up old data files
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger.mjs';
import { getStorageConfig, createStorageInstance } from './utils/storage-config.mjs';
import { SQLiteWalletStorage } from './utils/sqlite-storage.mjs';
import { CompressedStorage, StreamStorage } from './utils/storage.mjs';

class WalletAnalyzer {
    constructor() {
        this.config = getStorageConfig();
        this.storage = null;
    }

    async init() {
        this.storage = createStorageInstance(this.config);
        if (this.storage.close) {
            // Ensure we can close the storage when done
            process.on('exit', () => this.storage.close());
        }
    }

    /**
     * Show storage statistics
     */
    async showStats() {
        console.log('\n📊 KryptoLuck Storage Statistics');
        console.log('================================\n');

        if (this.storage instanceof SQLiteWalletStorage) {
            const stats = this.storage.getGenerationStats();
            const dbInfo = this.storage.getDatabaseInfo();

            console.log(`Storage Type: SQLite Database`);
            console.log(`Database Size: ${dbInfo.sizeMB} MB (${dbInfo.sizeBytes.toLocaleString()} bytes)`);
            console.log(`Total Wallets: ${stats.totalGenerated.toLocaleString()}`);
            console.log(`Wallets with Balance: ${stats.totalWithBalance.toLocaleString()}`);
            console.log(`Success Rate: ${stats.totalGenerated > 0 ? ((stats.totalWithBalance / stats.totalGenerated) * 100).toFixed(10) : 0}%`);
            console.log(`First Generation: ${stats.oldestGeneration || 'N/A'}`);
            console.log(`Last Generation: ${stats.latestGeneration || 'N/A'}`);

        } else if (this.storage instanceof CompressedStorage) {
            const files = await this.storage.listWalletFiles();
            const totalWallets = await this.storage.getTotalWalletCount();

            console.log(`Storage Type: Compressed Files`);
            console.log(`Data Directory: ${this.config.dataDir}`);
            console.log(`Number of Files: ${files.length}`);
            console.log(`Total Wallets: ${totalWallets.toLocaleString()}`);
            console.log(`Files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);

        } else if (this.storage instanceof StreamStorage) {
            const totalWallets = await this.storage.getTotalWalletCount();

            console.log(`Storage Type: Stream File`);
            console.log(`Data Directory: ${this.config.dataDir}`);
            console.log(`Total Wallets: ${totalWallets.toLocaleString()}`);

        } else {
            console.log(`Storage Type: Disabled or Unknown`);
        }

        console.log(`\nConfiguration:`);
        console.log(`- Batch Size: ${this.config.batchSize}`);
        console.log(`- Compression: ${this.config.enableCompression ? 'Enabled' : 'Disabled'}`);
        console.log(`- Storage Enabled: ${this.config.enableStorage ? 'Yes' : 'No'}`);
    }

    /**
     * Export wallet data to JSON file
     */
    async exportData(options = {}) {
        const {
            filename = `wallets-export-${Date.now()}.json`,
            limit = null,
            onlyWithBalance = false,
            includePrivateKeys = true
        } = options;

        console.log(`\n📤 Exporting wallet data to ${filename}...`);

        if (this.storage instanceof SQLiteWalletStorage) {
            const count = await this.storage.exportToJSON(filename, {
                limit,
                onlyWithBalance,
                includePrivateKeys
            });
            console.log(`✅ Exported ${count} wallets to ${filename}`);

        } else if (this.storage instanceof CompressedStorage) {
            const files = await this.storage.listWalletFiles();
            const allWallets = [];

            for (const file of files) {
                try {
                    const wallets = await this.storage.readWalletsFromFile(file);
                    allWallets.push(...wallets);
                } catch (error) {
                    console.warn(`⚠️  Could not read ${file}: ${error.message}`);
                }
            }

            // Filter and limit
            let exportWallets = allWallets;
            if (onlyWithBalance) {
                exportWallets = exportWallets.filter(w => w.hasBalance);
            }
            if (limit) {
                exportWallets = exportWallets.slice(0, limit);
            }
            if (!includePrivateKeys) {
                exportWallets.forEach(w => delete w.privateKey);
            }

            const fs = await import('fs/promises');
            await fs.writeFile(filename, JSON.stringify(exportWallets, null, 2));
            console.log(`✅ Exported ${exportWallets.length} wallets to ${filename}`);

        } else {
            console.log(`❌ Export not supported for current storage type`);
        }
    }

    /**
     * Search wallets by criteria
     */
    async searchWallets(criteria = {}) {
        console.log('\n🔍 Searching wallets...\n');

        if (this.storage instanceof SQLiteWalletStorage) {
            const results = this.storage.searchWallets(criteria);
            
            console.log(`Found ${results.length} wallets matching criteria:`);
            
            if (results.length > 0) {
                console.log('\nSample results:');
                results.slice(0, 10).forEach((wallet, i) => {
                    console.log(`${i + 1}. ${wallet.address} - Balance: ${wallet.balance} ETH - Round: ${wallet.round}`);
                });
                
                if (results.length > 10) {
                    console.log(`... and ${results.length - 10} more`);
                }
            }

            return results;
        } else {
            console.log(`❌ Search not supported for current storage type`);
            return [];
        }
    }

    /**
     * Show wallets with balance (jackpots)
     */
    async showJackpots() {
        console.log('\n🎰 Jackpot Wallets (with balance)\n');

        if (this.storage instanceof SQLiteWalletStorage) {
            const jackpots = this.storage.getWalletsWithBalance(100);
            
            if (jackpots.length === 0) {
                console.log('No jackpot wallets found yet. Keep generating!');
            } else {
                console.log(`Found ${jackpots.length} jackpot wallets:\n`);
                
                jackpots.forEach((wallet, i) => {
                    console.log(`🎉 ${i + 1}. ${wallet.address}`);
                    console.log(`   Private Key: ${wallet.private_key}`);
                    console.log(`   Balance: ${wallet.balance} ETH`);
                    console.log(`   Found: ${wallet.timestamp}`);
                    console.log(`   Mode: ${wallet.generation_mode}`);
                    console.log('');
                });
            }

            return jackpots;
        } else {
            console.log(`❌ Jackpot search not supported for current storage type`);
            return [];
        }
    }

    /**
     * Perform data analysis
     */
    async analyzeData() {
        console.log('\n📈 Data Analysis\n');

        if (this.storage instanceof SQLiteWalletStorage) {
            // Generation rate analysis
            const db = this.storage.db;
            
            // Wallets per hour
            const hourlyStats = db.prepare(`
                SELECT 
                    strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                    COUNT(*) as count
                FROM wallets 
                WHERE timestamp > datetime('now', '-24 hours')
                GROUP BY hour
                ORDER BY hour DESC
                LIMIT 24
            `).all();

            if (hourlyStats.length > 0) {
                console.log('📊 Generation Rate (Last 24 Hours):');
                hourlyStats.forEach(stat => {
                    console.log(`   ${stat.hour}: ${stat.count.toLocaleString()} wallets`);
                });
                console.log('');
            }

            // Mode distribution
            const modeStats = db.prepare(`
                SELECT 
                    generation_mode,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM wallets), 2) as percentage
                FROM wallets
                GROUP BY generation_mode
            `).all();

            if (modeStats.length > 0) {
                console.log('🎯 Generation Mode Distribution:');
                modeStats.forEach(stat => {
                    console.log(`   ${stat.generation_mode}: ${stat.count.toLocaleString()} (${stat.percentage}%)`);
                });
                console.log('');
            }

            // Round distribution
            const roundStats = db.prepare(`
                SELECT 
                    round,
                    COUNT(*) as count
                FROM wallets
                GROUP BY round
                ORDER BY round DESC
                LIMIT 10
            `).all();

            if (roundStats.length > 0) {
                console.log('🔄 Recent Rounds:');
                roundStats.forEach(stat => {
                    console.log(`   Round ${stat.round}: ${stat.count.toLocaleString()} wallets`);
                });
            }

        } else {
            console.log(`❌ Analysis not supported for current storage type`);
        }
    }

    /**
     * Optimize storage
     */
    async optimizeStorage() {
        console.log('\n🔧 Optimizing storage...\n');

        if (this.storage instanceof SQLiteWalletStorage) {
            const beforeInfo = this.storage.getDatabaseInfo();
            console.log(`Database size before optimization: ${beforeInfo.sizeMB} MB`);
            
            this.storage.optimize();
            
            const afterInfo = this.storage.getDatabaseInfo();
            console.log(`Database size after optimization: ${afterInfo.sizeMB} MB`);
            
            const savings = beforeInfo.sizeBytes - afterInfo.sizeBytes;
            if (savings > 0) {
                console.log(`💾 Space saved: ${(savings / 1024 / 1024).toFixed(2)} MB`);
            }
        } else {
            console.log(`❌ Optimization not supported for current storage type`);
        }
    }

    /**
     * Clean up old data files
     */
    async cleanup(daysOld = 7) {
        console.log(`\n🧹 Cleaning up files older than ${daysOld} days...\n`);

        if (this.storage instanceof CompressedStorage) {
            const files = await this.storage.listWalletFiles();
            const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
            
            let cleanedCount = 0;
            const fs = await import('fs/promises');
            
            for (const file of files) {
                try {
                    const filepath = join(this.config.dataDir, file);
                    const stats = await fs.stat(filepath);
                    
                    if (stats.mtime.getTime() < cutoffTime) {
                        await fs.unlink(filepath);
                        console.log(`🗑️  Deleted: ${file}`);
                        cleanedCount++;
                    }
                } catch (error) {
                    console.warn(`⚠️  Could not process ${file}: ${error.message}`);
                }
            }
            
            console.log(`\n✅ Cleaned up ${cleanedCount} old files`);
        } else {
            console.log(`❌ Cleanup not supported for current storage type`);
        }
    }

    async close() {
        if (this.storage && this.storage.close) {
            await this.storage.close();
        }
    }
}

// Command-line interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'stats';

    const analyzer = new WalletAnalyzer();
    await analyzer.init();

    try {
        switch (command) {
            case 'stats':
                await analyzer.showStats();
                break;

            case 'export':
                const exportOptions = {
                    filename: args[1] || undefined,
                    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
                    onlyWithBalance: args.includes('--balance-only'),
                    includePrivateKeys: !args.includes('--no-private-keys')
                };
                await analyzer.exportData(exportOptions);
                break;

            case 'search':
                const searchCriteria = {
                    hasBalance: args.includes('--with-balance') ? true : undefined,
                    generationMode: args.includes('--mode') ? args[args.indexOf('--mode') + 1] : undefined,
                    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 1000
                };
                await analyzer.searchWallets(searchCriteria);
                break;

            case 'jackpots':
                await analyzer.showJackpots();
                break;

            case 'analyze':
                await analyzer.analyzeData();
                break;

            case 'optimize':
                await analyzer.optimizeStorage();
                break;

            case 'cleanup':
                const days = args[1] ? parseInt(args[1]) : 7;
                await analyzer.cleanup(days);
                break;

            case 'help':
            default:
                console.log(`
🎲 KryptoLuck Wallet Analysis Tool

Usage: node wallet-tools.mjs [command] [options]

Commands:
  stats                     - Show storage statistics
  export [filename]         - Export wallet data to JSON
  search                    - Search wallets by criteria
  jackpots                  - Show wallets with balance
  analyze                   - Perform data analysis
  optimize                  - Optimize storage (SQLite only)
  cleanup [days]            - Clean up files older than N days (default: 7)
  help                      - Show this help message

Export Options:
  --limit N                 - Limit number of wallets to export
  --balance-only           - Export only wallets with balance
  --no-private-keys        - Exclude private keys from export

Search Options:
  --with-balance           - Search only wallets with balance
  --mode [offline|online]  - Filter by generation mode
  --limit N                - Limit number of results

Examples:
  node wallet-tools.mjs stats
  node wallet-tools.mjs export wallets.json --limit 10000
  node wallet-tools.mjs search --with-balance
  node wallet-tools.mjs cleanup 30
                `);
                break;
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    } finally {
        await analyzer.close();
    }
}

// Run if called directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
    main().catch(console.error);
}

export { WalletAnalyzer };
export default WalletAnalyzer;