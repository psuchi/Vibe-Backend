const express = require('express');
const router = express.Router();
const axios = require('axios');

// Realistic mock weather per city when no real API key is set
const CITY_MOCK_WEATHER = {
  'Coorg': { temp: 22, desc: 'cool and misty', icon: '09d' },
  'Rishikesh': { temp: 19, desc: 'crisp mountain air', icon: '01d' },
  'Phuket': { temp: 30, desc: 'warm and sunny', icon: '01d' },
  'Spiti Valley': { temp: 8, desc: 'high-altitude dry', icon: '02d' },
  'Zanskar': { temp: 10, desc: 'clear mountain sky', icon: '01d' },
  'Chamonix': { temp: 6, desc: 'alpine crisp', icon: '13d' },
  'Varanasi': { temp: 25, desc: 'warm riverside', icon: '01d' },
  'Hampi': { temp: 27, desc: 'dry and sunny', icon: '01d' },
  'Kyoto': { temp: 14, desc: 'mild and clear', icon: '02d' },
  'Milan': { temp: 18, desc: 'partly cloudy', icon: '02d' },
  'Singapore': { temp: 31, desc: 'tropical humid', icon: '04d' },
  'Copenhagen': { temp: 11, desc: 'cool coastal breeze', icon: '03d' },
  'Jaipur': { temp: 26, desc: 'warm and dry', icon: '01d' },
  'Istanbul': { temp: 20, desc: 'Mediterranean mild', icon: '01d' },
  'Oaxaca': { temp: 23, desc: 'highland mild', icon: '02d' },
};

// @route   GET /api/weather
// @desc    Get weather for a city via OpenWeatherMap
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ message: 'City is required' });
    }

    const apiKey = process.env.OPENWEATHER_KEY;
    const isKeyValid = apiKey && apiKey !== 'your_openweather_api_key' && apiKey.length > 10;

    if (!isKeyValid) {
      // Return curated mock data for the city
      const mock = CITY_MOCK_WEATHER[city] || { temp: 22, desc: 'pleasant weather', icon: '01d' };
      return res.json(mock);
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
    );

    res.json({
      temp: Math.round(response.data.main.temp),
      desc: response.data.weather[0].description,
      icon: response.data.weather[0].icon
    });
  } catch (error) {
    console.error('Weather API Error:', error.message);
    // Fallback to mock on error
    const mock = CITY_MOCK_WEATHER[req.query.city] || { temp: 22, desc: 'pleasant weather', icon: '01d' };
    res.json(mock);
  }
});

module.exports = router;

