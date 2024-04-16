const { prisma } = require("../connection");
const utils = require("../utils/wallet");
const config = require("../config");
const Web3 = require("web3");
var url = "https://data-seed-prebsc-1-s1.bnbchain.org:8545";

var web3 = new Web3(url);

global.web3Bsc = web3;

async function bscCron() {
  const txs = await prisma.trnasections.findMany({
    where: {
      status: "PENDING",
      currency: "BSC",
      txHash: null,
    },
  });
  // console.log(txs);
  // return
  if (!txs) {
    console.log("No pending trnasection found!");
    return;
  }

  const listenerPromises = txs.map(async (tx) => {
    try {
      const admin_private_key = process.env.ADMIN_BSC_WALLET_KEY;
      const usdt_contract_address = config.USDT_TOKEN_ADDRESS.bsc;
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

      const usdtBalanceOfUser = await utils.getUsdtBalanceBsc(
        userAccount.publickey
      );
      const bscBalanceOfAdmin = await utils.getEtherBalance(
        admin_address.address,
        global.web3Bsc
      );
      const bscBalanceOfUser = await utils.getEtherBalance(
        userAccount.publickey,
        global.web3Bsc
      );

      const adminWalletNonce = await utils.getNounce(
        admin_address.address,
        global.web3Bsc
      );
      const userWalletNonce = await utils.getNounce(
        userAccount.publickey,
        global.web3Bsc
      );

      // console.log({
      //   usdtBalanceOfUser:usdtBalanceOfUser,
      //   bscBalanceOfAdmin:bscBalanceOfAdmin,
      //   bscBalanceOfUser:bscBalanceOfUser,
      //   adminWalletNonce:adminWalletNonce,
      //   userWalletNonce:userWalletNonce
      // });
      const gasPrice = await global.web3Bsc.eth.getGasPrice();
      // console.log(gasPrice);
      const gasLimit = 30000;

      if (tx.currency.toUpperCase() == "BSC") {
        userToAdminBscTransfer(
          tx.id,
          userAccount.publickey,
          admin_address.address,
          tx.amount,
          userWalletNonce,
          gasPrice,
          gasLimit,
          user_private_key
        );
      } else if (tx.currency.toUpperCase() == "USDT") {
        const txReciept = await adminToUserMicroBscTransfer(
          tx.id,
          admin_address.address,
          userAccount.publickey,
          adminWalletNonce,
          gasLimit,
          gasPrice,
          admin_private_key,
          bscBalanceOfAdmin,
          bscBalanceOfUser
        );

        if (txReciept.status === true) {
          userToAdminUsdtTransfer(
            tx.id,
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
      console.log("Error in bscCron : ", e);
    }
  });

  await Promise.all(listenerPromises);

  console.log("BSC event subscribed!");
}

async function adminToUserMicroBscTransfer(
  txId,
  adminAddress,
  userAddress,
  adminWalletNonce,
  gasLimit,
  gasPrice,
  privateKey,
  bscBalanceOfAdmin,
  bscBalanceOfUser
) {
  const txnHash = await new Promise(async (resolve, reject) => {
    const gasValue = gasLimit * (gasPrice * 1.5);
    if (bscBalanceOfUser <= gasValue)
      if (bscBalanceOfAdmin > gasValue) {
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
          global.web3Bsc
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
  txId,
  userAddress,
  adminAddress,
  userWalletNonce,
  gasPrice,
  privateKey,
  usdtBalanceOfUser,
  usdtContractAddress
) {
  const contract = await new global.web3Bsc.eth.Contract(
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
    global.web3Bsc
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
      global.web3Bsc
    );



    console.log(
      "Users usdt has been transfer to admin wallet: ",
      minedTxStatus
    );
  } else return console.log("very low value to make micro deposit");
}

async function userToAdminBscTransfer(
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
    global.web3Bsc
  );

  // const gasValue = estimatedGas * gasPrice;
  const gasValue = "21000" * gasPrice;

  const am = web3.utils.toWei(amount);
  // console.log(am);
  const amountToSend = parseInt(am) - parseInt(gasValue);

  // console.log(amountToSend);

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
      global.web3Bsc
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
    nonce: global.web3Bsc.utils.toHex(count),
    from: fromAddress,
    gasPrice: global.web3Bsc.utils.toHex(gasPrice),
    gasLimit: global.web3Bsc.utils.toHex(estimatedGas),
    to: toAddress,
    data: encoded_tx,
    value: value,
    chainId: 97,
  };

  console.log(transaction);
  return transaction;
}

module.exports = bscCron;
