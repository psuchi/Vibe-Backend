const express = require('express');
const router = express.Router();
const axios = require('axios');
const mockData = require('../utils/mockData');

// @route   GET /api/weather
// @desc    Get weather for a city via OpenWeatherMap
// @access  Public
router.get('/', async (req, res) => {
  const { city } = req.query;
  const fallbackMock = (mockData[city] && mockData[city].weather) || { temp: 22, desc: 'pleasant weather', icon: '01d' };

  try {
    if (!city) {
      return res.status(400).json({ message: 'City is required' });
    }

    const apiKey = process.env.OPENWEATHER_KEY;
    const isKeyValid = apiKey && apiKey !== 'your_openweather_api_key' && apiKey.length > 10;

    if (!isKeyValid) {
      return res.json(fallbackMock);
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
    res.json(fallbackMock);
  }
});

module.exports = router;

