import express from 'express';
import { pool } from '../modules/database';
import { sendVerification, sendResetVerification } from '../modules/mailHandler';
import { isEmailDomainValid, isValidEmail, isNumber } from '../modules/formatHandler';
import { hasPermission, checkBanned, isBanned } from '../modules/permission';
import { verifyToken, generateToken, revokeUserTokens } from '../modules/token';
import { requestLimiter, respondWithStatus, respondWithStatusJSON } from '../modules/requestHandler';

const router = express.Router();

router.post('/register', requestLimiter, async (req, res) => {
	const { username, email, password, first_name, last_name, phone = 'none' } = req.body;
	if ([ username, email, password, first_name, last_name ].every(Boolean)) {
		try {
			if (isValidEmail(email) && isEmailDomainValid(email)) {
				const [existingUsername] = await pool.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
				if (existingUsername.length) {
					return await respondWithStatus(res, 400, 'Username is already taken');
				}

				const [existingEmail] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
				if (existingEmail.length) {
					return await respondWithStatus(res, 400, 'Email is already taken');
				}
				const hashedPassword = await Bun.password.hash(password);
				const [unverifiedId] = await pool.execute(
					'SELECT id FROM user_types WHERE name = \'unverified\' LIMIT 1',
				);
				const [result] = await pool.execute(
					'INSERT INTO users (first_name, last_name, username, email, password, user_type_id, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
					[ first_name, last_name, username, email, hashedPassword, unverifiedId[0].id, phone ],
				);
				if (result.affectedRows === 0) {
					return await respondWithStatus(res, 500, 'Error storing user');
				}
				const [rows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
				const code = sendVerification(email, rows[0].id);
				pool.execute('INSERT INTO user_email_verifications (user_id, verification_code, type) VALUES (?, ?, ?)', [ rows[0].id, code, 'register' ]);
				return await respondWithStatus(res, 200, 'Successfully registered');
			}
			else {
				return await respondWithStatus(res, 400, 'Invalid email address');
			}
		}
		catch (error) {
			console.error(error);
			return await respondWithStatus(res, 500, 'An error has occured');
		}
	}
	else {
		return await respondWithStatus(res, 400, 'Missing fields');
	}
});

router.post('/login', requestLimiter, async (req, res) => {
	const { usernameOrEmail, password } = req.body;
	if ([usernameOrEmail, password].every(Boolean)) {
		try {
			const [rows] = await pool.execute(
				'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
				[usernameOrEmail, usernameOrEmail],
			);
			if (!rows.length) {
				return await respondWithStatus(res, 404, 'Incorrect username or email');
			}
			const user = rows[0];
			const passwordMatch = await Bun.password.verify(password, user.password);
			if (!passwordMatch) {
				return await respondWithStatus(res, 401, 'Incorrect password');
			}
			if (isBanned(user.id)) {
				const token = await generateToken(user.id, password);
				res.cookie('token', token, {
					expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
					httpOnly: true,
					secure: true,
					sameSite: 'strict',
				});
				return await respondWithStatusJSON(res, 200, {
					message: 'Login successful',
					token: token,
					user: {
						id: user.id,
						username: user.username,
						email: user.email,
						name: user.name,
					},
				});
			}
			else {
				return await respondWithStatus(res, 403, 'User is banned or an issue occured');
			}
		}
		catch (error) {
			console.error(error);
			return await respondWithStatus(res, 500, 'An error has occured');
		}
	}
	else {
		return await respondWithStatus(res, 400, 'Missing fields');
	}
});

router.get('/verify', async (req, res) => {
	const { c, u } = req.query;
	if ([c, u].every(Boolean)) {
		try {
			let userId = u;
			if (!isNumber(u)) {
				const [user] = await pool.execute(
					'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
					[u, u],
				);
				if (!user.length) {
					return await respondWithStatus(res, 404, 'Incorrect username or email');
				}
				userId = user[0].id;
			}
			const [rows] = await pool.execute(
				'SELECT * FROM user_email_verifications WHERE user_id = ? AND verification_code = ? LIMIT 1',
				[userId, c],
			);
			if (!rows.length) {
				return await respondWithStatus(res, 400, 'Invalid code');
			}

			if (rows[0].type == 'register') {
				const [customerId] = await pool.execute(
					'SELECT id FROM user_types WHERE name = \'customer\' LIMIT 1',
				);
				const [result] = await pool.execute('UPDATE users SET user_type_id = ? WHERE id = ?', [ customerId[0].id, userId ]);
				if (result.affectedRows === 0) {
					return await respondWithStatus(res, 500, 'Error updating user');
				}
			}
			return await respondWithStatus(res, 200, 'Successfully verified user');
		}
		catch (error) {
			console.error(error);
			return await respondWithStatus(res, 500, 'An error has occured');
		}
	}
	else {
		return await respondWithStatus(res, 400, 'Missing fields');
	}
});

router.post('/verify', verifyToken, checkBanned, async (req, res) => {
	const { code } = req.body;
	const userId = req.userId;
	if ([code, userId].every(Boolean)) {
		try {
			const [rows] = await pool.execute(
				'SELECT * FROM user_email_verifications WHERE user_id = ? AND verification_code = ? LIMIT 1',
				[ userId, code ],
			);
			if (!rows.length) {
				return await respondWithStatus(res, 400, 'Invalid code');
			}
			const [customerId] = await pool.execute(
				'SELECT id FROM user_types WHERE name = \'customer\' LIMIT 1',
			);
			const [result] = await pool.execute('UPDATE users SET user_type_id = ? WHERE userId = ?', [ customerId[0].id, userId ]);
			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating user');
			}
			return await respondWithStatus(res, 200, 'Successfully verified user');
		}
		catch (error) {
			console.error(error);
			return await respondWithStatus(res, 500, 'An error has occured');
		}
	}
	else {
		return await respondWithStatus(res, 400, 'Missing fields');
	}
});

