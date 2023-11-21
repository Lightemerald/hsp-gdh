import fs from 'fs';
import path from 'path';
import cors from 'cors';
import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';

import { log } from './modules/log';
import { speedLimiter, checkSystemLoad } from './modules/requestHandler';

import testRouter from './routes/test';
import usersRouter from './routes/users';
import pilotsRouter from './routes/pilots';
import airplanesRouter from './routes/airplanes';
import airlinesRouter from './routes/airlines';
import airportsRouter from './routes/airports';
import flightsRouter from './routes/flights';
import seatsRouter from './routes/seats';

const app = express();
app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());
app.use(speedLimiter);
app.use(checkSystemLoad);
app.use(logger('dev'));
app.use(logger('combined', { stream: fs.createWriteStream(path.join(__dirname, 'logs/access.log'), { flags: 'a' }) }));
app.use(cors({
	origin: '*',
}));

app.use(express.static('public'));

// routes
app.use('/api/test', testRouter);
app.use('/api/users', usersRouter);
app.use('/api/pilots', pilotsRouter);
app.use('/api/airplanes', airplanesRouter);
app.use('/api/airlines', airlinesRouter);
app.use('/api/airports', airportsRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/seats', seatsRouter);

// run the API
app.listen(process.env.PORT, async () => {
	log(`running at port ${process.env.PORT}`);
});

// test
// import { post } from './modules/fetcher';
// post('http://127.0.0.1:1109/users/login', { 'usernameOrEmail':'foo', 'password':'bar' }).then(res => console.log(res));
