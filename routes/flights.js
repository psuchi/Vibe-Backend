const express = require('express');
const axios = require('axios');
const router = express.Router();

// Simple in-memory cache for airport resolution
const airportCache = {};

async function searchAirport(query) {
  if (!query) return null;
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST_FLIGHTS = process.env.RAPIDAPI_HOST_FLIGHTS;
  const normalizedQuery = query.toLowerCase().trim();
  
  if (airportCache[normalizedQuery]) {
    return airportCache[normalizedQuery];
  }

  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST_FLIGHTS}/api/v1/flights/searchAirport`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST_FLIGHTS
      },
      params: { query: query }
    });
    
    const data = response.data?.data;
    if (data && data.length > 0) {
      const bestMatch = data[0]; 
      const result = {
        skyId: bestMatch.skyId,
        entityId: bestMatch.entityId
      };
      airportCache[normalizedQuery] = result;
      return result;
    }
  } catch (err) {
    console.error('Error resolving airport:', err.message);
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const { origin, destination, date, adults } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST_FLIGHTS = process.env.RAPIDAPI_HOST_FLIGHTS;

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14); // 2 weeks from now
    const searchDate = date || defaultDate.toISOString().split('T')[0];
    const searchAdults = adults || 1;

    const [originData, destData] = await Promise.all([
      searchAirport(origin),
      searchAirport(destination)
    ]);

    if (!originData || !destData) {
      return res.status(404).json({ error: 'Could not resolve origin or destination airport' });
    }

    const flightsResponse = await axios.get(`https://${RAPIDAPI_HOST_FLIGHTS}/api/v1/flights/searchFlights`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST_FLIGHTS
      },
      params: {
        originSkyId: originData.skyId,
        destinationSkyId: destData.skyId,
        originEntityId: originData.entityId,
        destinationEntityId: destData.entityId,
        date: searchDate,
        adults: searchAdults,
        currency: 'INR'
      }
    });

    res.json({
        skyId: destData.skyId, // Include skyId for frontend use
        data: flightsResponse.data
    });

  } catch (error) {
    console.error('Flights API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch flights' });
  }
});

module.exports = router;
