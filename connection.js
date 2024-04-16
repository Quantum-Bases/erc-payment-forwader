const Web3 = require("web3");
const { PrismaClient } =  require("@prisma/client");

const web3 = new Web3();
const prisma = new PrismaClient()


// const newWeb3ConnectionBsc = async (WS_URI) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             web3.setProvider(
//                 new web3.providers.HttpsProvider(
//                     WS_URI
//                 )
//             );
//             global.web3Bsc = web3;
//             resolve();

//         } catch (e) {
//             console.log("Connection Failed !")
//         }
//     })
// };
// const newWeb3ConnectionBsc = async (WS_URI) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             web3.setProvider(
//                 new web3.providers.HttpsProvider(
//                     WS_URI
//                 )
//             );
//             global.web3Bsc = web3;
//             resolve();

//         } catch (e) {
//             console.log("Connection Failed !")
//         }
//     })
// };
// const getWeb3ConnectionBsc = () => global.web3Bsc;


const newWeb3ConnectionMatic = async (WS_URI) => {
    return new Promise(async (resolve, reject) => {
        try {
            web3.setProvider(
                new web3.providers.HttpProvider(
                    WS_URI
                )
            );
            global.web3Matic = web3;
            resolve();

        } catch (e) {
            console.log("Connection Failed !", e)
        }
    })
};

const getWeb3ConnectionMatic = () => global.web3;

module.exports = {
    // newWeb3ConnectionBsc,
    newWeb3ConnectionMatic,
    getWeb3ConnectionMatic,
    // getWeb3ConnectionBsc,
    prisma
}