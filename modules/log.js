import pino from 'pino';

const logger = pino();

export function log(x) {
	logger.info(x);
}

export function debug(x) {
	logger.debug(x);
}

export function warn(x) {
	logger.warn(x);
}

export function error(x) {
	logger.error(x);
}