const express = require('express');

const bscForwarding = require('../controller/bscForwarding')
const maticForwarding = require('../controller/maticForwarding')

const router = express.Router();


router.post('/bsc/forwader', bscForwarding);
router.post('/matic/forwader', maticForwarding);

module.exports = router;