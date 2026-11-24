/**
 * Ambient Web Display - Clocks, Weather & Info Engine
 * Architectural, Analog, Flip, and Word Clocks with live weather
 */

class AmbientClockWeather {
    constructor() {
        this.clockStyle = 'minimal'; // minimal, analog, flip, words
        this.timeFormat = '12'; // 12 or 24
        this.showSeconds = true;
        this.tempUnit = 'celsius'; // celsius or fahrenheit
        this.showWeather = true;
        this.showQuotes = true;
        this.currentTemp = 21;
        this.currentCondition = 'Partly Cloudy';
        this.weatherIcon = 'partly-cloudy';
        this.cityName = 'Local Ambient';

        this.quotes = [
            "Simplicity is the ultimate sophistication.",
            "In the silence between breaths, the mind finds rest.",
            "Nature does not hurry, yet everything is accomplished.",
            "Peace is the result of retraining your mind to process life as it is.",
            "Light changes everything it touches.",
            "Stillness is where creativity and solutions to problems are found.",
            "Dwell in possibility.",
            "Calm mind brings inner strength and self-confidence."
        ];
        this.quoteIndex = 0;

        this.init();
    }

    init() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.fetchWeather();
        // Refresh weather every 15 minutes
        setInterval(() => this.fetchWeather(), 15 * 60 * 1000);
        // Rotate quotes every 90 seconds
        setInterval(() => this.rotateQuote(), 90 * 1000);
        this.rotateQuote();
    }

    setClockStyle(style) {
        this.clockStyle = style;
        document.querySelectorAll('.clock-view').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`clock-${style}`);
        if (target) target.classList.add('active');
        this.updateTime(true);
    }

    setTimeFormat(format) {
        this.timeFormat = format;
        this.updateTime(true);
    }

    toggleSeconds(show) {
        this.showSeconds = show;
        const secEls = document.querySelectorAll('.clock-seconds');
        secEls.forEach(el => el.style.display = show ? 'inline-block' : 'none');
    }

    setTempUnit(unit) {
        this.tempUnit = unit;
        this.renderWeather();
    }

    updateTime(force = false) {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const ampm = hours >= 12 ? 'PM' : 'AM';

        // 12h conversion
        let displayHours = hours;
        if (this.timeFormat === '12') {
            displayHours = hours % 12;
            displayHours = displayHours ? displayHours : 12; // 0 becomes 12
        }

        const strHours = String(displayHours).padStart(2, '0');
        const strMinutes = String(minutes).padStart(2, '0');
        const strSeconds = String(seconds).padStart(2, '0');

        // 1. Update Minimal Clock
        const elMinHours = document.getElementById('min-clock-hours');
        const elMinMins = document.getElementById('min-clock-minutes');
        const elMinSecs = document.getElementById('min-clock-seconds');
        const elMinAmpm = document.getElementById('min-clock-ampm');
        if (elMinHours) elMinHours.textContent = strHours;
        if (elMinMins) elMinMins.textContent = strMinutes;
        if (elMinSecs) elMinSecs.textContent = strSeconds;
        if (elMinAmpm) elMinAmpm.textContent = this.timeFormat === '12' ? ampm : '';

        // 2. Update Analog Clock
        const analogSec = document.getElementById('analog-second-hand');
        const analogMin = document.getElementById('analog-minute-hand');
        const analogHour = document.getElementById('analog-hour-hand');
        if (analogSec) {
            const secDeg = (seconds / 60) * 360;
            const minDeg = ((minutes + seconds / 60) / 60) * 360;
            const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;
            analogSec.style.transform = `rotate(${secDeg}deg)`;
            analogMin.style.transform = `rotate(${minDeg}deg)`;
            analogHour.style.transform = `rotate(${hourDeg}deg)`;
        }

        // 3. Update Flip Clock
        this.updateFlipCards(strHours, strMinutes, strSeconds, ampm);

        // 4. Update Word Clock
        this.updateWordClock(hours, minutes);

        // Date String Display
        const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        const dateStr = now.toLocaleDateString(undefined, dateOptions);
        document.querySelectorAll('.ambient-date-display').forEach(el => {
            el.textContent = dateStr;
        });
    }

    updateFlipCards(hours, minutes, seconds, ampm) {
        const hCard = document.getElementById('flip-hours');
        const mCard = document.getElementById('flip-minutes');
        const sCard = document.getElementById('flip-seconds');
        const ampmCard = document.getElementById('flip-ampm');

        if (hCard && hCard.dataset.val !== hours) {
            hCard.dataset.val = hours;
            hCard.querySelector('.flip-val').textContent = hours;
        }
        if (mCard && mCard.dataset.val !== minutes) {
            mCard.dataset.val = minutes;
            mCard.querySelector('.flip-val').textContent = minutes;
        }
        if (sCard && sCard.dataset.val !== seconds) {
            sCard.dataset.val = seconds;
            sCard.querySelector('.flip-val').textContent = seconds;
        }
        if (ampmCard) {
            ampmCard.textContent = this.timeFormat === '12' ? ampm : '';
        }
    }

    updateWordClock(h, m) {
        // Clear all active word highlights
        const wordsContainer = document.getElementById('clock-words');
        if (!wordsContainer) return;

        const words = wordsContainer.querySelectorAll('.word');
        words.forEach(w => w.classList.remove('lit'));

        // Always light "IT IS"
        this.lightWords(['W-IT', 'W-IS']);

        // Determine minutes approximation
        const hNames = ['TWELVE', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];
        let targetHour = h % 12;

        if (m >= 58 || m <= 2) {
            this.lightWords([`W-H-${hNames[targetHour]}`, 'W-OCLOCK']);
        } else if (m >= 3 && m <= 7) {
            this.lightWords(['W-FIVE', 'W-PAST', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 8 && m <= 12) {
            this.lightWords(['W-TEN', 'W-PAST', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 13 && m <= 17) {
            this.lightWords(['W-A', 'W-QUARTER', 'W-PAST', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 18 && m <= 22) {
            this.lightWords(['W-TWENTY', 'W-PAST', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 23 && m <= 27) {
            this.lightWords(['W-TWENTY', 'W-FIVE', 'W-PAST', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 28 && m <= 32) {
            this.lightWords(['W-HALF', 'W-PAST', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 33 && m <= 37) {
            targetHour = (targetHour + 1) % 12;
            this.lightWords(['W-TWENTY', 'W-FIVE', 'W-TO', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 38 && m <= 42) {
            targetHour = (targetHour + 1) % 12;
            this.lightWords(['W-TWENTY', 'W-TO', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 43 && m <= 47) {
            targetHour = (targetHour + 1) % 12;
            this.lightWords(['W-A', 'W-QUARTER', 'W-TO', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 48 && m <= 52) {
            targetHour = (targetHour + 1) % 12;
            this.lightWords(['W-TEN', 'W-TO', `W-H-${hNames[targetHour]}`]);
        } else if (m >= 53 && m <= 57) {
            targetHour = (targetHour + 1) % 12;
            this.lightWords(['W-FIVE', 'W-TO', `W-H-${hNames[targetHour]}`]);
        }
    }

    lightWords(ids) {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('lit');
        });
    }

    async rotateQuote() {
        const quoteEl = document.getElementById('ambient-quote');
        if (!quoteEl) return;

        quoteEl.style.opacity = '0';

        let newQuote = null;
        if (window.firebaseService && typeof window.firebaseService.generateZenWisdom === 'function') {
            try {
                const hour = new Date().getHours();
                const timeOfDay = hour < 12 ? 'morning' : (hour < 18 ? 'afternoon' : 'evening');
                newQuote = await window.firebaseService.generateZenWisdom(this.currentCondition, this.currentTemp, timeOfDay);
            } catch (e) {
                // Ignore and use fallback
            }
        }

        if (!newQuote) {
            this.quoteIndex = (this.quoteIndex + 1) % this.quotes.length;
            newQuote = this.quotes[this.quoteIndex];
        }

        setTimeout(() => {
            quoteEl.innerHTML = `“${newQuote}” <span class="ai-sparkle-pill" title="Generated with Firebase AI Logic (Gemini)">✨ AI</span>`;
            quoteEl.style.opacity = '0.85';
        }, 500);
    }

    async fetchWeather() {
        if (!navigator.geolocation) {
            this.renderWeather();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                    if (res.ok) {
                        const data = await res.json();
                        const weather = data.current_weather;
                        this.currentTemp = Math.round(weather.temperature);
                        this.mapWeatherCode(weather.weathercode);
                        this.cityName = 'Current Location';
                        this.renderWeather();
                    }
                } catch (e) {
                    this.renderWeather();
                }
            },
            () => {
                // Fallback simulation based on time of day
                const hours = new Date().getHours();
                this.currentTemp = (hours >= 11 && hours <= 16) ? 22 : 18;
                this.currentCondition = (hours >= 6 && hours <= 19) ? 'Clear Sky' : 'Starry Night';
                this.weatherIcon = (hours >= 6 && hours <= 19) ? 'sun' : 'moon';
                this.renderWeather();
            },
            { timeout: 5000 }
        );
    }

    mapWeatherCode(code) {
        if (code === 0) {
            this.currentCondition = 'Clear Sky';
            this.weatherIcon = 'sun';
        } else if (code >= 1 && code <= 3) {
            this.currentCondition = 'Partly Cloudy';
            this.weatherIcon = 'partly-cloudy';
        } else if (code >= 45 && code <= 48) {
            this.currentCondition = 'Foggy Mist';
            this.weatherIcon = 'fog';
        } else if (code >= 51 && code <= 67) {
            this.currentCondition = 'Gentle Rain';
            this.weatherIcon = 'rain';
        } else if (code >= 71 && code <= 77) {
            this.currentCondition = 'Light Snow';
            this.weatherIcon = 'snow';
        } else if (code >= 80 && code <= 82) {
            this.currentCondition = 'Rain Showers';
            this.weatherIcon = 'rain';
        } else if (code >= 95) {
            this.currentCondition = 'Thunderstorm';
            this.weatherIcon = 'thunder';
        } else {
            this.currentCondition = 'Pleasant';
            this.weatherIcon = 'sun';
        }
    }

    renderWeather() {
        let displayTemp = this.currentTemp;
        let unitSymbol = '°C';
        if (this.tempUnit === 'fahrenheit') {
            displayTemp = Math.round((this.currentTemp * 9/5) + 32);
            unitSymbol = '°F';
        }

        const elTemp = document.getElementById('weather-temp');
        const elCond = document.getElementById('weather-cond');
        const elCity = document.getElementById('weather-city');
        const elIcon = document.getElementById('weather-icon');

        if (elTemp) elTemp.textContent = `${displayTemp}${unitSymbol}`;
        if (elCond) elCond.textContent = this.currentCondition;
        if (elCity) elCity.textContent = this.cityName;
        if (elIcon) elIcon.innerHTML = this.getWeatherSvg(this.weatherIcon);
    }

    getWeatherSvg(type) {
        switch (type) {
            case 'sun':
                return `<svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
            case 'moon':
                return `<svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
            case 'rain':
                return `<svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`;
            case 'snow':
                return `<svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><line x1="8" y1="16" x2="8" y2="16.01"/><line x1="8" y1="20" x2="8" y2="20.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="12" y1="22" x2="12" y2="22.01"/><line x1="16" y1="16" x2="16" y2="16.01"/><line x1="16" y1="20" x2="16" y2="20.01"/></svg>`;
            case 'thunder':
                return `<svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
            case 'partly-cloudy':
            default:
                return `<svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><circle cx="12" cy="7" r="2"/></svg>`;
        }
    }
}

// Global clock singleton
window.ambientClock = null;
