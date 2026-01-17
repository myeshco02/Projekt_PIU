/**
 * @file src/features/brew-assistant/components/TimerView.js
 */

import { store } from '../../../core/Store.js';

export class TimerView {
    constructor(params, mainController) {
        this.params = params;
        this.mainController = mainController;
        this.container = document.getElementById('timer-view-container');
        
        this.timerInterval = null;
        this.startTime = null;
        this.elapsedTime = 0; // in ms
        this.isRunning = false;
        this.phase = params.preinfusion ? 'ready' : 'ready-normal'; // ready, preinfusion, brewing, paused, finished
        
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="timer-fullscreen">
                 <div class="view-header absolute-top">
                     <button class="icon-btn" id="exit-timer"><i class="fa-solid fa-xmark"></i></button>
                    <h2 class="page-title">Brewing ${this.params.method}</h2>
                 </div>

                 <div class="timer-circle-container">
                    <svg class="progress-ring" width="300" height="300">
                        <circle
                            class="progress-ring__background"
                            stroke="rgba(255,255,255,0.1)"
                            stroke-width="8"
                            fill="transparent"
                            r="140"
                            cx="150"
                            cy="150"
                        />
                        <circle
                            class="progress-ring__circle"
                            stroke="var(--color-primary-500)"
                            stroke-width="8"
                            fill="transparent"
                            r="140"
                            cx="150"
                            cy="150"
                        />
                    </svg>
                    <div class="timer-content-centered">
                        <div class="timer-phase" id="timer-phase-text">Gotowy</div>
                        <div class="timer-display" id="timer-value">00:00</div>
                    </div>
                 </div>
                 
                 <div class="brew-stats-mini" style="display:flex; gap: 2rem; margin-bottom: 2rem; text-align:center; color: var(--text-secondary);">
                    <div>
                        <div style="font-weight:700; color:var(--text-primary);">${this.params.dose}g</div>
                        <div style="font-size:0.8rem;">Kawa</div>
                    </div>
                    <div>
                        <div style="font-weight:700; color:var(--text-primary);">${this.params.water}ml</div>
                        <div style="font-size:0.8rem;">Woda</div>
                    </div>
                    <div>
                        <div style="font-weight:700; color:var(--text-primary);">${this.params.temp}°C</div>
                        <div style="font-size:0.8rem;">Temp</div>
                    </div>
                 </div>

                 <div class="timer-controls">
                     <button class="btn-circle-large btn-start" id="timer-action-btn">
                        <i class="fa-solid fa-play"></i>
                     </button>
                     <button class="btn-circle-large btn-stop" id="timer-stop-btn" style="display:none;">
                        <i class="fa-solid fa-stop"></i>
                     </button>
                 </div>
                 
                 <button class="btn-primary" id="finish-btn" style="margin-top: 2rem; display:none; padding: 1rem 3rem; font-size: 1.2rem;">
                    Zakończ i Zapisz
                 </button>
            </div>
        `;
        
        this.attachListeners();
    }

    attachListeners() {
        const actionBtn = this.container.querySelector('#timer-action-btn');
        const stopBtn = this.container.querySelector('#timer-stop-btn');
        const finishBtn = this.container.querySelector('#finish-btn');
        const exitBtn = this.container.querySelector('#exit-timer');

        actionBtn.addEventListener('click', () => this.handleAction());
        
        stopBtn.addEventListener('click', () => this.handleStop());
        
        finishBtn.addEventListener('click', () => this.finishBrew());

        exitBtn.addEventListener('click', () => {
             if (confirm('Anulować parzenie?')) {
                 this.destroy();
             }
        });
    }

    handleAction() {
        if (!this.isRunning) {
            // Start
            this.startTimer();
            this.container.querySelector('#timer-action-btn').innerHTML = '<i class="fa-solid fa-pause"></i>';
            this.container.querySelector('#exit-timer').style.display = 'none'; // Lock exit
        } else {
            // Pause isn't requested in spec, but good to have. Spec says "Start" -> "Preinfusion" -> "Normal".
            // Let's implement pause logic.
            this.pauseTimer();
            this.container.querySelector('#timer-action-btn').innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.container.querySelector('#timer-stop-btn').style.display = 'flex';
        
        if (this.phase === 'ready' && this.params.preinfusion) {
            this.phase = 'preinfusion';
            this.updatePhaseText('Preinfuzja');
            
            // Start Animation
            const circle = this.container.querySelector('.progress-ring__circle');
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            
            // 1. Set initial state (Full empty)
            circle.style.transition = 'none'; // Disable transition for reset
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = circumference; 
            
            // 2. Force reflow and start transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    circle.style.transition = 'stroke-dashoffset 30s linear';
                    circle.style.strokeDashoffset = '0'; // Go to full
                });
            });
            
        } else if (this.phase === 'preinfusion') {
            // Resume Animation
            const circle = this.container.querySelector('.progress-ring__circle');
            const remainingMs = 30000 - this.elapsedTime;
            
            if (circle && remainingMs > 0) {
                // Force reflow to ensure the "frozen" state is recognized as start point
                 requestAnimationFrame(() => {
                    circle.style.transition = `stroke-dashoffset ${remainingMs}ms linear`;
                    circle.style.strokeDashoffset = '0';
                 });
            }
        } else if (this.phase === 'ready-normal') {
            this.phase = 'brewing';
            this.updatePhaseText('Parzenie');
        }

        const startTimestamp = Date.now() - this.elapsedTime;
        
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Date.now() - startTimestamp;
            this.updateDisplay();
            
            // Preinfusion Logic (auto-switch after 30s)
            if (this.phase === 'preinfusion' && this.elapsedTime >= 30000) {
                 this.phase = 'brewing';
                 this.updatePhaseText('Parzenie');
                 
                 // Remove/Hide Ring
                 const circle = this.container.querySelector('.progress-ring');
                 if(circle) circle.style.opacity = '0';
                 // Sound beep?
            }
        }, 100);
    }

    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        
        // Freeze Animation
        const circle = this.container.querySelector('.progress-ring__circle');
        if (circle) {
           const computedStyle = window.getComputedStyle(circle);
           const currentOffset = computedStyle.getPropertyValue('stroke-dashoffset');
           
           circle.style.transition = 'none';
           circle.style.strokeDashoffset = currentOffset;
        }
    }

    handleStop() {
        this.pauseTimer();
        this.phase = 'finished';
        this.updatePhaseText('Zatrzymano');
        
        const actionBtn = this.container.querySelector('#timer-action-btn');
        const stopBtn = this.container.querySelector('#timer-stop-btn');
        const finishBtn = this.container.querySelector('#finish-btn');
        
        actionBtn.style.display = 'none';
        stopBtn.style.display = 'none';
        finishBtn.style.display = 'inline-block';
    }

    updateDisplay() {
        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        const formatted = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.container.querySelector('#timer-value').textContent = formatted;
        
        // Ms separate or just standard timer? Standard.
    }

    updatePhaseText(text) {
        this.container.querySelector('#timer-phase-text').textContent = text;
    }

    async finishBrew() {
        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        
        const logData = {
            coffeeId: this.params.coffeeId,
            timeSeconds: totalSeconds,
            method: this.params.method,
            dose: this.params.dose,
            yield: this.params.water, // Approximate yield = water used
            ratio: this.params.ratio,
            temp: this.params.temp,
            grinder: this.params.grinder,
            clicks: this.params.clicks,
            rating: 0, // Pending
            notes: ''
        };

        const logId = await store.addLog(logData);
        
        this.destroy();
        this.mainController.openLog(logId);
    }

    destroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.container.innerHTML = '';
    }
}
