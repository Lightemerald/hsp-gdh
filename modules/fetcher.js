import fetch from 'node-fetch';
import { error } from './log';

async function get(url, token) {
	const options = {
		method: 'GET',
		headers: { 'Content-Type': 'application/json', authorization: `${token}` },
	};

	return await fetch(url, options)
		.then(res => res.json())
		.then(json => {
			return json;
		})
		.catch(err => error(err));
}

async function post(url, body, token) {
	const options = {
		method: 'POST',
		mode: 'cors',
		headers: { 'Content-Type': 'application/json', authorization: `${token}` },
		body: JSON.stringify(body),
	};

	return await fetch(url, options)
		.then(res => res.json())
		.then(json => {
			return json;
		})
		.catch(err => error(err));
}

async function patch(url, body, token) {
	const options = {
		method: 'PATCH',
		mode: 'cors',
		headers: { 'Content-Type': 'application/json', authorization: `${token}` },
		body: JSON.stringify(body),
	};

	return await fetch(url, options)
		.then(res => res.json())
		.then(json => {
			return json;
		})
		.catch(err => error(err));
}

async function put(url, body, token) {
	const options = {
		method: 'PUT',
		mode: 'cors',
		headers: { 'Content-Type': 'application/json', authorization: `${token}` },
		body: JSON.stringify(body),
	};

	return await fetch(url, options)
		.then(res => res.json())
		.then(json => {
			return json;
		})
		.catch(err => error(err));
}

export {
	get,
	post,
	patch,
	put,
};