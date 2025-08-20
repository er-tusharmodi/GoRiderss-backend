import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

// Render पर .env फाइल नहीं होती—Dashboard से env आता है
if (process.env.NODE_ENV !== 'production') {
  dotenv.config(); // लोकल पर .env पढ़ेगा
}

const PORT = process.env.PORT || 8000;
const HOST = 'localhost'; // Render के लिए जरूरी

connectDB()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
