require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { initDB } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/health',         require('./routes/health'));
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/orders',     require('./middlewares/auth'), require('./routes/orders'));
app.use('/api/my',         require('./middlewares/auth'), require('./routes/my'));
app.use('/api/admin',      require('./middlewares/auth'), require('./middlewares/admin'), require('./routes/admin'));

const PORT = parseInt(process.env.PORT || '3002', 10);

const start = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('[STARTUP ERROR]', err);
    process.exit(1);
  }
};

start();
