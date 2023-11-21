/* eslint-disable no-undef */
import nodemailer from 'nodemailer';
import { random } from './random';
import { createPool } from './database';

const pool = createPool('localhost', 'root', '', 'postfixadmin');

const transporter = nodemailer.createTransport({
	host: process.env.SMTP,
	port: 465,
	secure: true,
	auth: {
		user: process.env.MAIL,
		pass: process.env.MAIL_PASS,
	},
});

async function createAddress(username, domain, password, name = '', backup_email = '', phone = '') {
	try {
		const hashedPassword = await Bun.password.hash(password, {
			type: Bun.password.argon2i,
			memoryCost: 2 ** 15,
			hashLength: 32,
			timeCost: 5,
		});
		const [result] = await pool.execute(
			'INSERT INTO `mailbox` (`username`, `password`, `name`, `maildir`, `quota`, `local_part`, `domain`, `created`, `modified`, `active`, `phone`, `email_other`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[ username, hashedPassword, name, `${domain}/${username}`, 0, username, domain, Date.now(), Date.now(), '1', phone, backup_email],
		);
		if (result.affectedRows === 0) {
			return false;
		}
		return true;
	}
	catch (error) {
		console.error(error);
		return false;
	}
}

function sendMail(email, head, body) {
	try {
		// setup email data
		const mailOptions = {
			from: `"AirJet" <${process.env.MAIL}>`,
			to: email,
			subject: head,
			text: body,
		};
		// send mail with defined transport object
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error);
			}
			else {
				console.log('Email sent: ' + info.response);
			}
		});
		return true;
	}
	catch (err) {
		return false;
	}
}

function sendVerification(email, userId) {
	try {
		const code = random(100000, 999999);
		if (sendMail(email, 'Your verification code for AirJet', `Verification code: ${code}\nLink: https://aostia.me/api/users/verify?u=${userId}&c=${code}`)) {
			return code;
		}
		else {
			return false;
		}
	}
	catch (err) {
		return false;
	}
}

function sendResetVerification(email, code = random(100000, 999999)) {
	try {
		if (sendMail(email, 'Your reset verification code for AirJet', `Verification code: ${code}`)) {
			return code;
		}
		else {
			return false;
		}
	}
	catch (err) {
		return false;
	}
}

export {
	sendMail,
	sendVerification,
	sendResetVerification,
	createAddress,
};