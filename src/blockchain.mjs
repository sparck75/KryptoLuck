import { ethers } from 'ethers';
import { Provider } from 'ethcall';
import { logger } from '../utils/logger.mjs';

export class KryptoLuck {

    status = 0;
    provider = undefined;

    constructor(rpc) {
        this.status = 0
        this.provider = rpc
        this.ethcallProvider = undefined
    }

    loadProvider =  async function(){

        this.ethcallProvider = new Provider();
        logger.info(`Krypto luck is using provider: ${this.provider}`)
        const provider = new ethers.providers.JsonRpcProvider(this.provider);

        await this.ethcallProvider.init(provider);

        this.status = 1;
    }

    validateOnChain = async function(_walletlist) {

        let startBlock = 0
        let endBlock = _walletlist.length
        const newWalletBalance = new Array()
        const newWalletAddress = new Array()
        const newWalletKey = new Array()
        const callarray = new Array()
        //console.log(endBlock)

        for (let i = startBlock; i < endBlock; i++) {

            const _target = _walletlist[i].address;
            newWalletBalance[i] = this.ethcallProvider.getEthBalance(_target);
            newWalletAddress[i] = _walletlist[i].address;
            newWalletKey[i] = _walletlist[i].privkey;
            callarray.push(newWalletBalance[i]);
        }

        // should try catch here
        try {
            const data = await this.ethcallProvider.tryAll(callarray);

            let resultLength = data.length;
            logger.debug(`Number of wallet in result: ${resultLength}`);
            if (resultLength != callarray.length) {
                logger.error("Error in the length of return data");
            }
    
            let balance = 0;
            let _balance = undefined;
            const _minimum = 0
    
            for (let j = 0; j < resultLength; j++) {
                balance = ethers.utils.formatEther(data[j]);
                _balance = ethers.BigNumber.from(data[j]);
    
                if (_balance.gt(_minimum)) {
                    logger.info(`${newWalletAddress[j]} : ${newWalletKey[j]}  balance: ${balance}`);
                }
            }
    
            

        } catch (error) {
            logger.error(`Error with multicall: ${error.reason}`)            
        }


    }

    updateTitle = async function(round, SIZE){
        process.title = `Krypto Luck is running | Wallet Generated: ${round * SIZE}) `                
    }

}

export default { KryptoLuck };