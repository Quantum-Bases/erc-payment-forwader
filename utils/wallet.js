const config = require('../config')

const getEtherBalance = async (address, network) => {
    try {

        const balance = await network.eth.getBalance(address);
        return balance;

    } catch (e) {
        // console.error('invalid ethereum address', e.message)
        return 0;
    }
}


const getUsdtBalanceBsc = async (address) => {
    try {

        const instance = await new global.web3Bsc.eth.Contract(config.usdtAbi, config.USDT_TOKEN_ADDRESS.bsc);
        let balance = await instance.methods.balanceOf(address).call();
        balance = balance * 10 ** 18;
        return balance;

    } catch (e) {
        return 0;
    }
}

const getUsdtBalanceMatic = async (address) => {
    try {

        const instance = await new global.web3Matic.eth.Contract(config.usdtAbi, config.USDT_TOKEN_ADDRESS.polygon);
        let balance = await instance.methods.balanceOf(address).call();
        balance = balance * 10 ** 6;
        return balance;

    } catch (e) {
        return 0;
    }
}

const getEstimatedGas = async (transactionObject, network) => {
    try {

        const estimatedGas = await network.eth.estimateGas(transactionObject);
        return estimatedGas;

    } catch (e) {
        return 0;
    }
}

const getNounce = async (address, network) => {
    try {

        const count = await network.eth.getTransactionCount(address);
        return count;

    } catch (e) {
        return 0;
    }
}

const isValidEthereumAddress = (address) => {
    try {
        global.web3Bsc.utils.toChecksumAddress(address)
        return true;

    } catch (e) {
        return false;
    }
}

const privateKeyToAddress = async (privateKey) => {
    try {
        const address = await global.web3Bsc.eth.accounts.privateKeyToAccount(privateKey)
        return address;

    } catch (e) {
        return e.message;
    }
}

const pushTransaction = async (transactionObject, privateKey, network) => {
    try {
        const txnHash = await new Promise(async (resolve, reject) => {
            network.eth.accounts.signTransaction(transactionObject, privateKey).then(signedTx => {
                network.eth.sendSignedTransaction(signedTx.rawTransaction, async function (err, hash) {
                    if (!err) {
                        const reciept = await waitForTx(hash, network);
                        resolve(reciept)
                    } else {
                        return `Bad Request ${err.message}`
                    }
                });
            });
        })
        return txnHash;
    } catch (e) { return e.message }
}

async function waitForTx(tx_hash, network) {
    var result = null;

    // This is not really efficient but nodejs cannot pause the running process
    while (result === null) {
        result = await network.eth.getTransactionReceipt(tx_hash);
    }
    return result
}

module.exports = {
    isValidEthereumAddress,
    getEtherBalance,
    getUsdtBalanceBsc,
    getUsdtBalanceMatic,
    getEstimatedGas,
    pushTransaction,
    getNounce,
    privateKeyToAddress
}
