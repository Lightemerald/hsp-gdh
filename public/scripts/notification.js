// notifications
const notificationMenu = document.getElementById('notification-menu');
const notificationIcon = document.getElementById('notification-icon');

window.addEventListener('load', generateNotifications);
notificationIcon.addEventListener('click', generateNotifications);

function generateNotifications() {
	const notificationLoading = document.getElementById('notification-loading');
	notificationLoading.classList.remove('hidden');

	const notifications = [
	  	{ title: 'Notification 1', link: '#' },
	  	{ title: 'Notification 2', link: '#' },
	  	{ title: 'Notification 3', link: '#' },
	];

	const childElements = notificationMenu.querySelectorAll('li');
	childElements.forEach((child) => {
		notificationMenu.removeChild(child);
	});

	notifications.forEach(notification => {
	  	const listItem = document.createElement('li');
	  	const link = document.createElement('a');
	  	link.href = notification.link;
	  	link.textContent = notification.title;
	  	listItem.appendChild(link);
	  	notificationMenu.appendChild(listItem);
	});
	notificationLoading.classList.add('hidden');
}


// Notification block
let timeout;
notificationIcon.addEventListener('mouseover', showNotificationMenu);
notificationIcon.addEventListener('mouseout', hideNotificationMenu);
notificationMenu.addEventListener('mouseover', showNotificationMenu);
notificationMenu.addEventListener('mouseout', hideNotificationMenu);

function showNotificationMenu() {
	notificationMenu.style.display = 'block';
	clearTimeout(timeout);
}

function hideNotificationMenu() {
	timeout = setTimeout(() => {
		notificationMenu.style.display = 'none';
	}, 500);
}