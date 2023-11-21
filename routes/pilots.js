import express from 'express';
import { pool } from '../modules/database';
import { verifyToken } from '../modules/token';
import { hasPermission, checkBanned } from '../modules/permission';
import { respondWithStatus, respondWithStatusJSON } from '../modules/requestHandler';

const router = express.Router();

router.get('/', verifyToken, checkBanned, hasPermission('view_pilots'), async (req, res) => {
	try {
		const [rows] = await pool.execute('SELECT * FROM pilots WHERE 1');

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Pilots not found');
		}
		return await respondWithStatusJSON(res, 200, rows);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.post('/', verifyToken, checkBanned, hasPermission('add_pilots'), async (req, res) => {
	const { first_name, last_name, email, phone, license_number, license_expiry, salary, status } = req.body;
	if ([first_name, last_name, email, phone, license_number, license_expiry, salary, status].every(Boolean)) {
		try {
			const [result] = await pool.execute(
				'INSERT INTO pilots (first_name, last_name, email, phone, license_number, license_expiry, salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
				[ first_name, last_name, email, phone, license_number, license_expiry, salary, status ],
			);
			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error storing pilot');
			}
			return await respondWithStatus(res, 200, 'Pilot created successfully');
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

router.get('/:pilotId', verifyToken, checkBanned, hasPermission('view_pilots'), async (req, res) => {
	try {
		const id = req.params.pilotId;
		const [rows] = await pool.execute('SELECT * FROM pilots WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Pilot not found');
		}
		return await respondWithStatusJSON(res, 200, rows[0]);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.patch('/:pilotId', verifyToken, checkBanned, hasPermission('edit_pilots'), async (req, res) => {
	try {
		const id = req.params.pilotId;
		const { type, value } = req.body;
		const [rows] = await pool.execute('SELECT * FROM pilots WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Pilot not found');
		}
		const fields = rows.map(row => Object.keys(row));
		if (fields[0].includes(type)) {
			const [result] = await pool.execute(`UPDATE pilots SET ${type} = ? WHERE id = ?`, [value, id]);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating pilot');
			}
			return await respondWithStatus(res, 200, 'Pilot updated successfully');
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

router.put('/:pilotId', verifyToken, checkBanned, hasPermission('edit_pilots'), async (req, res) => {
	const id = req.params.pilotId;
	const { first_name, last_name, email, phone, license_number, license_expiry, salary, status } = req.body;
	if ([first_name, last_name, email, phone, license_number, license_expiry, salary, status].every(Boolean)) {
		try {
			const [rows] = await pool.execute('SELECT * FROM pilots WHERE id = ? LIMIT 1', [id]);

			if (rows.length === 0) {
				return await respondWithStatus(res, 404, 'Pilot not found');
			}
			const [result] = await pool.execute(
				'UPDATE pilots SET first_name = ?, last_name = ?, email = ?, phone = ?, license_number = ?, license_expiry = ?, salary = ?, status = ? WHERE id = ?',
				[first_name, last_name, email, phone, license_number, license_expiry, salary, status, id],
			);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating pilot');
			}
			return await respondWithStatus(res, 200, 'Pilot updated successfully');
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

router.delete('/:pilotId', verifyToken, checkBanned, hasPermission('delete_pilots'), async (req, res) => {
	try {
		const id = req.params.pilotId;
		const [rows] = await pool.execute('SELECT * FROM pilots WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Pilot not found');
		}

		const [result] = await pool.execute('DELETE FROM pilots WHERE id = ?', [id]);

		if (result.affectedRows === 0) {
			return await respondWithStatus(res, 500, 'Error removing pilot');
		}
		return await respondWithStatus(res, 200, 'Pilot removed successfully');
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

export default router;
