import dns from 'dns';

export function isEmailDomainValid(email) {
	const domain = email.split('@')[1];
	return new Promise((resolve, reject) => {
		dns.lookup(domain, (err, address) => {
			if (err) {
				reject(err);
			}
			else {
				const isIPAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(address);
				resolve(isIPAddress);
			}
		});
	});
}

export function isValidEmail(email) {
	const emailRegex = /\S+@\S+\.\S+/;
	return emailRegex.test(email);
}

export function isNumber(x) {
	return /^-?[\d.]+(?:e-?\d+)?$/.test(x);
}