const express = require('express');
const axios = require('axios');
const router = express.Router();
const mockData = require('../utils/mockData');

function getHotelFallback(city) {
  const cityMock = mockData[city];
  if (cityMock && cityMock.hotels && cityMock.hotels.length > 0) {
    return cityMock.hotels;
  }
  return [
    {
      id: 'mock-hotel-default',
      name: (city || 'Destination') + ' Grand Stay',
      address: city || 'City Centre',
      latitude: 0,
      longitude: 0,
      distance: 500,
      rate: '4.5',
      basePrice: 5000,
      amenities: 'WiFi · Pool · Breakfast',
      img: null
    }
  ];
}

router.get('/', async (req, res) => {
  const { city, hotelQuery } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
  if (!GEOAPIFY_API_KEY) {
    return res.json(getHotelFallback(city));
  }

  try {
    // 1. Geocode the requested city
    const geocodeResponse = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: { text: city, apiKey: GEOAPIFY_API_KEY },
      timeout: 8000
    });

    if (!geocodeResponse.data.features || geocodeResponse.data.features.length === 0) {
      return res.json(getHotelFallback(city));
    }

    const { lat, lon } = geocodeResponse.data.features[0].properties;

    // 2. Search nearby hotels
    const placesParams = {
      categories: 'accommodation.hotel',
      filter: `circle:${lon},${lat},20000`,
      bias: `proximity:${lon},${lat}`,
      limit: 10,
      apiKey: GEOAPIFY_API_KEY
    };
    if (hotelQuery) placesParams.name = hotelQuery;

    const placesResponse = await axios.get('https://api.geoapify.com/v2/places', {
      params: placesParams,
      timeout: 8000
    });

    if (!placesResponse.data.features || placesResponse.data.features.length === 0) {
      return res.json(getHotelFallback(city));
    }

    const hotels = placesResponse.data.features.map(feature => {
      const p = feature.properties;
      return {
        id: p.place_id,
        name: p.name || 'Unnamed Hotel',
        address: p.formatted,
        latitude: p.lat,
        longitude: p.lon,
        distance: p.distance
      };
    });

    res.json(hotels);

  } catch (error) {
    console.error('Hotels API error:', error.message);
    res.json(getHotelFallback(city));
  }
});

module.exports = router;