router.post('/changepassword', async (req, res) => {
	const { usernameOrEmail } = req.body;
	if ([ usernameOrEmail ].every(Boolean)) {
		try {
			const [user] = await pool.execute('SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1', [usernameOrEmail, usernameOrEmail]);
			if (user.length === 0) {
				return await respondWithStatus(res, 404, 'User not found');
			}

			let code;
			const [rows] = await pool.execute(
				'SELECT * FROM user_email_verifications WHERE user_id = ? AND type = \'password\' LIMIT 1',
				[user[0].id],
			);
			if (!rows.length) {
				code = sendResetVerification(user[0].email);
			}
			else {
				code = sendResetVerification(user[0].email, rows[0].verification_code);
			}

			if (code) {
				pool.execute('INSERT INTO user_email_verifications (user_id, verification_code, type) VALUES (?, ?, ?)', [ user[0].id, code, 'password' ]);
				return await respondWithStatus(res, 200, 'Successfully sent password reset email');
			}
			else {
				return await respondWithStatus(res, 500, 'An error has occured');
			}
		}
		catch (error) {
			console.error(error);
			return await respondWithStatus(res, 500, 'An error has occured');
		}
	}
});

router.patch('/changepassword', async (req, res) => {
	const { usernameOrEmail, password, code } = req.body;
	try {
		const [user] = await pool.execute(
			'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
			[usernameOrEmail, usernameOrEmail],
		);
		if (!user.length) {
			return await respondWithStatus(res, 404, 'Incorrect username or email');
		}
		const [rows] = await pool.execute(
			'SELECT * FROM user_email_verifications WHERE user_id = ? AND verification_code = ? AND type = \'password\' ORDER BY 1 DESC LIMIT 1',
			[user[0].id, code],
		);
		if (!rows.length) {
			return await respondWithStatus(res, 400, 'Invalid code');
		}
		const [result] = await pool.execute('DELETE FROM user_email_verifications WHERE user_id = ? AND verification_code = ?', [ user[0].id, code ]);
		if (result.affectedRows === 0) {
			return await respondWithStatus(res, 500, 'Error removing verification');
		}
		revokeUserTokens(user[0].id);
		const token = generateToken(user[0].id, password);
		res.cookie('token', token, {
			expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
		});
		return userPATCH(res, user[0].id, 'password', password);
	}
	catch (error) {
		console.error(error);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.get('/', verifyToken, checkBanned, hasPermission('view_users'), async (req, res) => {
	try {
		const [rows] = await pool.execute('SELECT * FROM users WHERE 1');

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Users not found');
		}
		return await respondWithStatusJSON(res, 200, rows);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.post('/', verifyToken, checkBanned, hasPermission('add_users'), async (req, res) => {
	const { first_name, last_name, username, email, password, user_type } = req.body;
	if ([first_name, last_name, username, email, password, user_type].every(Boolean)) {
		try {
			const hashedPassword = await Bun.password.hash(password);
			await pool.execute(
				'INSERT INTO users (first_name, last_name, username, email, password, user_type) VALUES (?, ?, ?, ?, ?, ?)',
				[ first_name, last_name, username, email, hashedPassword, user_type ],
			);
			return await respondWithStatus(res, 200, 'User created successfully');
		}
		catch (err) {
			console.error(err);
			return await respondWithStatus(res, 500, 'An error has occured');
		}
	}
	else {
		return await respondWithStatus(res, 400, 'Missing fields');
	}
});

router.patch('/', verifyToken, checkBanned, async (req, res) => {
	try {
		const userId = req.userId;
		const { type, value } = req.body;
		userPATCH(res, userId, type, value);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.put('/', verifyToken, checkBanned, async (req, res) => {
	try {
		const userId = req.userId;
		const { first_name, last_name, username, email } = req.body;
		userPUT(res, userId, first_name, last_name, username, email);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.delete('/', verifyToken, checkBanned, async (req, res) => {
	try {
		const userId = req.userId;
		userDELETE(res, userId);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.get('/:userId', verifyToken, checkBanned, hasPermission('view_users'), async (req, res) => {
	try {
		let userId = req.params.userId;
		if (req.params.userId == 'me') {
			userId = req.userId;
		}
		const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'User not found');
		}
		const user = rows[0];
		delete user.password;
		return await respondWithStatusJSON(res, 200, user);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.patch('/:userId', verifyToken, checkBanned, hasPermission('edit_users'), async (req, res) => {
	try {
		const userId = req.params.userId;
		const { type, value } = req.body;
		const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'User not found');
		}
		const excludedKeys = ['id'];
		const fields = rows.map(row =>
			Object.keys(row)
				.filter(key => !excludedKeys.includes(key)),
		);
		console.log(fields[0]);
		if (fields[0].includes(type)) {
			const [result] = await pool.execute(`UPDATE users SET ${type} = ? WHERE id = ?`, [value, userId]);
			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating user');
			}
			return respondWithStatus(res, 200, 'User updated successfully');
		}
		else {
			return await respondWithStatus(res, 400, 'Invalid type or disallowed');
		}
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.put('/:userId', verifyToken, checkBanned, hasPermission('edit_users'), async (req, res) => {
	try {
		const userId = req.params.userId;
		const { first_name, last_name, username, email } = req.body;
		if ([first_name, last_name, username, email].every(Boolean)) {
			userPUT(res, userId, first_name, last_name, username, email);
		}
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.delete('/:userId', verifyToken, checkBanned, hasPermission('delete_users'), async (req, res) => {
	try {
		const userId = req.params.userId;
		userDELETE(res, userId);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

async function userPATCH(res, id, type, value) {
	const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
	if (rows.length === 0) {
		return await respondWithStatus(res, 404, 'User not found');
	}
	const excludedKeys = ['id', 'user_type_id', 'is_banned'];
	const fields = rows.map(row =>
		Object.keys(row)
			.filter(key => !excludedKeys.includes(key)),
	);
	if (type == 'password') {
		value = await Bun.password.hash(value);
	}
	if (fields[0].includes(type)) {
		const [result] = await pool.execute(`UPDATE users SET ${type} = ? WHERE id = ?`, [value, id]);
		if (result.affectedRows === 0) {
			return await respondWithStatus(res, 500, 'Error updating user');
		}
		return respondWithStatus(res, 200, 'User updated successfully');
	}
	else {
		return await respondWithStatus(res, 400, 'Invalid type or disallowed');
	}
}

async function userPUT(res, userId, first_name, last_name, username, email, password = false) {
	const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
	if (rows.length === 0) {
		return await respondWithStatus(res, 404, 'User not found');
	}
	let sqlQuery, queryParams;
	if (password) {
		const hashedPassword = await Bun.password.hash(password);
		sqlQuery = 'UPDATE users SET first_name = ?, last_name = ?, username = ?, email = ?, password = ? WHERE id = ?';
		queryParams = [first_name, last_name, username, email, hashedPassword, userId];
	}
	else {
		sqlQuery = 'UPDATE users SET first_name = ?, last_name = ?, username = ?, email = ? WHERE id = ?';
		queryParams = [first_name, last_name, username, email, userId];
	}
	const [result] = await pool.execute(sqlQuery, queryParams);
	if (result.affectedRows === 0) {
		return await respondWithStatus(res, 500, 'Error updating user');
	}
	return respondWithStatus(res, 200, 'User updated successfully');
}

async function userDELETE(res, userId) {
	const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
	if (rows.length === 0) {
		return await respondWithStatus(res, 404, 'User not found');
	}
	const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [ userId ]);
	if (result.affectedRows === 0) {
		return await respondWithStatus(res, 500, 'Error removing user');
	}
	return respondWithStatus(res, 200, 'User deleted successfully');
}

export default router;