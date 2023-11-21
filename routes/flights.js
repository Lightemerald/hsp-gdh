import express from 'express';
import { pool } from '../modules/database';
import { verifyToken } from '../modules/token';
import { hasPermission, checkBanned } from '../modules/permission';
import { respondWithStatus, respondWithStatusJSON } from '../modules/requestHandler';

const router = express.Router();

router.get('/', verifyToken, checkBanned, hasPermission('view_flights'), async (req, res) => {
	try {
		const [rows] = await pool.execute('SELECT * FROM flights');

		if (!rows.length) {
			return await respondWithStatus(res, 404, 'Flights not found');
		}
		return await respondWithStatusJSON(res, 200, rows);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.post('/', verifyToken, checkBanned, hasPermission('add_flights'), async (req, res) => {
	const { airline_id, pilot_id, flight_no, origin_id, destination_id, departure_time, arrival_time, duration_minutes, price_economy, price_business, price_first_class, status } = req.body;
	if ([airline_id, pilot_id, flight_no, origin_id, destination_id, departure_time, arrival_time, duration_minutes, price_economy, price_business, price_first_class, status].every(Boolean)) {
		try {
			const [result] = await pool.execute(
				'INSERT INTO flights (airline_id, pilot_id, flight_no, origin_id, destination_id, departure_time, arrival_time, duration_minutes, price_economy, price_business, price_first_class, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
				[ airline_id, pilot_id, flight_no, origin_id, destination_id, departure_time, arrival_time, duration_minutes, price_economy, price_business, price_first_class, status ],
			);
			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error storing flight');
			}
			return await respondWithStatus(res, 200, 'Flight created successfully');
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

router.get('/:flightId', verifyToken, checkBanned, hasPermission('view_flights'), async (req, res) => {
	try {
		const id = req.params.flightId;
		const [rows] = await pool.execute('SELECT * FROM flights WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Flight not found');
		}
		return await respondWithStatusJSON(res, 200, rows[0]);
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

router.patch('/:flightId', verifyToken, checkBanned, hasPermission('edit_flights'), async (req, res) => {
	try {
		const id = req.params.flightId;
		const { type, value } = req.body;
		const [rows] = await pool.execute('SELECT * FROM flights WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Flight not found');
		}
		const fields = rows.map(row => Object.keys(row));
		if (fields[0].includes(type)) {
			const [result] = await pool.execute(`UPDATE flights SET ${type} = ? WHERE id = ?`, [value, id]);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating flight');
			}
			return await respondWithStatus(res, 200, 'Flight updated successfully');
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

router.put('/:flightId', verifyToken, checkBanned, hasPermission('edit_flights'), async (req, res) => {
	const id = req.params.flightId;
	const { airline_id, pilot_id, flight_no, origin_id, destination_id, departure_time, arrival_time, duration_minutes, price_economy, price_business, price_first_class, status } = req.body;
	if ([airline_id, pilot_id, flight_no, origin_id, destination_id, departure_time, arrival_time, duration_minutes, price_economy, price_business, price_first_class, status].every(Boolean)) {
		try {
			const [rows] = await pool.execute('SELECT * FROM flights WHERE id = ? LIMIT 1', [id]);

			if (rows.length === 0) {
				return await respondWithStatus(res, 404, 'Flight not found');
			}
			const [result] = await pool.execute(
				'UPDATE flights SET airline_id = ?, pilot_id = ?, flight_no = ?, origin_id = ?, destination_id = ?, departure_time = ?, arrival_time = ?, duration_minutes= ?, price_economy = ?, price_business = ?, price_first_class = ?, status = ? WHERE id = ?',
				[airline_id, pilot_id, flight_no, origin_id, destination_id, departure_time, arrival_time, duration_minutes, price_economy, price_business, price_first_class, status, id],
			);

			if (result.affectedRows === 0) {
				return await respondWithStatus(res, 500, 'Error updating flight');
			}
			return await respondWithStatus(res, 200, 'Flight updated successfully');
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

router.delete('/:flightId', verifyToken, checkBanned, hasPermission('delete_flights'), async (req, res) => {
	try {
		const id = req.params.flightId;
		const [rows] = await pool.execute('SELECT * FROM flights WHERE id = ? LIMIT 1', [id]);

		if (rows.length === 0) {
			return await respondWithStatus(res, 404, 'Flight not found');
		}

		const [result] = await pool.execute('DELETE FROM flights WHERE id = ?', [id]);

		if (result.affectedRows === 0) {
			return await respondWithStatus(res, 500, 'Error removing flight');
		}
		return await respondWithStatus(res, 200, 'Flight deleted successfully');
	}
	catch (err) {
		console.error(err);
		return await respondWithStatus(res, 500, 'An error has occured');
	}
});

export default router;
