const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  mood: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  tier: String,
  dates: String,
  guests: Number,
  nights: Number,
  stay: String,
  flight: {
    al: String,
    price: Number
  },
  attractions: [String],
  total: Number,
  itinerary: [{
    day: String,
    title: String,
    loc: String,
    acts: [{
      t: String,
      n: String,
      d: String
    }]
  }],
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
