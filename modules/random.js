import crypto from 'crypto';

export function random(x, y) {
	return crypto.randomInt(x, y);
}

export function randomHEX(x) {
	return crypto.randomBytes(x).toString('hex');
}
