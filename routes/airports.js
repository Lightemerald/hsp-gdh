import express from 'express';
import { pool } from '../modules/database';
import { verifyToken } from '../modules/token';
import { hasPermission, checkBanned } from '../modules/permission';
import { respondWithStatus, respondWithStatusJSON } from '../modules/requestHandler';

const router = express.Router();

router.get('/', verifyToken, checkBanned, hasPermission('view_airports'), async (req, res) => {
	try {
		const [rows] = await pool.execute('SELECT * FROM airports WHERE 1');

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airports not found');
		}
		return await respondWithStatusJSON(res, 200, rows);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.post('/', verifyToken, checkBanned, hasPermission('add_airports'), async (req, res) => {
	const { name, code, city, country, latitude, longitude } = req.body;
	if ([name, code, city, country, latitude, longitude].every(Boolean)) {
		try {
			const [result] = await pool.execute(
				'INSERT INTO airports (name, code, city, country, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
				[ name, code, city, country, latitude, longitude ],
			);
			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error storing airport');
			}
			return await respondWithStatus(res, 200, 'Airport created successfully');
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

router.get('/:airportId', verifyToken, checkBanned, hasPermission('view_airports'), async (req, res) => {
	try {
		const id = req.params.airportId;
		const [rows] = await pool.execute('SELECT * FROM airports WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airports not found');
		}
		return await respondWithStatusJSON(res, 200, rows[0]);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.patch('/:airportId', verifyToken, checkBanned, hasPermission('edit_airports'), async (req, res) => {
	try {
		const id = req.params.airportId;
		const { type, value } = req.body;
		const [rows] = await pool.execute('SELECT * FROM airports WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airport not found');
		}
		const fields = rows.map(row => Object.keys(row));
		if (fields[0].includes(type)) {
			const [result] = await pool.execute(`UPDATE airports SET ${type} = ? WHERE id = ?`, [value, id]);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating airport');
			}
			return await respondWithStatus(res, 200, 'Airport updated successfully');
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

router.put('/:airportId', verifyToken, checkBanned, hasPermission('edit_airports'), async (req, res) => {
	const id = req.params.airportId;
	const { name, code, city, country, latitude, longitude } = req.body;
	if ([name, code, city, country, latitude, longitude].every(Boolean)) {
		try {
			const [rows] = await pool.execute('SELECT * FROM airports WHERE id = ? LIMIT 1', [id]);

			if (rows.length === 0) {
				return await respondWithStatus(res, 404, 'Airport not found');
			}
			const [result] = await pool.execute(
				'UPDATE airports SET name = ?, code = ?, city = ?, country = ?, latitude = ?, longitude = ? WHERE id = ?',
				[name, code, city, country, latitude, longitude, id],
			);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating airport');
			}
			return await respondWithStatus(res, 200, 'Airport updated successfully');
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

router.delete('/:airportId', verifyToken, checkBanned, hasPermission('delete_airports'), async (req, res) => {
	try {
		const id = req.params.airportId;
		const [rows] = await pool.execute('SELECT * FROM airports WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airport not found');
		}

		const [result] = await pool.execute('DELETE FROM airports WHERE id = ?', [id]);

		if (result.affectedRows === 0) {
			return await respondWithStatus(res, 500, 'Error removing airport');
		}
		return await respondWithStatus(res, 200, 'Airport deleted successfully');
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

export default router;
