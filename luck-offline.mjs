import { KryptoLuckOffline } from './src/offline.mjs';
import { ethers } from "ethers";
import { logger } from './utils/logger.mjs';
import { sleep } from './utils/sleep.mjs';
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

const luck = new KryptoLuckOffline('RichEtherAddress.json')
const RichList = await luck.loadRichWallet()

const SuccessList = []

for(let i = 0 ; i < RichList.length ; i++)
{
    SuccessList.push(RichList[i].address)
}

logger.info("Krypto luck is running...")

const ROUND_SIZE = 1000
let round = 1

while(true){
    //const list = create_account(ROUND_SIZE)
    for(let j = 0 ; j < ROUND_SIZE ; j++){
        const { address, privateKey } = ethers.Wallet.createRandom();
        if( SuccessList.indexOf(address) != -1 ){
            logger.info(`We got lucky!!! ${address} : ${privateKey} `);            
        }    
    }
    luck.updateTitle(round, ROUND_SIZE)
    round++;
    sleep(10)
}
