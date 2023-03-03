import { KryptoLuck } from './src/blockchain.mjs';
import { create_account } from './src/create_account.mjs';
import { logger } from './utils/logger.mjs';
import * as dotenv from 'dotenv'

const result = dotenv.config();
if (result.error) {
  throw result.error;
}

    // Handle CTRL-C to exit
process.on('SIGINT', function() {
    // something went wrong
    console.log(`\n CTRL-C received... Krypto Luck will now exit.`)
    process.exit()
    })

process.title = `Krypto luck is initializing... ` 
logger.info("Krypto luck is initializing...")

const RPC = process.env.RPC + process.env.INFURA_KEY

const luck = new KryptoLuck(RPC)
await luck.loadProvider()

logger.info("Krypto luck is running...")

const ROUND_SIZE = 1000
let round = 1

while(true){
    const list = create_account(ROUND_SIZE)   
    await luck.validateOnChain(list)    
    luck.updateTitle(round, ROUND_SIZE)
    round++;
}
