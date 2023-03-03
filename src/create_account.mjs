import { ethers } from "ethers";

const create_account = function(count) {
    const wallet = new Array();

    for (let i = 0 ; i < count ; i++){
        const { address, privateKey } = ethers.Wallet.createRandom();
        wallet.push({address: address, key: privateKey})
        }

    //console.log(wallet)
    return wallet

}

export {create_account}
