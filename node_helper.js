/* MMM-horoscope
 * Node Helper
 *
 * By morozgrafix https://github.com/vshakhlin/MMM-horoscope
 *
 * License: MIT
 *
 * Based on https://github.com/fewieden/MMM-soccer/blob/master/node_helper.js
 *
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const NodeHelper = require("node_helper");
const fs = require('fs').promises;
const parser = require('node-html-parser');

const baseUrl = 'https://horoscopes.rambler.ru/'

module.exports = NodeHelper.create({
	// subclass start method
	start: () => {
		console.log("Starting NodeHelper for " + this.name + "module.");
	},

	// subclass socketNotificationReceived method
	socketNotificationReceived: async function (notification, payload) {
		if (notification === "GET_HOROSCOPE_DATA") {
			await this.proccess(payload);
		}
	},

	proccess: async function (payload) {
		const result = {};
		for (const sign of payload.signs) {
			await this.downloadPage(sign, payload.date);
			result[sign] = await this.parseSign(sign, payload.date);
		}
		this.sendSocketNotification("HOROSCOPE_DATA", result);
	},

	formatPathWithData: function (sign, date) {
		return `./tmp/${sign}_${date}.html` ;
	},

	downloadPage: async function (sign, date){
		if (await this.isFileExists(sign, date)) {
			return;
		}
		try {
			const response = await fetch(baseUrl + sign);
			const body = await response.text();
			await fs.writeFile(this.formatPathWithData(sign, date), body);
			console.log(`Download ${sign} completed`);
		} catch (err) {
			return console.log(err);
		}
	},

	parseSign: async function (sign, date){
		try {
			console.log(`Parse ${sign} started`);
			const data = await fs.readFile(this.formatPathWithData(sign, date), {encoding: 'utf-8'});
			let root = parser.parse(data);
			console.log(`Parse ${sign} completed`);
			return root.querySelector('.mtZOt').text;
		} catch (err) {
			console.log(err);
		}
	},

	isFileExists: function (sign, date) {
		return fs.access(this.formatPathWithData(sign, date), fs.constants.F_OK)
			.then(() => true)
			.catch(() => false);
	}
});
