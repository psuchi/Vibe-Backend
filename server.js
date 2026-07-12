require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const weatherRoutes = require('./routes/weather');
const chatRoutes = require('./routes/chat');
const flightsRoutes = require('./routes/flights');
const hotelsRoutes = require('./routes/hotels').router;
const experiencesRoutes = require('./routes/experiences');

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/flights', flightsRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/experiences', experiencesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn('⚠️ MONGO_URI not provided. Running in memory/mock mode for now.');
  app.listen(PORT, () => console.log(`Server running on port ${PORT} (No DB)`));
} else {
  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 })
    .then(() => {
      console.log('✅ Connected to MongoDB');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.warn('⚠️ Starting server without database connection. Some features will be unavailable.');
      app.listen(PORT, () => console.log(`Server running on port ${PORT} (No DB)`));
    });
}
