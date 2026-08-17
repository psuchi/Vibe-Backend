const express = require('express');
const router = express.Router();
const axios = require('axios');

// Context-aware VEE fallback replies when Groq is unavailable
const VEE_FALLBACK = {
  home: "Every great journey begins with a feeling. Let your mood guide you — explore the vibes and discover where your heart wants to go.",
  destination: "This destination holds something rare — a quiet magic that only reveals itself once you arrive. Trust the feeling that brought you here.",
  bookings: "Your journey is taking shape beautifully. Each selection has been curated with your mood in mind, chosen to deepen the experience.",
  itinerary: "A well-paced journey is its own kind of luxury. Take your time with each day — the best moments are often the unplanned ones.",
  vibes: "Each vibe is a doorway to a different version of yourself. Whether you crave stillness, adventure, or wonder, your perfect journey is closer than you think.",
  confirmation: "Your adventure is officially on the horizon. Pack light, stay curious, and let the destination surprise you — that is the Vibe way."
};

// @route   POST /api/chat
// @desc    Chat with VEE — uses Groq
// @access  Public
router.post('/', async (req, res) => {
  const { message, context } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const contextKey = context || 'home';
  const fallbackReply = VEE_FALLBACK[contextKey] || VEE_FALLBACK.home;

  try {
    const prompt = `You are VEE, a sophisticated, calm, and insightful travel assistant for an emotion-first travel platform called Vibe. 
The user is currently on the "${contextKey}" page.
User message: ${message}
Keep your response concise (3-4 sentences), helpful, and in a slightly poetic but practical tone. Do not use markdown symbols like **, *, or #.`;

    const groqKey = process.env.GROQ_API_KEY;

    // Use Groq (free, fast, uses Llama)
    if (groqKey && groqKey.startsWith('gsk_')) {
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.8
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      const reply = groqRes.data.choices[0].message.content;
      return res.json({ reply });
    }

    // No valid AI key — return friendly context-aware reply
    return res.json({ reply: fallbackReply });

  } catch (error) {
    console.error('VEE Chat Error:', error.response?.status, error.message);
    // Never expose API errors to the user — return a graceful VEE reply
    res.json({ reply: fallbackReply });
  }
});

module.exports = router;

