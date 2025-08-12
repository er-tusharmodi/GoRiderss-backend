import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from "./middlewares/errorHandler.middlewares.js";

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({limit: '20kb'}));
app.use(express.urlencoded({extended: true, limit: '20kb'}));
app.use(express.static('public'));
app.use(cookieParser());

import authRouter from './routes/auth.routes.js';
app.use('/api/v1/auth', authRouter);

import userProfileRouter from './routes/userProfile.routes.js';
app.use('/api/v1/userProfile', userProfileRouter);

import groupAndTripRouter from './routes/groupAndTrip.routes.js';
app.use('/api/v1/groupAndTrip', groupAndTripRouter);

app.use(errorHandler);
export {app}