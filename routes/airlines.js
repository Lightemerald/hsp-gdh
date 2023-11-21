import express from 'express';
import { pool } from '../modules/database';
import { verifyToken } from '../modules/token';
import { hasPermission, checkBanned } from '../modules/permission';
import { respondWithStatus, respondWithStatusJSON } from '../modules/requestHandler';

const router = express.Router();

router.get('/', verifyToken, checkBanned, hasPermission('view_airlines'), async (req, res) => {
	try {
		const [rows] = await pool.execute('SELECT * FROM airlines WHERE 1');

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airlines not found');
		}
		return await respondWithStatusJSON(res, 200, rows);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.post('/', verifyToken, checkBanned, hasPermission('add_airlines'), async (req, res) => {
	const { name, code, logo } = req.body;
	if ([ name, code, logo ].every(Boolean)) {
		try {
			const [result] = await pool.execute(
				'INSERT INTO airlines (name, code, logo) VALUES (?, ?, ?)',
				[ name, code, logo ],
			);
			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error storing airline');
			}
			return await respondWithStatus(res, 200, 'Airline created successfully');
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

router.get('/:airlineId', verifyToken, checkBanned, hasPermission('view_airlines'), async (req, res) => {
	try {
		const id = req.params.airlineId;
		const [rows] = await pool.execute('SELECT * FROM airlines WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airline not found');
		}
		return await respondWithStatusJSON(res, 200, rows[0]);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.patch('/:airlineId', verifyToken, checkBanned, hasPermission('edit_airlines'), async (req, res) => {
	try {
		const id = req.params.airlineId;
		const { type, value } = req.body;
		const [rows] = await pool.execute('SELECT * FROM airlines WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airline not found');
		}
		const fields = rows.map(row => Object.keys(row));
		if (fields[0].includes(type)) {
			const [result] = await pool.execute(`UPDATE airlines SET ${type} = ? WHERE id = ?`, [value, id]);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating airline');
			}
			return await respondWithStatus(res, 200, 'Airline updated successfully');
		}
		else {
			return await respondWithStatus(res, 400, 'Invalid type');
		}
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.put('/:airlineId', verifyToken, checkBanned, hasPermission('edit_airlines'), async (req, res) => {
	const id = req.params.airlineId;
	const { name, code, logo } = req.body;
	if ([name, code, logo].every(Boolean)) {
		try {
			const [rows] = await pool.execute('SELECT * FROM airlines WHERE id = ? LIMIT 1', [id]);

			if (rows.length === 0) {
				return await respondWithStatus(res, 404, 'Airline not found');
			}
			const [result] = await pool.execute(
				'UPDATE airlines SET name = ?, code = ?, logo = ? WHERE id = ?',
				[name, code, logo, id],
			);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating airline');
			}
			return await respondWithStatus(res, 200, 'Airline updated successfully');
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

router.delete('/:airlineId', verifyToken, checkBanned, hasPermission('delete_airlines'), async (req, res) => {
	try {
		const id = req.params.airlineId;
		const [rows] = await pool.execute('SELECT * FROM airlines WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airline not found');
		}

		const [result] = await pool.execute('DELETE FROM airlines WHERE id = ?', [id]);

		if (result.affectedRows === 0) {
			return await respondWithStatus(res, 500, 'Error removing airline');
		}
		return await respondWithStatus(res, 200, 'Airline removed successfully');
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

export default router;