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
import * as dotenv from 'dotenv'

// Load environment variables (optional for offline mode)
const result = dotenv.config();
if (result.error) {
  // .env file is optional for offline mode
  logger.debug("No .env file found, continuing in offline mode...")
}

// Handle CTRL-C to exit gracefully
process.on('SIGINT', function() {
    console.log(`\n CTRL-C received... Krypto Luck will now exit.`)
    process.exit()
})

process.title = `Krypto luck is initializing...` 
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

// Configuration
const ROUND_SIZE = 1000
let round = 1

// Main generation loop
while(true){
    // Generate and check wallets in current round
    for(let j = 0 ; j < ROUND_SIZE ; j++){
        const { address, privateKey } = ethers.Wallet.createRandom();
        if( SuccessList.indexOf(address) != -1 ){
            logger.info(`🎉 JACKPOT! We got lucky!!! ${address} : ${privateKey}`);            
        }    
    }
    process.title = `Krypto Luck is running | Wallets Generated: ${round * ROUND_SIZE}`
    round++;
    await sleep(10) // Small delay to prevent excessive CPU usage
}
