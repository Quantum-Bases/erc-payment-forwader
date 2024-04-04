const utils = require('../utils/wallet');
const config = require('../config');
const {prisma} = require('../connection')

async function forwardPayments(req, res) {
    try {
        const { amount, recpient, currency } = req.body;
        const userAccount = await prisma.user.findUnique({
            where: {
              publicKey: recpient,
            },
          })
          if(!userAccount){
            return res.status(400).send("No wallet found!");
          }

        const admin_private_key = process.env.ADMIN_WALLET_KEY;
        const usdt_contract_address = config.USDT_TOKEN_ADDRESS.bsc;
        // const user_private_key = process.env.USER_WALLET_KEY // THIS WILL BE FETCHING FROM DB
        const user_private_key = process.env.USER_WALLET_KEY // THIS WILL BE FETCHING FROM DB

        const admin_address = await utils.privateKeyToAddress(admin_private_key);
        // const user_address = await utils.privateKeyToAddress(user_private_key);
        const user_address = userAccount.publicKey;

        if (!utils.isValidEthereumAddress(user_address)) return res.status(401).send("invalid recipient address");

        const usdtBalanceOfUser = await utils.getUsdtBalanceBsc(user_address);
        const bscBalanceOfAdmin = await utils.getEtherBalance(admin_address.address, global.web3Bsc);
        const bscBalanceOfUser = await utils.getEtherBalance(user_address, global.web3Bsc);

        const adminWalletNonce = await utils.getNounce(admin_address.address, global.web3Bsc);
        const userWalletNonce = await utils.getNounce(user_address, global.web3Bsc);

        const gasPrice = await global.web3Bsc.eth.getGasPrice();
        const gasLimit = 30000;

        if (currency.toUpperCase() == 'BSC' ) {

            userToAdminBscTransfer(user_address.address, admin_address.address, amount, userWalletNonce, gasPrice, gasLimit, user_private_key);

        }  else if (currency.toUpperCase() == 'USDT' ) {
            const txReciept = await adminToUserMicroBscTransfer(admin_address.address, user_address.address, adminWalletNonce, gasLimit, gasPrice, admin_private_key, bscBalanceOfAdmin, bscBalanceOfUser)

            if (txReciept.status === true) {
                userToAdminUsdtTransfer(user_address.address, admin_address.address, userWalletNonce, gasPrice, user_private_key, usdtBalanceOfUser, usdt_contract_address)
            }
            else console.log('admin to user eth microdeposit not successfull')

        } else {
            return res.status(400).send("invalid currency");
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e.message);
    }

}



module.exports = forwardPayments;