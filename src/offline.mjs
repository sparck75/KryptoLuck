import { logger } from '../utils/logger.mjs';
import { readFileSync } from 'fs';

/**
 * KryptoLuckOffline class for offline wallet validation
 * Compares generated wallets against a pre-loaded list of known wealthy addresses
 */
export class KryptoLuckOffline {
    status = 0;
    provider = undefined;

    /**
     * Creates an instance of KryptoLuckOffline
     * @param {string} filename - Path to the JSON file containing wealthy addresses
     */
    constructor(filename) {
        this.status = 0
        this.filename = filename
    }

    /**
     * Loads the list of wealthy wallet addresses from disk
     * Reads the JSON file containing known addresses with balances
     * 
     * @async
     * @returns {Array<{address: string}>} Array of wealthy wallet addresses
     * @throws {Error} If file cannot be read or parsed
     */
    loadRichWallet =  async function(){
        logger.verbose(`Reading data from disk...`);
  
        const filename = this.filename;
      
        let file = filename;
        logger.info(`Loading rich wallet list from: ${file}`);
        const _dataArray = JSON.parse(readFileSync(file));
        logger.info(`${_dataArray.length} wallet addresses loaded successfully.`);
        this.status = 1
        return _dataArray;
    }

    /**
     * Updates the process title with current progress statistics
     * 
     * @async
     * @param {number} round - Current round number
     * @param {number} SIZE - Number of wallets per round
     */
    updateTitle = async function(round, SIZE){
        process.title = `Krypto Luck is running | Wallets Generated: ${round * SIZE}`                
    }
}

export default { KryptoLuckOffline };