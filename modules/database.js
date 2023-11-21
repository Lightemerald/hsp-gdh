import mysql from 'mysql2';

const connection = mysql.createConnection({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME,
});
const pool = mysql.createPool({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME,
}).promise();

function createPool(host, user, password, db) {
	const newPool = mysql.createPool({
		host: host,
		user: user,
		password: password,
		database: db,
	}).promise();
	return newPool;
}

export { connection, pool, createPool };
