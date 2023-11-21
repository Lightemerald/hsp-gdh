import { pool } from '../modules/database.js';
import { respondWithStatus } from './requestHandler.js';

// Middleware to verify the user permissions
async function verifyPermissions(userId, perms_req) {

	try {
		// Query the database to get the user
		const [user] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
		if (user.length === 0) {
			return false;
		}

		// Query the database to get the perms and verify
		const [hasPerm] = await pool.execute(
			'SELECT COUNT(*) AS count FROM user_type_permissions WHERE user_type_id = ? AND permission_id = (SELECT id FROM permissions WHERE name = ?) LIMIT 1',
			[ user[0].user_type_id, perms_req ],
		);
		if (hasPerm.length === 0) {
			return false;
		}
		else {
			return true;
		}
	}
	catch (error) {
		return false;
	}
}

const hasPermission = (perms_req) => async (req, res, next) => {
	try {
		const userId = req.userId;

		// Query the database to get the user
		const [user] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
		if (user.length === 0) {
			return await respondWithStatus(res, 401, 'User is invalid');
		}
		// Query the database to get the perms and verify
		const [hasPerm] = await pool.execute(
			'SELECT COUNT(*) AS count FROM user_type_permissions WHERE user_type_id = ? AND permission_id = (SELECT id FROM permissions WHERE name = ?) LIMIT 1',
			[ user[0].user_type_id, perms_req ],
		);
		if (req.originalUrl == '/api/users/me') {
			next();
			return;
		}
		if (hasPerm.length === 0) {
			return await respondWithStatus(res, 403, 'Missing permission');
		}
		else if (hasPerm[0].count == 0) {
			return await respondWithStatus(res, 403, 'Missing permission');
		}
		else {next();}
	}
	catch (error) {
		console.error(error);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
};

async function checkBanned(req, res, next) {
	const userId = req.userId;
	try {
		const [user] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
		if (user.length === 0) {
			return await respondWithStatus(res, 404, 'User not found');
		}
		if (user[0].is_banned) {
			return await respondWithStatus(res, 403, 'User is banned');
		}
		next();
	}
	catch (error) {
		console.error(error);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
}

async function isBanned(userId) {
	try {
		// Query the database to get the user
		const [user] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
		if (user.length === 0) {
			return true;
		}
		else if (user[0].is_banned == 1) {
			return true;
		}
		else {
			return false;
		}
	}
	catch (error) {
		console.error(error);
		return true;
	}
}

export { verifyPermissions, hasPermission, checkBanned, isBanned };