/* eslint-disable no-undef */
import jwt from 'jsonwebtoken';
import levelup from 'levelup';
import leveldown from 'leveldown';
import { respondWithStatus } from './requestHandler';
import { pool } from './database';


// Set up LevelDB instance
const db = levelup(leveldown('./tokensDB'));

// Generate a new JWT
const generateToken = async (userId, password) => {
	const token = jwt.sign({ userId: userId, password: password }, process.env.JWT_SECRET, { expiresIn: '7d' });
	await db.put(token, 'valid');
	return token;
};

// Middleware to verify the JWT and set req.userId
const verifyToken = async (req, res, next) => {
	const token = req.headers.authorization;
	if (!token) {
		return await respondWithStatus(res, 401, 'No token provided');
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.userId = decoded.userId;

		const [rows] = await pool.execute(
			'SELECT * FROM users WHERE id = ? LIMIT 1',
			[req.userId],
		);
		if (!rows.length) {
			return await respondWithStatus(res, 404, 'User not found!');
		}
		const passwordMatch = await Bun.password.verify(decoded.password, rows[0].password);
		if (!passwordMatch) {
			return await respondWithStatus(res, 401, 'Token is invalid');
		}
		// Check if the token is close to expiring
		const now = Date.now().valueOf() / 1000;
		if (decoded.exp - now < 36000) {
			// Generate a new token if the old one is close to expiring
			const newToken = generateToken(req.userId, decoded.password);
			res.cookie('token', newToken, {
				expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
			});
			res.set('Authorization', newToken);
		}

		// Check if the token has been revoked
		const tokenStatus = await db.get(token);
		if (tokenStatus != 'valid') {
			return await respondWithStatus(res, 401, 'Token has been revoked ');
		}
		next();
	}
	catch (error) {
		return await respondWithStatus(res, 401, 'Invalid user');
	}
};

// Function to revoke a token
const revokeToken = (token) => {
	return new Promise((resolve, reject) => {
		db.put(token, 'revoked', (error) => {
			if (error) {
				reject(error);
			}
			else {
				resolve();
			}
		});
	});
};

// Function to revoke all tokens of a user
const revokeUserTokens = (userId) => {
	return new Promise((resolve, reject) => {
		const tokensToRevoke = [];
		db.createReadStream()
			.on('data', (data) => {
				const token = data.key;
				const decoded = jwt.decode(token);
				if (decoded.userId === userId) {
					tokensToRevoke.push(token);
				}
			})
			.on('end', () => {
				Promise.all(tokensToRevoke.map(revokeToken))
					.then(resolve)
					.catch(reject);
			});
	});
};

export { generateToken, verifyToken, revokeToken, revokeUserTokens };
