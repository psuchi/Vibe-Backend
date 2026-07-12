const express = require('express');
const axios = require('axios');
const router = express.Router();

const geoIdCache = {};

async function resolveGeoId(city) {
  if (!city) return null;
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST_HOTELS = process.env.RAPIDAPI_HOST_HOTELS;
  const normalized = city.toLowerCase().trim();
  
  if (geoIdCache[normalized]) {
    return geoIdCache[normalized];
  }

  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST_HOTELS}/auto-complete`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST_HOTELS
      },
      params: { query: city }
    });
    
    const data = response.data?.data;
    if (data && data.length > 0) {
      const geoId = data[0].geoId;
      if (geoId) {
        geoIdCache[normalized] = geoId;
        return geoId;
      }
    }
  } catch (err) {
    console.error('Error resolving GeoId:', err.message);
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST_HOTELS = process.env.RAPIDAPI_HOST_HOTELS;

    const geoId = await resolveGeoId(city);
    if (!geoId) {
      return res.status(404).json({ error: 'Could not resolve city to geoId' });
    }

    const today = new Date();
    today.setDate(today.getDate() + 14);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 4);

    const checkInDate = checkIn || today.toISOString().split('T')[0];
    const checkOutDate = checkOut || tomorrow.toISOString().split('T')[0];
    const searchGuests = guests || 2;

    const hotelsResponse = await axios.get(`https://${RAPIDAPI_HOST_HOTELS}/hotels/search`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST_HOTELS
      },
      params: {
        geoId: geoId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: searchGuests
      }
    });

    res.json(hotelsResponse.data);

  } catch (error) {
    console.error('Hotels API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

module.exports = { router, resolveGeoId };
