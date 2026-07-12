const express = require('express');
const axios = require('axios');
const router = express.Router();
const { resolveGeoId } = require('./hotels');

router.get('/', async (req, res) => {
  try {
    const { city, mood } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST_HOTELS = process.env.RAPIDAPI_HOST_HOTELS;

    const geoId = await resolveGeoId(city);
    if (!geoId) {
      return res.status(404).json({ error: 'Could not resolve city to geoId' });
    }

    const experiencesResponse = await axios.get(`https://${RAPIDAPI_HOST_HOTELS}/attractions/search`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST_HOTELS
      },
      params: { geoId }
    });

    // Frontend will handle mood mapping if needed, or we just pass the attractions.
    res.json(experiencesResponse.data);

  } catch (error) {
    console.error('Experiences API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

module.exports = router;
