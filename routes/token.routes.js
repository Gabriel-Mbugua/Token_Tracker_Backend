const express = require('express');

const { fetchTokensController } = require('../controllers/token.controller');

const router = express.Router();

router.get('/', fetchTokensController);

module.exports = router;
