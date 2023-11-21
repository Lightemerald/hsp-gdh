import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import http from 'http';
import os from 'os';

const requestLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: 'Too many requests from this IP, please try again later',
});

const speedLimiter = slowDown({
	windowMs: 60 * 1000,
	delayAfter: 30,
	delayMs: 500,
	skipFailedRequests: true,
});

function checkSystemLoad(req, res, next) {
	const load = os.loadavg()[0];
	const cores = os.cpus().length;
	const threshold = cores * 0.7;

	if (load > threshold) {
		return res.status(503).send(http.STATUS_CODES[503]);
	}

	return next();
}

function respondWithStatus(res, statusCode, message) {
	const response = { status: statusCode, message: message };
	if (statusCode >= 400 && statusCode <= 599) {
		response.error = http.STATUS_CODES[statusCode];
	}
	return res.status(statusCode).json(response);
}

function respondWithStatusJSON(res, statusCode, JSON) {
	const response = { status: statusCode, JSON };
	if (statusCode >= 400 && statusCode <= 599) {
		response.error = http.STATUS_CODES[statusCode];
	}
	return res.status(statusCode).json(response);
}

export {
	requestLimiter,
	speedLimiter,
	checkSystemLoad,
	respondWithStatus,
	respondWithStatusJSON,
};