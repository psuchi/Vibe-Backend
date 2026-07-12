const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

// Optional auth middleware — attaches user if token present, but doesn't block guest requests
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  next();
};

// @route   POST /api/bookings
// @desc    Create new booking (works for guests too)
// @access  Public (optionally authenticated)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      reference,
      mood,
      city,
      tier,
      dates,
      guests,
      nights,
      stay,
      flight,
      attractions,
      total,
      itinerary
    } = req.body;

    if (!mood || !city) {
      return res.status(400).json({ message: 'Mood and city are required' });
    }

    const bookingRef = reference || 'VB-' + Math.random().toString(36).slice(2,6).toUpperCase();

    const booking = new Booking({
      user: req.user ? req.user._id : null,
      reference: bookingRef,
      mood,
      city,
      tier,
      dates,
      guests,
      nights,
      stay,
      flight,
      attractions,
      total,
      itinerary,
      status: 'confirmed'
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bookings
// @desc    Get logged in user bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.user && booking.user.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/bookings/:id/itinerary
// @desc    Update booking itinerary
// @access  Private
router.put('/:id/itinerary', protect, async (req, res) => {
  try {
    const { itinerary } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.user && booking.user.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    booking.itinerary = itinerary;
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
