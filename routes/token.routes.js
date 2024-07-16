const express = require('express');

const { fetchTokens } = require('../controllers/token.controller');

const router = express.Router();

router.get('/', fetchTokens);
// router.put('/:id', updateTokenPopularity);
// router.get('/new', fetchNewTokens); // Route to fetch new tokens

module.exports = router;
