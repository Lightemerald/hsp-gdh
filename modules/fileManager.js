import fs from 'fs';
import download from 'download';
import random from './random';

function fileExist(path) {
	try {
		fs.readFileSync(path);
		return true;
	}
	catch (err) {
		return false;
	}
}

function fileDelete(path) {
	try {
		fs.unlinkSync(path);
		return true;
	}
	catch (err) {
		return false;
	}
}

function fileDownload(url, name) {
	try {
		download(url, '../cdn/images/', { filename: name });
		return true;
	}
	catch (err) {
		return false;
	}
}

function folderExist(path) {
	try {
		if (fs.existsSync(path)) {
			return true;
		}
		else {
			return false;
		}
	}
	catch (err) {
		return false;
	}
}

function getFilesFromFolder(path) {
	try {
		return fs.readdirSync(path);
	}
	catch (err) {
		return false;
	}
}

function randomFileFromFolder(path) {
	try {
		if (getFilesFromFolder(path)) {
			return random.random(0, getFilesFromFolder(path).length);
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
	fileExist,
	fileDelete,
	fileDownload,
	folderExist,
	getFilesFromFolder,
	randomFileFromFolder,
};
