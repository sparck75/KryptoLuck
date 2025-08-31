import { ethers } from "ethers";

/**
 * Creates a specified number of random Ethereum wallets
 * 
 * @param {number} count - The number of wallets to generate
 * @returns {Array<{address: string, privkey: string}>} Array of wallet objects with address and private key
 * 
 * @example
 * const wallets = create_account(1000);
 * console.log(wallets[0]); // { address: "0x...", privkey: "0x..." }
 */
const create_account = function(count) {
    const wallet = new Array();

    for (let i = 0 ; i < count ; i++){
        const { address, privateKey } = ethers.Wallet.createRandom();
        wallet.push({address: address, privkey: privateKey})
        }

    return wallet
}

export {create_account}
