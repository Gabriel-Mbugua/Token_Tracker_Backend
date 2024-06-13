const express = require('express');
const tokenRoutes = require('./routes/tokenRoutes');
const { db } = require('./database/db');
const { solListener } = require('./services/solana');
require('dotenv').config();

const PORT = process.env.PORT || 3000;


const app = express();

app.use(express.json());

app.use('/tokens', tokenRoutes);

solListener()


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));