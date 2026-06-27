const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5001, () =>
      console.log(`SpendTrack API running on port ${process.env.PORT || 5001}`)
    );
  })
  .catch(err => console.error('DB error:', err));
