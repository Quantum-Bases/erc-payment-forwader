const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), process.env.NODE_ENV || '.env') });

const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require("body-parser");
const morgan = require("morgan");

const log = require('./utils/log');

const { newWeb3ConnectionBsc, newWeb3ConnectionMatic } = require('./connection');

const maticCron = require("./services/maticCron")
const bscCron = require("./services/bscCron")


const app = express();

app.use(cors());
app.use(bodyParser.json());

const router = require('./routes/forwader');

app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms'
    ].join(' ')
}));


newWeb3ConnectionBsc(process.env.RPC_URI_BSC).then(() => {
    log('Connected to BSC WEB3 Blockchain!', 'green');
}).catch(e => {
    log(`Error connection to BSC WEB3  blockchain: ${e.message}`, 'red');
});

newWeb3ConnectionMatic(process.env.RPC_URI_MATIC).then(() => {
    log('Connected to MATIC WEB3 Blockchain!', 'green');
}).catch(e => {
    log(`Error connection to MATIC WEB3  blockchain: ${e.message}`, 'red');
});

setInterval(maticCron, 6500);
setInterval(bscCron, 9600);

app.use('/v1/wallet', router);

const PORT = process.env.PORT;

const httpServer = http.createServer(app);

httpServer.listen(PORT || 4004, () => {
    log(`Wallet service is listening on port ${PORT}`, 'green');
});