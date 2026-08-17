const axios = require('axios');

(async () => {
  try {
    // Test registration
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'Password123!'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('🟢 Registration succeeded:', regRes.data);
    // Test Gemini chat
    const chatRes = await axios.post('http://localhost:5000/api/chat', {
      message: 'Hello, what is the weather today?'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('🟢 Gemini response:', chatRes.data);
  } catch (err) {
    if (err.response) {
      console.error('❌ Error response:', err.response.status, err.response.data);
    } else {
      console.error('❌ Error:', err.message);
    }
  }
})();
