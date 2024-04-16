const { prisma } = require("../connection");
const utils = require("../utils/wallet");
const config = require("../config");

async function maticCron() {
  const txs = await prisma.trnasections.findMany({
    where: {
      status: "PENDING",
      currency: "MATIC",
      txHash: null,

    },
  });
  if (!txs) {
    console.log("No pending trnasection found!");
    return;
  }

  const listenerPromises = txs.map(async (tx) => {
    try {
      const admin_private_key = process.env.ADMIN_WALLET_KEY;
      const usdt_contract_address = config.USDT_TOKEN_ADDRESS.polygon;
      // const user_private_key = process.env.USER_WALLET_KEY // THIS WILL BE FETCHING FROM DB

      const userAccount = await prisma.userWallet.findFirst({
        where: {
          id: tx.userId,
        },
      });

      if (!userAccount) {
        console.log(`no user found against this trnasection id ${tx.id}`);
        return;
      }

      const user_private_key = userAccount.privateKey; // THIS WILL BE FETCHING FROM DB

      const admin_address = await utils.privateKeyToAddress(admin_private_key);

      const maticBalanceOfUser = await utils.getEtherBalance(
        userAccount.publickey,
        global.web3Matic
      );

      const usdtBalanceOfUser = await utils.getUsdtBalanceMatic(
        userAccount.publickey
      );
      const maticBalanceOfAdmin = await utils.getEtherBalance(
        admin_address.address,
        global.web3Matic
      );

      const adminWalletNonce = await utils.getNounce(
        admin_address.address,
        global.web3Matic
      );
      const userWalletNonce = await utils.getNounce(
        userAccount.publickey,
        global.web3Matic
      );

      const gasPrice = await global.web3Matic.eth.getGasPrice();
      const gasLimit = 30000;

      if (currency.toUpperCase() == "MATIC") {
        userToAdminMaticTransfer(
          tx.id,
          userAccount.publickey,
          admin_address.address,
          tx.amount,
          userWalletNonce,
          gasPrice,
          gasLimit,
          user_private_key
        );
      } else if (currency.toUpperCase() == "USDT") {
        const txReciept = await adminToUserMicroMaticTransfer(
          admin_address.address,
          userAccount.publickey,
          adminWalletNonce,
          gasLimit,
          gasPrice,
          admin_private_key,
          maticBalanceOfAdmin,
          maticBalanceOfUser
        );

        if (txReciept.status === true) {
          userToAdminUsdtTransfer(
            userAccount.publickey,
            admin_address.address,
            userWalletNonce,
            gasPrice,
            user_private_key,
            usdtBalanceOfUser,
            usdt_contract_address
          );
        } else console.log("admin to user eth microdeposit not successfull");
      } else {
        console.log("invalid currency");
      }
    } catch (e) {
      console.log("Error in maticCron : ", e);
    }
  });

  await Promise.all(listenerPromises);

  console.log("MATIC event subscribed!");
}

async function adminToUserMicroMaticTransfer(
  adminAddress,
  userAddress,
  adminWalletNonce,
  gasLimit,
  gasPrice,
  privateKey,
  maticBalanceOfAdmin,
  maticBalanceOfUser
) {
  const txnHash = await new Promise(async (resolve, reject) => {
    const gasValue = gasLimit * (gasPrice * 1.5);
    if (maticBalanceOfUser <= gasValue)
      if (maticBalanceOfAdmin > gasValue) {
        const txObject = await transactionObject(
          adminWalletNonce,
          gasPrice,
          gasLimit,
          adminAddress,
          "0x",
          gasValue,
          userAddress
        );
        const minedTxStatus = await utils.pushTransaction(
          txObject,
          privateKey,
          global.web3Matic
        );

        console.log(
          "Admin micro ether has been transfer to user wallet: ",
          minedTxStatus
        );
        resolve(minedTxStatus);
      } else
        console.log("very low value to make micro deposit in admin wallet");
    else resolve({ status: true });
  });
  return txnHash;
}

async function userToAdminUsdtTransfer(
  userAddress,
  adminAddress,
  userWalletNonce,
  gasPrice,
  privateKey,
  usdtBalanceOfUser,
  usdtContractAddress
) {
  const contract = await new global.web3Matic.eth.Contract(
    config.usdtAbi,
    usdtContractAddress
  );

  const tx_builder = await contract.methods.transfer(
    adminAddress,
    usdtBalanceOfUser
  );

  const encoded_tx = tx_builder.encodeABI();

  const estimatedGas = await utils.getEstimatedGas(
    {
      from: userAddress,
      to: adminAddress,
      data: encoded_tx,
    },
    global.web3Matic
  );
  if (usdtBalanceOfUser > 0) {
    const txObject = await transactionObject(
      userWalletNonce,
      gasPrice * 1.5,
      estimatedGas * 4,
      userAddress,
      encoded_tx,
      0,
      usdtContractAddress
    );
    const minedTxStatus = await utils.pushTransaction(
      txObject,
      privateKey,
      global.web3Matic
    );

    console.log(
      "Users usdt has been transfer to admin wallet: ",
      minedTxStatus
    );
  } else return console.log("very low value to make micro deposit");
}

async function userToAdminMaticTransfer(
  txId,
  userAddress,
  adminAddress,
  amount,
  userWalletNonce,
  gasPrice,
  gasLimit,
  privateKey
) {
  const estimatedGas = await utils.getEstimatedGas(
    {
      from: userAddress,
      to: adminAddress,
      value: amount,
    },
    global.web3Matic
  );

  const gasValue = estimatedGas * gasPrice;

  const amountToSend = parseInt(amount) - parseInt(gasValue);

  if (amountToSend > 0) {
    const txObject = await transactionObject(
      userWalletNonce,
      gasPrice,
      gasLimit,
      userAddress,
      "0x",
      amountToSend,
      adminAddress
    );
    const minedTxStatus = await utils.pushTransaction(
      txObject,
      privateKey,
      global.web3Matic
    );

    await prisma.trnasections.update({
      where: {
        id: txId,
      },
      data: {
        txHash: minedTxStatus,
      },
    });

    console.log(
      "User ether has been transfer to admin wallet: ",
      minedTxStatus
    );
  } else return console.log("very low value to make micro deposit");
}

async function transactionObject(
  count,
  gasPrice,
  estimatedGas,
  fromAddress,
  encoded_tx,
  value,
  toAddress
) {
  let transaction = {
    nonce: global.web3Matic.utils.toHex(count),
    from: fromAddress,
    gasPrice: global.web3Matic.utils.toHex(gasPrice),
    gasLimit: global.web3Matic.utils.toHex(estimatedGas),
    to: toAddress,
    data: encoded_tx,
    value: value,
    chainId: 0x89,
  };
  return transaction;
}

module.exports = maticCron;
