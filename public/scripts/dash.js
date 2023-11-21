// exemple
const chartData = {
	labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
	datasets: [{
		label: 'Dataset 1',
		data: [12, 19, 3, 5, 2, 3, 9],
		backgroundColor: 'rgba(255, 99, 132, 0.2)',
		borderColor: 'rgba(255, 99, 132, 1)',
		borderWidth: 1,
	},
	{
		label: 'Dataset 2',
		data: [6, 12, 8, 2, 10, 5, 3],
		backgroundColor: 'rgba(54, 162, 235, 0.2)',
		borderColor: 'rgba(54, 162, 235, 1)',
		borderWidth: 1,
	},
	],
};

const api = 'https://aostia.me/api/'

const cookieValue = document.cookie
.split('; ')
.find(row => row.startsWith('token='))
?.split('=')[1];

const token = cookieValue ? cookieValue : localStorage.getItem('jwt');
if (!token) {
	toastNotifications('error', 'Missing token' + token);
	setTimeout(() => {
		window.location.href = './index.html';
	}, 950);
}

fetchPage();

document.querySelectorAll('.sidebarBtn').forEach((btn) => {
	btn.addEventListener('click', (event) => {
	  event.preventDefault();
	  const url = btn.getAttribute('href');
	  window.history.pushState({}, '', url);
	  fetchPage();
	});
});

async function fetchPage() {
  	const childElements = document.querySelector('.tiles-container').querySelectorAll('div');
  	childElements.forEach((child) => {
	  	document.querySelector('.tiles-container').removeChild(child);
  	});
  	const params = new URLSearchParams(window.location.search);
	const type = params.get('page');
	if (!type) {
		try {
			const airlines = await get(api + 'airlines', token);
			const airplanes = await get(api + 'airplanes', token);
			const airports = await get(api + 'airports', token);
			const flights = await get(api + 'flights', token);
			const pilots = await get(api + 'pilots', token);
			const seats = await get(api + 'seats', token);
			if (airlines.status == 200) {
				renderTable(airlines.data.JSON);
		  	}
			else {
				toastNotifications('error', data.message);
		  	}
			if (airplanes.status == 200) {
				renderTable(airplanes.data.JSON);
		  	}
			else {
				toastNotifications('error', data.message);
		  	}
			if (airports.status == 200) {
				renderTable(airports.data.JSON);
		  	}
			else {
				toastNotifications('error', data.message);
		  	}
			if (flights.status == 200) {
				renderTable(flights.data.JSON);
		  	}
			else {
				toastNotifications('error', data.message);
		  	}
			if (pilots.status == 200) {
				renderTable(pilots.data.JSON);
		  	}
			else {
				toastNotifications('error', data.message);
		  	}
			if (seats.status == 200) {
				renderTable(seats.data.JSON);
		  	}
			else {
				toastNotifications('error', data.message);
		  	}
			addEventTiles();
		}
		catch (err) {
			console.error(error);
			toastNotifications('error', 'Failed to fetch data');
		}
	}
	else {
		try {
			let endpoint = api + type;
			if (type === 'profile') {
				  endpoint = api + 'users/me';
			}
			
			const { status, data } = await get(endpoint, token);
		  
			if (status == 200 && type === 'profile') {
				renderProfile(data.JSON);
		  	} else if (status == 200) {
				  renderTable(data.JSON);
				  addEventTiles();
			} else {
				  toastNotifications('error', data.message);
			}
		} catch (error) {
			console.error(error);
			toastNotifications('error', 'Failed to fetch data');
		}
	}
}

function renderProfile(userData) {
	const table = document.createElement('table');

	for (const [key, value] of Object.entries(userData)) {
	  	const row = document.createElement('tr');
	  	const dataName = document.createElement('td');
	  	const dataValue = document.createElement('td');
		const editCell = document.createElement('td');
  
	  	dataName.textContent = key;
	  	dataValue.textContent = value;
  
    	const editButton = document.createElement('button');
    	editButton.textContent = 'Edit';
    	editButton.addEventListener('click', async () => {
      		console.log('Edit button clicked for row:', key);
			const newValue = prompt(`Enter new value for ${key}:`);
			if (newValue !== null) {
				const { status, data } = await patch(api + 'users/', {type:key,value:newValue}, token);
				if (status == 200) {
					fetchPage();
				}
				else {
					toastNotifications('error', data.message);
				}
			}
    	});
    	editCell.appendChild(editButton);
    	
	  	row.appendChild(dataName);
	  	row.appendChild(dataValue);
		row.appendChild(editCell);
	  	table.appendChild(row);
	}
  
	const tableTile = createTile('Profile', table);
	document.querySelector('.tiles-container').appendChild(tableTile);
  }
  

function renderTable(tableData) {
	const table = document.createElement('table');
	for (const data of tableData) {
		const row = document.createElement('tr');
		for (const prop in data) {
			const cell = document.createElement('td');
			cell.innerText = data[prop];
			row.appendChild(cell);
		}
		table.appendChild(row);
	}

	const tableTile = createTile('Table', table);
	document.querySelector('.tiles-container').appendChild(tableTile);
}

function renderList(listData) {
	const list = document.createElement('ul');
	for (const data of listData) {
		const item = document.createElement('li');
		const fields = [];
		for (const key in data) {
			fields.push(data[key]);
		}
		item.innerText = fields.join(', ');
		list.appendChild(item);
	}
	const listTile = createTile('List', list);
	document.querySelector('.tiles-container').appendChild(listTile);
}

function renderChart(chartData) {
	const canvas = document.createElement('canvas');
	canvas.id = 'chart';
	canvas.width = '1920';
	canvas.height = '1080';
	const ctx = canvas.getContext('2d');
	const chart = new Chart(ctx, {
		type: 'bar',
		data: chartData,
		options: {
			scales: {
				y: {
					ticks: {
						beginAtZero: true,
					},
				},
			},
		},
		maintainAspectRatio: false,
	});
	const chartTile = createTile('Chart', canvas);
	document.querySelector('.tiles-container').appendChild(chartTile);
}

function createTile(title, content) {
	const tile = document.createElement('div');
	tile.classList.add('tile');
	const header = document.createElement('h2');
	header.innerText = title;
	tile.appendChild(header);
	tile.appendChild(content);
	return tile;
}

function addEventTiles() {
	const tiles = document.querySelectorAll('.tile');
	for (const tile of tiles) {
		tile.addEventListener('click', () => {
			if (!tile.classList.contains('fullscreen')) {
				tile.classList.add('fullscreen');
			}
			else {
				tile.classList.remove('fullscreen');
			}
		});
	}
}

// toast
function toastNotifications(type, msg) {
	const toast = document.getElementById('toast');
	if (type == 'success') {
		toast.innerHTML = `<div class="checkicon success"> <i class="fa fa-check-square"> ${msg}</i></div>`;
	}
	else if (type == 'error') {
		toast.innerHTML = `<div class="checkicon error"> <i class="fa fa-minus-square"> ${msg}</i></div>`;
	}
	else {
		toast.innerHTML = msg;
	}
	toast.className = 'show';
	setTimeout(function() {
		toast.className = toast.className.replace('show', '');
	}, 3000);
}