import { app } from './app.js';
import dotenv from 'dotenv';
import connectDB from './db/index.js';

// Render पर .env फाइल नहीं होती—Dashboard से env आता है
if (process.env.NODE_ENV !== 'production') {
  dotenv.config(); // लोकल पर .env पढ़ेगा
}

const PORT = process.env.PORT || 2000;
const HOST = '0.0.0.0'; // IMPORTANT: Render के लिए

connectDB()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
