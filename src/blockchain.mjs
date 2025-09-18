import { ethers } from 'ethers';
import { Provider } from 'ethcall';
import { logger } from '../utils/logger.mjs';

/**
 * KryptoLuck class for online blockchain wallet validation
 * Generates random wallets and checks their balance on the Ethereum blockchain
 */
export class KryptoLuck {

    status = 0;
    provider = undefined;

    /**
     * Creates an instance of KryptoLuck
     * @param {string} rpc - The RPC endpoint URL for blockchain connection
     */
    constructor(rpc) {
        this.status = 0
        this.provider = rpc
        this.ethcallProvider = undefined
    }

    /**
     * Initializes the provider connection for blockchain queries
     * Sets up ethcall provider for efficient batch requests
     * 
     * @async
     * @throws {Error} If provider initialization fails
     */
    loadProvider =  async function(){

        this.ethcallProvider = new Provider();
        logger.info(`Krypto luck is using provider: ${this.provider}`)
        const provider = new ethers.providers.JsonRpcProvider(this.provider);

        await this.ethcallProvider.init(provider);

        this.status = 1;
    }

    /**
     * Validates wallet balances on the blockchain using multicall for efficiency
     * Checks each wallet in the provided list and logs any with non-zero balance
     * 
     * @async
     * @param {Array<{address: string, privkey: string}>} _walletlist - Array of wallet objects to validate
     * @param {Function} onWalletChecked - Optional callback for each wallet checked
     * @throws {Error} If multicall request fails
     */
    validateOnChain = async function(_walletlist, onWalletChecked = null) {

        let startBlock = 0
        let endBlock = _walletlist.length
        const newWalletBalance = new Array()
        const newWalletAddress = new Array()
        const newWalletKey = new Array()
        const callarray = new Array()

        // Prepare multicall batch for all wallets
        for (let i = startBlock; i < endBlock; i++) {

            const _target = _walletlist[i].address;
            newWalletBalance[i] = this.ethcallProvider.getEthBalance(_target);
            newWalletAddress[i] = _walletlist[i].address;
            newWalletKey[i] = _walletlist[i].privkey;
            callarray.push(newWalletBalance[i]);
        }

        // Execute multicall and process results
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
    
            // Check each result for non-zero balance
            for (let j = 0; j < resultLength; j++) {
                balance = ethers.utils.formatEther(data[j]);
                _balance = ethers.BigNumber.from(data[j]);
    
                const wallet = {
                    address: newWalletAddress[j],
                    privateKey: newWalletKey[j]
                };

                const hasBalance = _balance.gt(_minimum);
                
                if (hasBalance) {
                    logger.info(`🎉 JACKPOT! ${newWalletAddress[j]} : ${newWalletKey[j]}  balance: ${balance} ETH`);
                }

                // Call the callback if provided (for storage or other processing)
                if (onWalletChecked) {
                    await onWalletChecked(wallet, {
                        balance: balance,
                        hasBalance: hasBalance,
                        checkedOnline: true
                    });
                }
            }

        } catch (error) {
            logger.error(`Error with multicall: ${error.reason}`)            
        }

    }

}

export default { KryptoLuck };