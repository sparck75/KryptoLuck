/**
 * KryptoLuck Online Mode
 * 
 * This script continuously generates random Ethereum wallets and checks their
 * balance on the Ethereum blockchain using Infura RPC endpoints.
 * 
 * Features:
 * - Real-time blockchain balance checking
 * - Multicall optimization for batch requests
 * - Configurable batch size (ROUND_SIZE)
 * - Progress tracking in process title
 * 
 * Usage: node luck-online.mjs
 * 
 * Requirements:
 * - .env file with INFURA_KEY
 * - Internet connection
 * - Node.js 14+
 */

import { KryptoLuck } from './src/blockchain.mjs';
import { create_account } from './src/create_account.mjs';
import { logger } from './utils/logger.mjs';
import { updateProcessTitle, createProgressTitle } from './utils/title.mjs';
import { createManagedStorage } from './utils/storage-config.mjs';
import * as dotenv from 'dotenv'

// Load environment variables
const result = dotenv.config();
if (result.error) {
  throw result.error;
}

// Handle graceful shutdown on both Windows and Linux
process.on('SIGINT', function() {
    console.log(`\n CTRL-C received... Krypto Luck will now exit.`)
    process.exit()
})

// Linux also supports SIGTERM for graceful shutdown
process.on('SIGTERM', function() {
    console.log(`\n SIGTERM received... Krypto Luck will now exit.`)
    process.exit()
})

updateProcessTitle(`Krypto luck is initializing...`)
logger.info("Krypto luck is initializing...")

// Initialize blockchain connection
const RPC = process.env.RPC + process.env.INFURA_KEY

const luck = new KryptoLuck(RPC)
await luck.loadProvider()

logger.info("Krypto luck is running...")

// Initialize storage system
const storage = createManagedStorage();
logger.info(`Storage initialized: ${storage.getStats().storageType}`);

// Configuration
const ROUND_SIZE = 1000
let round = 1

// Main generation loop
while(true){
    const list = create_account(ROUND_SIZE)   
    
    // Validate on blockchain with storage callback
    await luck.validateOnChain(list, async (wallet, metadata) => {
        // Store each wallet with its balance information
        await storage.storeWallet(wallet, {
            ...metadata,
            round: round,
            generationMode: 'online'
        });
    });
    
    updateProcessTitle(createProgressTitle(round, ROUND_SIZE))
    
    // Log progress with storage stats
    const stats = storage.getStats();
    logger.verbose(`Round ${round} completed. Generated: ${round * ROUND_SIZE}, Stored: ${stats.totalStored}`);
    console.log(round * ROUND_SIZE)
    
    round++;
}
