import { logger } from '../utils/logger.mjs';
import { readFileSync } from 'fs';

export class KryptoLuckOffline {
    status = 0;
    provider = undefined;

    constructor(filename) {
        this.status = 0
        this.filename = filename
    }

    loadRichWallet =  async function(){
        logger.verbose(` Reading data from disk...`);
  
        const filename = this.filename;
      
        let file = filename;
        logger.info(` ${file}`);
        const _dataArray = JSON.parse(readFileSync(file));
        logger.info(` ${_dataArray.length} wallet address loaded.`);
        this.status = 1
        return _dataArray;
    }

    updateTitle = async function(round, SIZE){
        process.title = `Krypto Luck is running | Wallet Generated: ${round * SIZE}) `                
    }
}

export default { KryptoLuckOffline };