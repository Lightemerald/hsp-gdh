/* eslint-disable no-undef */
function checkNavTheme() {
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { return true; }
	else { return false; }
}
let dark = (localStorage.getItem('dark') == 'false') ? false : checkNavTheme();
if (!dark) {
	document.querySelector('.big-wrapper').classList.add('light');
}
else {
	document.querySelector('.big-wrapper').classList.add('dark');
}

function toggleTheme() {
	dark = !dark;
	localStorage.setItem('dark', dark);
	setTheme(dark);
}

function setTheme() {
	const wrapper = document.querySelector('.big-wrapper');
	const btn = document.getElementById('toggle-theme');
	btn.setAttribute('disabled', 'disabled');
	setTimeout(() => {
		if (dark) {
			wrapper.classList.replace('light', 'dark');
		}
		else {
			wrapper.classList.replace('dark', 'light');
		}
		if (window.location.pathname.split('/').pop() == 'index.html') {
			wrapper.classList.add('appear-transition');
			setTimeout(() => {
				wrapper.classList.remove('appear-transition');
				btn.removeAttribute('disabled');
			}, 1500);
		}
		else {
			btn.removeAttribute('disabled');
		}
	}, 200);
}

document.querySelector('.toggleThemeBtn').addEventListener('click', toggleTheme);