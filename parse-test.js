// import { parse } from 'node-html-parser';
// import fetch from 'node-fetch';
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const parser = require('node-html-parser');
// const fetch = require("node-fetch");
const fs = require('fs').promises;

const baseUrl = 'https://horoscopes.rambler.ru/'
const currentData = new Date();

const formatData = () => {
	return `${currentData.getFullYear()}${currentData.getMonth()}${currentData.getDate()}`;
}

const downloadPage = async (sign) => {
	if (await isFileExists(sign)) {
		return;
	}
	try {
		const response = await fetch(baseUrl + sign);
		const body = await response.text();
		await fs.writeFile(`./tmp/${sign}_${formatData()}.html`, body);
		console.log(`Download ${sign} completed`);
	} catch (err) {
		return console.log(err);
	}
}

const isFileExists = (sign) => {
	return fs.access(`./tmp/${sign}_${formatData()}.html`, fs.constants.F_OK)
		.then(() => true)
		.catch(() => false);
}

const parseSign = async (sign) => {
	try {
		const data = await fs.readFile(`./tmp/${sign}_${formatData()}.html`, {encoding: 'utf-8'});
		let root = parser.parse(data);
		const horoscopeText = root.querySelector('.mtZOt').text;

		console.log(horoscopeText);

	} catch (err) {
		console.log(err);
	}
}

const main = async () => {
	await downloadPage("scorpio");
	await parseSign("scorpio");
}

main();
