require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Mongoose connected');
    const user = await User.findOne({ email: 'nonexistent@example.com' });
    console.log('Find result:', user);
    await mongoose.disconnect();
    console.log('✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
