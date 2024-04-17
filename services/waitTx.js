const { prisma } = require("../connection");
const {waitForTx} = require("../utils/wallet")

async function waitTx() {
  const txs = await prisma.trnasections.findMany({
    where: {
      status: "PENDING",
      NOT: {
        txHash: null,
      },
    },
  });
  console.log(txs);
  if (!txs) {
    console.log("No trnasection found for waitForTx !");
    return;
  }
  
  const listenerPromises = txs.map(async (tx) => {
    try {
      let network;
      if(tx.chain === 'BSC'){
        network = global.web3Bsc
      }else{
        network = global.web3Matic
      }
      const result = await waitForTx(tx.txHash, network);
      if(result != null){
        await prisma.trnasections.update({
          where: {
            id: tx.id,
          },
          data: {
            status: "COMPLETED",
          },
        });
      }
    } catch (e) {
      console.log("Error in bscCron : ", e);
    }
  });
 
  await Promise.all(listenerPromises);

  console.log("wait tx event subscribed!");
}

module.exports = waitTx;
