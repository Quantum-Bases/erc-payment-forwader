const { prisma } = require("../connection");

async function waitTx(req, res) {
  const txs = await prisma.trnasections.findMany({
    where: {
      status: "pending",
      NOT: {
        txHash: null,
      },
    },
  });
  if (!txs) {
    console.log("No trnasection found for waitForTx !");
    return;
  }

  const listenerPromises = txs.map(async (tx) => {
    try {
    } catch (e) {
      console.log("Error in bscCron : ", e);
    }
  });

  await Promise.all(listenerPromises);

  console.log("BSC event subscribed!");
}

module.exports = waitTx;
