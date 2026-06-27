const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`SpendTrack API running on port ${PORT}`));
