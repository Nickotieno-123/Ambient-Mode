/**
 * Ambient Web Display - Laptop & Desk Mode Engine
 * Focus timer (Pomodoro), Live Battery API, Daily Priorities, and Battery Saver
 */

class LaptopDeskEngine {
    constructor() {
        this.deviceMode = 'laptop'; // 'laptop' or 'tv'
        this.batteryLevel = null;
        this.isCharging = false;
        this.batterySaverEnabled = false;

        // Pomodoro / Focus Timer State
        this.focusTimer = null;
        this.focusTimeRemaining = 25 * 60; // 25 minutes in seconds
        this.focusTimerRunning = false;
        this.focusMode = 'work'; // 'work' (25m), 'short_break' (5m), 'long_break' (15m)

        // Daily Priorities / Scratchpad
        this.tasks = JSON.parse(localStorage.getItem('ambient_laptop_tasks') || '[]');
        if (this.tasks.length === 0) {
            this.tasks = [
                { id: 1, text: "Deep work session: core focus", done: false },
                { id: 2, text: "Review key goals & notes", done: false },
                { id: 3, text: "Take mindful screen break", done: false }
            ];
        }

        this.init();
    }

    init() {
        this.initBatteryAPI();
        this.initPomodoro();
        this.initTasks();
    }

    setDeviceMode(mode) {
        this.deviceMode = mode;
        const stage = document.getElementById('ambient-stage');
        const modeBtn = document.getElementById('btn-device-toggle');
        
        if (mode === 'laptop') {
            stage.classList.add('mode-laptop');
            stage.classList.remove('mode-tv');
            if (modeBtn) modeBtn.innerHTML = this.getLaptopModeIcon() + '<span>Laptop Mode</span>';
        } else {
            stage.classList.add('mode-tv');
            stage.classList.remove('mode-laptop');
            if (modeBtn) modeBtn.innerHTML = this.getTvModeIcon() + '<span>TV Mode</span>';
        }
        localStorage.setItem('ambient_device_mode', mode);
    }

    toggleDeviceMode() {
        const nextMode = this.deviceMode === 'laptop' ? 'tv' : 'laptop';
        this.setDeviceMode(nextMode);
    }

    getLaptopModeIcon() {
        return `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 20h20"/></svg>`;
    }

    getTvModeIcon() {
        return `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" stroke-width="2"/><polyline points="17 2 12 7 7 2" stroke-width="2"/></svg>`;
    }

    // ==========================================
    // 1. BATTERY STATUS & BATTERY SAVER
    // ==========================================
    async initBatteryAPI() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                this.updateBatteryStatus(battery);

