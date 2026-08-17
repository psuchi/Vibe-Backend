const express = require('express');
const axios = require('axios');
const router = express.Router();
const mockData = require('../utils/mockData');

function getExperienceFallback(city) {
  const cityMock = mockData[city];
  if (cityMock && cityMock.experiences && cityMock.experiences.data && cityMock.experiences.data.length > 0) {
    return cityMock.experiences;
  }
  return {
    data: [
      {
        location_id: 'mock-exp-default',
        name: (city || 'Destination') + ' Curated Tour',
        description: 'A handpicked experience that captures the essence of this destination.',
        price: 2500,
        photo: { images: { original: { url: null } } },
        rating: '4.8'
      }
    ]
  };
}

router.get('/', async (req, res) => {
  const { city, mood } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST_HOTELS = process.env.RAPIDAPI_HOST_HOTELS;

  // If no API credentials, immediately return destination-specific fallback
  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST_HOTELS) {
    return res.json(getExperienceFallback(city));
  }

  try {
    // Step 1: Dynamically resolve the geoId for the city using location search
    const searchRes = await axios.get(`https://${RAPIDAPI_HOST_HOTELS}/locations/search`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST_HOTELS
      },
      params: { query: city, lang: 'en_US', units: 'km', currency: 'USD' },
      timeout: 8000
    });

    const locations = searchRes.data?.data?.Typeahead_Search?.results;
    if (!locations || locations.length === 0) {
      console.warn('No location result for city:', city, '— using fallback');
      return res.json(getExperienceFallback(city));
    }

    // Prefer a GEOSTORE type (city-level), fallback to first result
    const loc = locations.find(l => l.result_type === 'GEOSTORE') || locations[0];
    const geoId = loc?.locationId;
    if (!geoId) {
      return res.json(getExperienceFallback(city));
    }

    // Step 2: Fetch attractions for the resolved geoId
    const attractionsRes = await axios.get(`https://${RAPIDAPI_HOST_HOTELS}/attractions/search`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST_HOTELS
      },
      params: { geoId: String(geoId) },
      timeout: 8000
    });

    const attractions = attractionsRes.data?.data?.Attractions_Products_Search?.results;
    if (!attractions || attractions.length === 0) {
      console.warn('No attractions returned for geoId:', geoId, '— using fallback');
      return res.json(getExperienceFallback(city));
    }

    res.json(attractionsRes.data);

  } catch (error) {
    console.error('Experiences API error:', error.message);
    res.json(getExperienceFallback(city));
  }
});

module.exports = router;

