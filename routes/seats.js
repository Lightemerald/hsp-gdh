import express from 'express';
import { pool } from '../modules/database';
import { verifyToken } from '../modules/token';
import { hasPermission, checkBanned } from '../modules/permission';
import { respondWithStatus, respondWithStatusJSON } from '../modules/requestHandler';

const router = express.Router();

router.get('/', verifyToken, checkBanned, hasPermission('view_seats'), async (req, res) => {
	try {
		const [rows] = await pool.execute('SELECT * FROM seats WHERE 1');

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Seats not found');
		}
		return await respondWithStatusJSON(res, 200, rows);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.post('/', verifyToken, checkBanned, hasPermission('add_seats'), async (req, res) => {
	const { user_id, flight_id, place_no, seat_class } = req.body;
	if ([ user_id, flight_id, place_no, seat_class ].every(Boolean)) {
		try {
			const [user] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [user_id]);

			if (user.length === 0) {
				return await respondWithStatus(res, 404, 'User not found');
			}

			const [flight] = await pool.execute('SELECT * FROM flights WHERE id = ? LIMIT 1', [flight_id]);

			if (flight.length === 0) {
				return await respondWithStatus(res, 404, 'Flight not found');
			}

			const [result] = await pool.execute(
				'INSERT INTO seats (user_id, flight_id, place_no, class) VALUES (?, ?, ?, ?)',
				[ user_id, flight_id, place_no, seat_class ],
			);
			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error storing seat');
			}
			return await respondWithStatus(res, 200, 'Seat created successfully');
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

router.get('/:seatId', verifyToken, checkBanned, hasPermission('view_seats'), async (req, res) => {
	try {
		const id = req.params.seatId;
		const [rows] = await pool.execute('SELECT * FROM seats WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Seat not found');
		}
		return await respondWithStatusJSON(res, 200, rows[0]);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.patch('/:seatId', verifyToken, checkBanned, hasPermission('edit_seats'), async (req, res) => {
	try {
		const id = req.params.seatId;
		const { type, value } = req.body;
		const [rows] = await pool.execute('SELECT * FROM seats WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Seat not found');
		}
		const fields = rows.map(row => Object.keys(row));
		if (fields[0].includes(type)) {
			const [result] = await pool.execute(`UPDATE seats SET ${type} = ? WHERE id = ?`, [value, id]);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating seat');
			}
			return await respondWithStatus(res, 200, 'Seat updated successfully');
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

router.put('/:seatId', verifyToken, checkBanned, hasPermission('edit_seats'), async (req, res) => {
	const id = req.params.seatId;
	const { user_id, flight_id, place_no, seat_class } = req.body;
	if ([ user_id, flight_id, place_no, seat_class ].every(Boolean)) {
		try {
			const [rows] = await pool.execute('SELECT * FROM seats WHERE id = ? LIMIT 1', [id]);

			if (rows.length === 0) {
				return await respondWithStatus(res, 404, 'Seat not found');
			}
			const [result] = await pool.execute(
				'UPDATE seats SET user_id = ?, flight_id = ?, place_no = ?, class = ? WHERE id = ?',
				[user_id, flight_id, place_no, seat_class, id],
			);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating seat');
			}
			return await respondWithStatus(res, 200, 'Seat updated successfully');
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

router.delete('/:seatId', verifyToken, checkBanned, hasPermission('delete_seats'), async (req, res) => {
	try {
		const id = req.params.seatId;
		const [rows] = await pool.execute('SELECT * FROM seats WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Seat not found');
		}

		const [result] = await pool.execute('DELETE FROM seats WHERE id = ?', [id]);

		if (result.affectedRows === 0) {
			return await respondWithStatus(res, 500, 'Error removing seat');
		}
		return await respondWithStatus(res, 200, 'Seat removed successfully');
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

export default router;
