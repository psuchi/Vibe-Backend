require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Actually, the SDK doesn't expose listModels directly on the main object easily in older versions, 
    // but we can fetch it via REST.
    const axios = require('axios');
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    
    console.log("Available models:");
    response.data.models.forEach(model => {
      console.log(`- ${model.name} (Supported methods: ${model.supportedGenerationMethods.join(', ')})`);
    });
  } catch (error) {
    console.error("Error fetching models:", error.response ? error.response.data : error.message);
  }
}

listModels();
