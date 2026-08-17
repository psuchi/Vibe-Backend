const express = require('express');
const axios = require('axios');
const router = express.Router();
const mockData = require('../utils/mockData');

// Simple in-memory cache for airport resolution
const airportCache = {};

function getFlightFallback(city) {
  const cityMock = mockData[city];
  
  if (cityMock && cityMock.flights) {
    let itineraries = cityMock.flights.data.itineraries;
    if (itineraries && itineraries.length < 6) {
      const base = itineraries[0];
      const basePrice = base.price.raw;
      
      const opt2 = JSON.parse(JSON.stringify(base));
      opt2.id = 'mock-flight-2';
      opt2.price.raw = Math.round(basePrice * 1.15);
      opt2.price.formatted = '₹' + opt2.price.raw.toLocaleString('en-IN');
      opt2.legs[0].departure = '10:30';
      opt2.legs[0].arrival = '13:00';
      opt2.legs[0].carriers.marketing[0].name = 'Air India';
      
      const opt3 = JSON.parse(JSON.stringify(base));
      opt3.id = 'mock-flight-3';
      opt3.price.raw = Math.round(basePrice * 0.85);
      opt3.price.formatted = '₹' + opt3.price.raw.toLocaleString('en-IN');
      opt3.legs[0].departure = '19:45';
      opt3.legs[0].arrival = '22:15';
      opt3.legs[0].carriers.marketing[0].name = 'Vistara';

      const opt4 = JSON.parse(JSON.stringify(base));
      opt4.id = 'mock-flight-4';
      opt4.price.raw = Math.round(basePrice * 0.95);
      opt4.price.formatted = '₹' + opt4.price.raw.toLocaleString('en-IN');
      opt4.legs[0].departure = '14:20';
      opt4.legs[0].arrival = '16:50';
      opt4.legs[0].carriers.marketing[0].name = 'SpiceJet';

      const opt5 = JSON.parse(JSON.stringify(base));
      opt5.id = 'mock-flight-5';
      opt5.price.raw = Math.round(basePrice * 1.05);
      opt5.price.formatted = '₹' + opt5.price.raw.toLocaleString('en-IN');
      opt5.legs[0].departure = '08:15';
      opt5.legs[0].arrival = '10:45';
      opt5.legs[0].carriers.marketing[0].name = 'IndiGo';

      const opt6 = JSON.parse(JSON.stringify(base));
      opt6.id = 'mock-flight-6';
      opt6.price.raw = Math.round(basePrice * 1.25);
      opt6.price.formatted = '₹' + opt6.price.raw.toLocaleString('en-IN');
      opt6.legs[0].departure = '22:30';
      opt6.legs[0].arrival = '01:00';
      opt6.legs[0].carriers.marketing[0].name = 'Akasa Air';

      cityMock.flights.data.itineraries = [base, opt2, opt3, opt4, opt5, opt6];
    }
    return cityMock.flights;
  }
  
  // Generic fallback
  const destCode = city ? city.substring(0, 3).toUpperCase() : 'DEL';
  return {
    skyId: destCode,
    data: {
      itineraries: [
        {
          id: 'mock-flight-1',
          price: { formatted: '₹5,100', raw: 5100 },
          legs: [{ origin: { displayCode: 'BLR' }, destination: { displayCode: destCode }, durationInMinutes: 145, stopCount: 0, departure: '06:15', arrival: '08:40', carriers: { marketing: [{ name: 'IndiGo' }] } }]
        },
        {
          id: 'mock-flight-2',
          price: { formatted: '₹6,400', raw: 6400 },
          legs: [{ origin: { displayCode: 'BLR' }, destination: { displayCode: destCode }, durationInMinutes: 145, stopCount: 0, departure: '11:30', arrival: '13:55', carriers: { marketing: [{ name: 'Air India' }] } }]
        },
        {
          id: 'mock-flight-3',
          price: { formatted: '₹4,800', raw: 4800 },
          legs: [{ origin: { displayCode: 'BLR' }, destination: { displayCode: destCode }, durationInMinutes: 145, stopCount: 0, departure: '20:15', arrival: '22:40', carriers: { marketing: [{ name: 'Vistara' }] } }]
        },
        {
          id: 'mock-flight-4',
          price: { formatted: '₹5,300', raw: 5300 },
          legs: [{ origin: { displayCode: 'BLR' }, destination: { displayCode: destCode }, durationInMinutes: 145, stopCount: 0, departure: '14:20', arrival: '16:45', carriers: { marketing: [{ name: 'SpiceJet' }] } }]
        },
        {
          id: 'mock-flight-5',
          price: { formatted: '₹5,800', raw: 5800 },
          legs: [{ origin: { displayCode: 'BLR' }, destination: { displayCode: destCode }, durationInMinutes: 145, stopCount: 0, departure: '08:15', arrival: '10:40', carriers: { marketing: [{ name: 'IndiGo' }] } }]
        },
        {
          id: 'mock-flight-6',
          price: { formatted: '₹6,900', raw: 6900 },
          legs: [{ origin: { displayCode: 'BLR' }, destination: { displayCode: destCode }, durationInMinutes: 145, stopCount: 0, departure: '22:30', arrival: '00:55', carriers: { marketing: [{ name: 'Akasa Air' }] } }]
        }
      ]
    }
  };
}

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
      params: { query: query },
      timeout: 8000
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
    console.error('Error resolving airport:', err.response?.status, err.message);
  }
  return null;
}

router.get('/', async (req, res) => {
  const { origin, destination, date, adults, originAirportQuery, destinationAirportQuery } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required' });
  }

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST_FLIGHTS = process.env.RAPIDAPI_HOST_FLIGHTS;

  // If no API credentials, return fallback immediately
  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST_FLIGHTS) {
    return res.json(getFlightFallback(destination));
  }

  try {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    const searchDate = date || defaultDate.toISOString().split('T')[0];
    const searchAdults = adults || 1;

    const [originData, destData] = await Promise.all([
      searchAirport(originAirportQuery || origin),
      searchAirport(destinationAirportQuery || destination)
    ]);

    if (!originData || !destData) {
      console.warn('Could not resolve airports — using fallback data');
      return res.json(getFlightFallback(destination));
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
      },
      timeout: 12000
    });

    const itineraries = flightsResponse.data?.data?.itineraries;
    if (!itineraries || itineraries.length === 0) {
      console.warn('Empty itineraries from API — using fallback data');
      return res.json(getFlightFallback(destination));
    }

    res.json({
      skyId: destData.skyId,
      data: flightsResponse.data
    });

  } catch (error) {
    console.error('Flights API error:', error.response?.status, error.message);
    res.json(getFlightFallback(destination));
  }
});

module.exports = router;
