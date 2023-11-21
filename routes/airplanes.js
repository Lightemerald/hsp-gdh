import express from 'express';
import { pool } from '../modules/database';
import { verifyToken } from '../modules/token';
import { hasPermission, checkBanned } from '../modules/permission';
import { respondWithStatus, respondWithStatusJSON } from '../modules/requestHandler';

const router = express.Router();

router.get('/', verifyToken, checkBanned, hasPermission('view_airplanes'), async (req, res) => {
	try {
		const [rows] = await pool.execute('SELECT * FROM airplanes WHERE 1');

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airplanes not found');
		}
		return await respondWithStatusJSON(res, 200, rows);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.post('/', verifyToken, checkBanned, hasPermission('add_airplanes'), async (req, res) => {
	const { name, type, manufacturer, capacity, status, location } = req.body;
	if ([name, type, manufacturer, capacity, status, location].every(Boolean)) {
		try {
			const [result] = await pool.execute(
				'INSERT INTO airplanes (name, type, manufacturer, capacity, status, location) VALUES (?, ?, ?, ?, ?, ?)',
				[ name, type, manufacturer, capacity, status, location ],
			);
			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error storing airplane');
			}
			return await respondWithStatus(res, 200, 'Airplane created successfully');
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

router.get('/:airplaneId', verifyToken, checkBanned, hasPermission('view_airplanes'), async (req, res) => {
	try {
		const id = req.params.airplaneId;
		const [rows] = await pool.execute('SELECT * FROM airplanes WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airplane not found');
		}
		return await respondWithStatusJSON(res, 200, rows[0]);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.patch('/:airplaneId', verifyToken, checkBanned, hasPermission('edit_airplanes'), async (req, res) => {
	try {
		const id = req.params.airplaneId;
		const { type, value } = req.body;
		const [rows] = await pool.execute('SELECT * FROM airplanes WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airplane not found');
		}
		const fields = rows.map(row => Object.keys(row));
		if (fields[0].includes(type)) {
			const [result] = await pool.execute(`UPDATE airplanes SET ${type} = ? WHERE id = ?`, [value, id]);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating airplane');
			}
			return await respondWithStatus(res, 200, 'Airplane updated successfully');
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

router.put('/:airplaneId', verifyToken, checkBanned, hasPermission('edit_airplanes'), async (req, res) => {
	const id = req.params.airplaneId;
	const { name, type, manufacturer, capacity, status, location } = req.body;
	if ([name, type, manufacturer, capacity, status, location].every(Boolean)) {
		try {
			const [rows] = await pool.execute('SELECT * FROM airplanes WHERE id = ? LIMIT 1', [id]);

			if (rows.length === 0) {
				return await respondWithStatus(res, 404, 'Airplane not found');
			}
			const [result] = await pool.execute(
				'UPDATE airplanes SET name = ?, type = ?, manufacturer = ?, capacity = ?, status = ?, location = ? WHERE id = ?',
				[name, type, manufacturer, capacity, status, location, id],
			);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating airplane');
			}
			return await respondWithStatus(res, 200, 'Airplane updated successfully');
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

router.delete('/:airplaneId', verifyToken, checkBanned, hasPermission('delete_airplanes'), async (req, res) => {
	try {
		const id = req.params.airplaneId;
		const [rows] = await pool.execute('SELECT * FROM airplanes WHERE id = ? LIMIT', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Airplane not found');
		}

		const [result] = await pool.execute('DELETE FROM airplanes WHERE id = ?', [id]);

		if (result.affectedRows === 0) {
			return await respondWithStatus(res, 500, 'Error removing airplane');
		}
		return await respondWithStatus(res, 200, 'Airplane deleted successfully');
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

export default router;
