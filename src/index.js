import {app} from './app.js';
import dotenv from 'dotenv';
import connectDB from './db/index.js';

dotenv.config({
    path: './.env'
});
const PORT = process.env.PORT || 2000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
});