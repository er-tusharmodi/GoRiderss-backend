import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({limit: '20kb'}));
app.use(express.urlencoded({extended: true, limit: '20kb'}));
app.use(express.static('public'));
app.use(cookieParser());

// MUST: Render health check
app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));

import authRouter from './routes/auth.routes.js';
app.use('/api/v1/auth', authRouter);

import userProfileRouter from './routes/userProfile.routes.js';
app.use('/api/v1/userProfile', userProfileRouter);

import groupAndTripRouter from './routes/groupAndTrip.routes.js';
app.use('/api/v1/groupAndTrip', groupAndTripRouter);

import followRouter from './routes/follow.routes.js';
app.use('/api/v1/userConnection', followRouter);

import settingsRoutes from './routes/settings.routes.js';
app.use('/api/v1/settings', settingsRoutes);

app.use(errorHandler);
export {app}