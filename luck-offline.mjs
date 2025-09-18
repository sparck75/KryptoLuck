/**
 * KryptoLuck Offline Mode
 * 
 * This script continuously generates random Ethereum wallets and compares them
 * against a pre-loaded list of known wealthy addresses from RichEtherAddress.json.
 * 
 * Features:
 * - No internet connection required
 * - Faster execution (no network delays)
 * - Uses local address comparison
 * - Configurable batch size (ROUND_SIZE)
 * - Progress tracking in process title
 * 
 * Usage: node luck-offline.mjs
 * 
 * Requirements:
 * - RichEtherAddress.json file
 * - Node.js 14+
 */

import { KryptoLuckOffline } from './src/offline.mjs';
import { ethers } from "ethers";
import { logger } from './utils/logger.mjs';
import { sleep } from './utils/sleep.mjs';
import { updateProcessTitle, createProgressTitle } from './utils/title.mjs';
import { createManagedStorage } from './utils/storage-config.mjs';
import * as dotenv from 'dotenv'

// Load environment variables (optional for offline mode)
const result = dotenv.config();
if (result.error) {
  // .env file is optional for offline mode
  logger.debug("No .env file found, continuing in offline mode...")
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

// Initialize offline mode with rich address list
const luck = new KryptoLuckOffline('RichEtherAddress.json')
const RichList = await luck.loadRichWallet()

// Create array of addresses for faster lookup
const SuccessList = []
for(let i = 0 ; i < RichList.length ; i++)
{
    SuccessList.push(RichList[i].address)
}

logger.info("Krypto luck is running...")

// Initialize storage system
const storage = createManagedStorage();
logger.info(`Storage initialized: ${storage.getStats().storageType}`);

// Configuration
const ROUND_SIZE = 1000
let round = 1

// Main generation loop
while(true){
    const roundWallets = [];
    
    // Generate and check wallets in current round
    for(let j = 0 ; j < ROUND_SIZE ; j++){
        const { address, privateKey } = ethers.Wallet.createRandom();
        
        // Store wallet data for batch processing
        roundWallets.push({ address, privateKey });
        
        if( SuccessList.indexOf(address) != -1 ){
            logger.info(`🎉 JACKPOT! We got lucky!!! ${address} : ${privateKey}`);
            
            // Store the jackpot wallet with special metadata
            await storage.storeWallet(
                { address, privateKey }, 
                { 
                    hasBalance: true, 
                    round: round, 
                    generationMode: 'offline',
                    notes: 'Found in RichEtherAddress.json list'
                }
            );
        }    
    }
    
    // Store the batch of generated wallets
    await storage.storeWallets(roundWallets, {
        round: round,
        generationMode: 'offline',
        hasBalance: false
    });
    
    updateProcessTitle(createProgressTitle(round, ROUND_SIZE))
    
    // Log progress with storage stats
    const stats = storage.getStats();
    logger.verbose(`Round ${round} completed. Generated: ${round * ROUND_SIZE}, Stored: ${stats.totalStored}`);
    
    round++;
    await sleep(10) // Small delay to prevent excessive CPU usage
}
