Module.register("MMM-horoscope",{
	defaults: {
		signs: ["aries"],
		maxWidth: "400px", // maximum width of the module in px, %, em
		updateInterval: 1 * 60 * 60 * 1000, // updates every hour
		timeShift: 5 * 60 * 60 * 1000, // shift clock in milliseconds to start showing next day horoscope at 7pm (24 - 19 = 5)
		useTextIcon: true,
		initialLoadDelay: 0,
		animationSpeed: 2000,
		nextSignDelay: 60000,
		zodiacTable: {
			"aries": {
				"signId": "ari",
				"signName": "Овен",
				"range": "3/21-4/19",
				"unicodeChar": "♈︎"
			},
			"taurus": {
				"signId": "tau",
				"signName": "Телец",
				"range": "4/20-5/20",
				"unicodeChar": "♉︎"
			},
			"gemini": {
				"signId": "gem",
				"signName": "Близнецы",
				"range": "5/21-6/21",
				"unicodeChar": "♊︎"
			},
			"cancer": {
				"signId": "can",
				"signName": "Рак",
				"range": "6/22-7/22",
				"unicodeChar": "♋︎"
			},
			"leo": {
				"signId": "leo",
				"signName": "Лев",
				"range": "7/23-8/22",
				"unicodeChar": "♌︎"
			},
			"virgo": {
				"signId": "vir",
				"signName": "Дева",
				"range": "8/23-9/22",
				"unicodeChar": "♍︎"
			},
			"libra": {
				"signId": "lib",
				"signName": "Весы",
				"range": "9/23-10/22",
				"unicodeChar": "♎︎"
			},
			"scorpio": {
				"signId": "sco",
				"signName": "Скорпион",
				"range": "10/23-11/21",
				"unicodeChar": "♏︎"
			},
			"sagittarius": {
				"signId": "sag",
				"signName": "Стрелец",
				"range": "11/22-12/21",
				"unicodeChar": "♐︎"
			},
			"capricorn": {
				"signId": "cap",
				"signName": "Козерог",
				"range": "12/22-1/19",
				"unicodeChar": "♑︎"
			},
			"aquarius": {
				"signId": "aqu",
				"signName": "Водолей",
				"range": "1/20-2/18",
				"unicodeChar": "♒︎"
			},
			"pisces": {
				"signId": "pis",
				"signName": "Рыба",
				"range": "2/19-3/20",
				"unicodeChar": "♓︎"
			}
		},
		debug: false
	},

	getStyles: function() {
		return ["MMM-horoscope.css"];
	},

	getScripts: function() {
		return [
			"moment.js"
		];
	},

	start: function() {
		Log.info("Starting module: " + this.name);
		if (this.config.debug) {
			this.config.updateInterval = 60 * 1000; // update very 1 minute for debug
		}
		// just in case someone puts mixed case in their config files
		this.currentIndex = 0;
		this.sign = null;
		this.signText = null;
		this.horoscopeText = null;
		this.horoscpeDate = null;
		// this.scheduleUpdate(this.config.initialLoadDelay);
		this.updateHoroscope();
		setInterval(() => {
			this.updateHoroscope();
		}, this.config.updateInterval);

		setInterval(() => {
			this.nextProcessHoroscope();
		}, this.config.nextSignDelay)
	},

	updateHoroscope: function() {
		this.date = new Date();
		this.sendSocketNotification("GET_HOROSCOPE_DATA", { signs: this.config.signs, date: moment(this.date).add(this.config.timeShift, "milliseconds").format("YYYYMMDD") });
	},


	// Subclass socketNotificationReceived method.
	socketNotificationReceived: function(notification, payload){
		if(notification === "HOROSCOPE_DATA" && payload != null){
			this.horoscopeData = payload;
			this.loaded = true;
			this.nextProcessHoroscope();
		} else {
			this.processHoroscopeError("Unable to get horoscope from API. Please check the logs.");
		}
	},

	nextProcessHoroscope: function() {
		this.currentIndex++;
		if (this.currentIndex >= this.config.signs.length) {
			this.currentIndex = 0;
		}
		this.processHoroscope();
	},

	processHoroscope: function() {
		// const regex = /<a.*\/a>/g;
		// const subst = "";
		if (!this.horoscopeData)
			return;

		const sign = this.config.signs[this.currentIndex];
		const dataText = this.horoscopeData[sign];
		this.sign = this.config.zodiacTable[sign]["unicodeChar"];
		this.signText = this.config.zodiacTable[sign]["signName"];
		this.horoscopeText = dataText;
		this.horoscopeDate = moment().format("YYYYMMDD") ;

		this.updateDom(this.config.animationSpeed);
		// this.scheduleUpdate();

	},

	processHoroscopeError: function(error) {
		this.loaded = true;
		this.error = true;
		this.updateDom(this.config.animationSpeed);
		Log.error("Process Horoscope Error: ", error);
	},


	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.className = "horoscope-wrapper"
		wrapper.style["max-width"] = this.config.maxWidth;

		if (this.config.signs.length === 0) {
			wrapper.innerHTML = "Please set the correct Zodiac <i>sign</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING"); // "Aligning Stars...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.error) {
			wrapper.innerHTML = this.name + ": Something went wrong. Please check logs.";
			wrapper.className = "bright light small";
			return wrapper;
		}

		var horoscopeTop = document.createElement("div");
		horoscopeTop.className = "horoscope-top";

		var zodiacIcon = document.createElement("div");
		if (this.config.useTextIcon) {
			zodiacIcon.className = "zodiac-text-icon";
			zodiacIcon.innerHTML = this.sign;
		} else {
			// zodiacIcon.className = "zodiac-icon " + this.config.sign;
		}

		var horoscopeTitle = document.createElement("div");
		horoscopeTitle.className = "horoscope-title align-right";

		var zodiacSignText = document.createElement("div");
		zodiacSignText.className = "zodiac-sign-text medium";
		zodiacSignText.innerHTML = this.signText;

		var horoscopeDate = document.createElement("div");
		horoscopeDate.className = "horoscope-date xsmall";
		horoscopeDate.innerHTML = this.translate("HOROSCOPE") + moment(this.horoscopeDate).format("LL");

		horoscopeTitle.appendChild(zodiacSignText);
		horoscopeTitle.appendChild(horoscopeDate);

		horoscopeTop.appendChild(zodiacIcon);
		horoscopeTop.appendChild(horoscopeTitle);

		wrapper.appendChild(horoscopeTop);

		var horoscopeText = document.createElement("div");
		horoscopeText.className = "horoscope-text small";
		horoscopeText.innerHTML = this.horoscopeText;
		wrapper.appendChild(horoscopeText);

		return wrapper;
	},

	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.updateHoroscope();
		}, nextLoad);
	},
});
