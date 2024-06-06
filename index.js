const express = require('express');
const tokenRoutes = require('./routes/tokenRoutes')
require('dotenv').config();

const port = 3000;

const app = express();

app.use(express.json());

app.use('/api/tokens', tokenRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));