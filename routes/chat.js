const express = require('express');
const router = express.Router();
const axios = require('axios');

// @route   POST /api/chat
// @desc    Chat with VEE — uses Groq
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const prompt = `You are VEE, a sophisticated, calm, and insightful travel assistant for an emotion-first travel platform called Vibe. 
The user is currently on the "${context || 'home'}" page.
User message: ${message}
Keep your response concise (2-3 sentences), helpful, and in a slightly poetic but practical tone. Do not use markdown symbols like **, *, or #.`;

    const groqKey = process.env.GROQ_API_KEY;

    // Use Groq (free, fast, uses Llama)
    if (groqKey && groqKey.startsWith('gsk_')) {
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.8
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const reply = groqRes.data.choices[0].message.content;
      return res.json({ reply });
    }

    // No valid AI key — return friendly mock
    return res.json({
      reply: `Hello, I'm VEE. Your travel intuition is spot on. To unlock live AI responses, add a valid Groq key (starting with gsk_) to backend/.env.`
    });

  } catch (error) {
    console.error('VEE Chat Error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to fetch AI response',
      detail: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
