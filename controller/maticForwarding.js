const utils = require('../utils/wallet');
const {prisma} = require('../connection')


async function forwardPayments(req, res) {    
    try {
        const { amount, recpient, currency } = req.body;
        const userAccount = await prisma.userWallet.findFirst({
            where: {
                publickey: recpient,
            },
        })
          if(!userAccount){
            return res.status(400).send("No wallet found!");
          }



        const user_address = userAccount.publicKey;

        if (!utils.isValidEthereumAddress(user_address)) return res.status(401).send("invalid recipient address");


        const transaction = await prisma.Trnasections.create({
            data: {
                userId: userAccount.id,
                amount,
                recpient,
                currency: currency.toUpperCase(),
                status: 'PENDING'
              },
        })

        if (!transaction) return res.status(401).send("Error in creating trnasection");


        return res.status(200).send({Status:"Success", transaction})
      
    } catch (e) {
        console.log(e)
        res.status(500).send(e.message);
    }

}



module.exports = forwardPayments;