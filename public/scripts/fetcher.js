async function get(url, token) {

	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token}`
		},
	});

	const data = await response.json();
	return { status: response.status, data: data };
}

async function post(url, json, token) {

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token}`
		},
		body: JSON.stringify(json),
	});

	const data = await response.json();
	return { status: response.status, data: data };
}

async function patch(url, json, token) {

	const response = await fetch(url, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token}`
		},
		body: JSON.stringify(json),
	});

	const data = await response.json();
	return { status: response.status, data: data };
}

async function put(url, json, token) {

	const response = await fetch(url, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token}`
		},
		body: JSON.stringify(json),
	});

	const data = await response.json();
	return { status: response.status, data: data };
}