                battery.addEventListener('levelchange', () => this.updateBatteryStatus(battery));
                battery.addEventListener('chargingchange', () => this.updateBatteryStatus(battery));
            } catch (e) {
                this.renderBatteryFallback();
            }
        } else {
            this.renderBatteryFallback();
        }
    }

    updateBatteryStatus(battery) {
        this.batteryLevel = Math.round(battery.level * 100);
        this.isCharging = battery.charging;
        this.renderBatteryUI();

        // Auto Battery Saver: throttle canvas animation to 30fps if unplugged and low battery
        if (!this.isCharging && this.batteryLevel <= 20) {
            this.enableBatterySaver(true);
        }
    }

    renderBatteryFallback() {
        this.batteryLevel = 85;
        this.isCharging = true;
        this.renderBatteryUI();
    }

    renderBatteryUI() {
        const badge = document.getElementById('laptop-battery-badge');
        const textEl = document.getElementById('laptop-battery-pct');
        const iconEl = document.getElementById('laptop-battery-icon');
        if (!badge) return;

        badge.style.display = 'flex';
        if (textEl) textEl.textContent = `${this.batteryLevel}%`;

        if (iconEl) {
            if (this.isCharging) {
                iconEl.innerHTML = `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`;
            } else if (this.batteryLevel <= 20) {
                iconEl.innerHTML = `<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="16" height="10" rx="2" stroke-width="2"/><line x1="20" y1="11" x2="20" y2="13" stroke-width="2"/></svg>`;
            } else {
                iconEl.innerHTML = `<svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="16" height="10" rx="2" stroke-width="2"/><line x1="20" y1="11" x2="20" y2="13" stroke-width="2"/></svg>`;
            }
        }
    }

    enableBatterySaver(enable) {
        this.batterySaverEnabled = enable;
        const banner = document.getElementById('battery-saver-indicator');
        if (banner) {
            banner.style.display = enable ? 'inline-flex' : 'none';
        }
    }

    // ==========================================
    // 2. FOCUS & POMODORO DESK TIMER
    // ==========================================
    initPomodoro() {
        this.renderPomodoroUI();

        const btnToggle = document.getElementById('btn-pomodoro-toggle');
        const btnReset = document.getElementById('btn-pomodoro-reset');
        const modeButtons = document.querySelectorAll('.pomodoro-mode-tab');

        if (btnToggle) {
            btnToggle.addEventListener('click', () => this.togglePomodoro());
        }
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetPomodoro());
        }
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setPomodoroDuration(btn.dataset.mode);
            });
        });
    }

    setPomodoroDuration(mode) {
        this.pausePomodoro();
        this.focusMode = mode;
        if (mode === 'work') this.focusTimeRemaining = 25 * 60;
        else if (mode === 'short_break') this.focusTimeRemaining = 5 * 60;
        else if (mode === 'long_break') this.focusTimeRemaining = 15 * 60;
        this.renderPomodoroUI();
    }

    togglePomodoro() {
        if (this.focusTimerRunning) {
            this.pausePomodoro();
        } else {
            this.startPomodoro();
        }
    }

    startPomodoro() {
        this.focusTimerRunning = true;
        this.updatePomodoroButton(true);

        this.focusTimer = setInterval(() => {
            if (this.focusTimeRemaining > 0) {
                this.focusTimeRemaining--;
                this.renderPomodoroUI();
            } else {
                this.onPomodoroComplete();
            }
        }, 1000);
    }

    pausePomodoro() {
        this.focusTimerRunning = false;
        clearInterval(this.focusTimer);
        this.focusTimer = null;
        this.updatePomodoroButton(false);
    }

    resetPomodoro() {
        this.pausePomodoro();
        this.setPomodoroDuration(this.focusMode);
    }

    onPomodoroComplete() {
        this.pausePomodoro();
        // Play notification chime using audio engine
        if (window.ambientAudio && window.ambientAudio.playBirdChirp) {
            window.ambientAudio.playBirdChirp();
        }
        alert(this.focusMode === 'work' ? "Focus session complete! Time for a short break." : "Break is over! Ready to focus?");
        this.resetPomodoro();
    }

    renderPomodoroUI() {
        const mins = Math.floor(this.focusTimeRemaining / 60);
        const secs = this.focusTimeRemaining % 60;
        const strTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const timerDisplay = document.getElementById('pomodoro-digits');
        if (timerDisplay) timerDisplay.textContent = strTime;
    }

    updatePomodoroButton(isRunning) {
        const btn = document.getElementById('btn-pomodoro-toggle');
        if (!btn) return;
        btn.textContent = isRunning ? "Pause" : "Start Focus";
        btn.classList.toggle('running', isRunning);
    }

    // ==========================================
    // 3. DAILY PRIORITIES & DESK SCRATCHPAD
    // ==========================================
    initTasks() {
        this.renderTasks();

        const input = document.getElementById('new-task-input');
        const addBtn = document.getElementById('btn-add-task');

        if (input && addBtn) {
            const handleAdd = () => {
                const text = input.value.trim();
                if (text) {
                    this.addTask(text);
                    input.value = '';
                }
            };
            addBtn.addEventListener('click', handleAdd);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleAdd();
            });
        }
    }

    addTask(text) {
        const newTask = {
            id: Date.now(),
            text: text,
            done: false
        };
        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
        this.saveTasks();
        this.renderTasks();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
    }

    saveTasks() {
        localStorage.setItem('ambient_laptop_tasks', JSON.stringify(this.tasks));
    }

    renderTasks() {
        const listEl = document.getElementById('desk-tasks-list');
        if (!listEl) return;

        listEl.innerHTML = '';
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `desk-task-item ${task.done ? 'completed' : ''}`;

            li.innerHTML = `
                <label class="task-checkbox-label">
                    <input type="checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}">
                    <span class="custom-checkbox"></span>
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                </label>
                <button class="btn-delete-task" data-id="${task.id}" title="Remove">&times;</button>
            `;

            li.querySelector('input').addEventListener('change', () => this.toggleTask(task.id));
            li.querySelector('.btn-delete-task').addEventListener('click', () => this.deleteTask(task.id));

            listEl.appendChild(li);
        });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Global laptop engine singleton
window.ambientLaptop = null;
