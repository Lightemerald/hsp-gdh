const api = 'https://aostia.me/api';
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const verifyResetPasswordForm = document.getElementById('verifyResetPasswordForm');
const requestResetPasswordForm = document.getElementById('requestResetPasswordForm');

const home = document.getElementById('home');
const login = document.getElementById('login');
const register = document.getElementById('register');
const forgot = document.getElementById('forgotPassword');

function events() {
	document.querySelector('.toggleThemeBtn').addEventListener('click', toggleTheme); 
	document.querySelectorAll('.toggleForgotPasswordBtn').forEach(button => button.addEventListener('click', () => togglePage('forgotPassword')));
	document.querySelectorAll('.toggleRegisterBtn').forEach(button => button.addEventListener('click', () => togglePage('register')));
	document.querySelectorAll('.toggleLoginBtn').forEach(button => button.addEventListener('click', () => togglePage('login')));
	document.querySelectorAll('.toggleHomeBtn').forEach(button => button.addEventListener('click', () => togglePage('home')));
	document.querySelectorAll('.registerNextBtn').forEach(button => button.addEventListener('click', () => togglePage('registerNext')));
	document.querySelectorAll('.registerBackBtn').forEach(button => button.addEventListener('click', () => togglePage('registerBack')));
	document.querySelector('.hamburger-menu').addEventListener('click', () => {
		document.querySelector('.big-wrapper').classList.toggle('active');
	});
}

function togglePage(page) {
	if (page == 'home') {
		localStorage.setItem('page', 'home');
		transition(home, login, register, forgot, 'appear-transition', 'disintegrate-transition');
	}
	else if (page == 'login') {
		localStorage.setItem('page', 'login');
		transition(login, home, register, forgot, 'appear-transition', 'disintegrate-transition');
	}
	else if (page == 'register') {
		localStorage.setItem('page', 'register');
		transition(register, home, login, forgot, 'appear-transition', 'disintegrate-transition');
	}
	else if (page == 'registerNext') {
		document.getElementById('register-form1').classList.add('hidden');
		document.getElementById('register-next').classList.add('hidden');
		document.getElementById('register-form2').classList.remove('hidden');
		document.getElementById('register-btn-2').classList.add('flex');
		document.getElementById('register-btn-2').classList.remove('hidden');
	}
	else if (page == 'registerBack') {
		document.getElementById('register-form2').classList.add('hidden');
		document.getElementById('register-btn-2').classList.add('hidden');
		document.getElementById('register-btn-2').classList.remove('flex');
		document.getElementById('register-form1').classList.remove('hidden');
		document.getElementById('register-next').classList.remove('hidden');
	}
	else if (page == 'forgotPassword') {
		localStorage.setItem('page', 'forgotPassword');
		transition(forgot, home, login, register, 'appear-transition', 'disintegrate-transition');
	}
}

function transition(d1, d2, d3, d4, a1, a2) {
	d2.classList.add(a2);
	d3.classList.add(a2);
	d4.classList.add(a2);
	setTimeout(() => {
		d1.classList.replace('hidden', a1);
		d2.classList.replace(a2, 'hidden');
		d3.classList.replace(a2, 'hidden');
		d4.classList.replace(a2, 'hidden');
		setTimeout(() => {
			d1.classList.remove(a1);
		}, 950);
	}, 950);
}

function dbox(msg) {
	if (msg !== undefined) {
		document.getElementById('boxTxt').innerHTML = msg;
		document.getElementById('diag').classList.remove('hidden');
	}
	else {
		document.getElementById('diag').classList.add('hidden');
	}
}

window.onload = (event) => {
	events();
	togglePage(localStorage.getItem('page') || 'home');
	loginForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const { status, data } = await post(`${api}/users/login`, { usernameOrEmail: loginForm.elements['usernameOrEmail'].value, password: loginForm.elements['password'].value });

		if (status != 200) {
			dbox(`${data.message}`);
			console.error(data);
		}
		else {
			dbox('Login successful!\nRedirecting...');
			localStorage.setItem('jwt', data.JSON.token);
			setTimeout(() => {
				window.location.href = './dash.html';
			}, 950);
		}
	});

	registerForm.addEventListener('submit', async (event) => {
		event.preventDefault();

		const username = registerForm.elements['username'].value;
		const email = registerForm.elements['email'].value;
		const password = registerForm.elements['password'].value;
		const first_name = registerForm.elements['name'].value;
		const last_name = registerForm.elements['lastname'].value;
		const phone = registerForm.elements['phone'].value || 'None';

		const { status, data } = await post(`${api}/users/register`, { username: username, email: email, password: password, first_name: first_name, last_name: last_name, phone: phone });

		if (status != 200) {
			const data = await response.json();
			dbox(`${data.message}`);
			console.error(data);
		}
		else {
			localStorage.setItem('jwt', data.token);
			dbox('Successfully registered!');
			togglePage('login');
		}
	});

	requestResetPasswordForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const { status, data } = await post(`${api}/users/changepassword`, { usernameOrEmail: requestResetPasswordForm.elements['usernameOrEmail'].value });

		if (status != 200) {
			dbox(`${data.message}`);
			console.error(data);
		}
		else {
			dbox('Reset password email has been sent!');
			verifyResetPasswordForm.classList.remove('hidden');
			requestResetPasswordForm.classList.add('hidden');
		}
	});

	verifyResetPasswordForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const { status, data } = await get(`${api}/users/verify?c=${verifyResetPasswordForm.elements['code'].value}&u=${requestResetPasswordForm.elements['usernameOrEmail'].value}`);
		if (status != 200) {
			dbox(`${data.message}`);
			console.error(data);
		}
		else {
			dbox('Valid verification code!');
			resetPasswordForm.classList.remove('hidden');
			verifyResetPasswordForm.classList.add('hidden');
		}
	});
	
	resetPasswordForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const { status, data } = await patch(`${api}/users/changepassword`, { code: verifyResetPasswordForm.elements['code'].value, usernameOrEmail: requestResetPasswordForm.elements['usernameOrEmail'].value, password: resetPasswordForm.elements['password'].value });

		if (status != 200) {
			dbox(`${data.message}`);
			console.error(data);
		}
		else {
			dbox('Password successfully reset!');
			requestResetPasswordForm.classList.remove('hidden');
			resetPasswordForm.classList.add('hidden');
			togglePage('login');
		}
	});
};