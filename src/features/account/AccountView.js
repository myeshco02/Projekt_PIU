/**
 * @file src/features/account/AccountView.js
 * @description Account section with profile, stats, and settings
 */

import { store } from '../../core/Store.js';

export class AccountView {
    constructor() {
        this.container = document.getElementById('account-view');
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const auth = JSON.parse(localStorage.getItem('dialin_auth') || '{}');
        const settings = store.state.userSettings;

        this.container.innerHTML = `
            <div class="view-container">
                <!-- Profile Card -->
                <div class="account-section">
                    <div class="profile-card">
                        <div class="profile-info">
                            <h2>${auth.email || 'Demo User'}</h2>
                            <p class="profile-meta">Kawa Enthusiast • Od 2024</p>
                        </div>
                    </div>
                </div>

                <!-- Stats Section -->
                <div class="account-section">
                    <h3 class="section-label">Statystyki Parzeń</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">23</div>
                            <div class="stat-label">Parzeń w tym miesiącu</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">5</div>
                            <div class="stat-label">Aktywnych kaw</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">8.6</div>
                            <div class="stat-label">Średnia ocena</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">7</div>
                            <div class="stat-label">Dni z rzędu</div>
                        </div>
                    </div>
                </div>

                <!-- Settings Section -->
                <div class="account-section">
                    <h3 class="section-label">Ustawienia</h3>
                    
                    <!-- Theme Settings -->
                    <div class="settings-card">
                        <div class="setting-header">
                            <div>
                                <h4>Kolor akcentu</h4>
                                <p class="setting-desc">Dostosuj kolorystykę aplikacji</p>
                            </div>
                        </div>
                        <div class="setting-control">
                            <div class="color-picker-grid">
                                <button class="color-option active" data-color="emerald" style="background: #10b981;" title="Emerald (Domyślny)"></button>
                                <button class="color-option" data-color="purple" style="background: #a855f7;" title="Purple"></button>
                                <button class="color-option" data-color="blue" style="background: #3b82f6;" title="Blue"></button>
                                <button class="color-option" data-color="orange" style="background: #f97316;" title="Orange"></button>
                                <button class="color-option" data-color="pink" style="background: #ec4899;" title="Pink"></button>
                                <button class="color-option" data-color="indigo" style="background: #6366f1;" title="Indigo"></button>
                            </div>
                        </div>
                    </div>

                    <!-- Default Brew Params -->
                    <div class="settings-card">
                        <div class="setting-header">
                            <div>
                                <h4>Domyślne Parametry</h4>
                                <p class="setting-desc">Twoja startowa receptura</p>
                            </div>
                        </div>
                        <div class="setting-control">
                            <div style="display:flex; gap:1rem;">
                                <div>
                                    <label style="font-size:0.8rem; color:var(--text-tertiary);">Doza (g)</label>
                                    <input type="number" id="setting-dose" class="std-input" value="${settings.defaultDose || 18}" step="0.1"
                                           style="width: 80px; text-align:center;">
                                </div>
                                <div>
                                    <label style="font-size:0.8rem; color:var(--text-tertiary);">Ratio (1:x)</label>
                                    <input type="number" id="setting-ratio" class="std-input" value="${settings.defaultRatio || 16.6}" step="0.1"
                                           style="width: 80px; text-align:center;">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Temperature Preference -->
                    <div class="settings-card">
                        <div class="setting-header">
                            <div>
                                <h4>Preferowana temperatura</h4>
                                <p class="setting-desc">Domyślna temperatura</p>
                            </div>
                        </div>
                        <div class="setting-control">
                            <div class="temp-slider">
                                <input type="range" id="temp-slider" min="85" max="96" step="1" value="${settings.preferredTemp || 92}">
                                <div class="temp-display">
                                    <span id="temp-value">${settings.preferredTemp || 92}</span>°C
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Units -->
                    <div class="settings-card">
                        <div class="setting-header">
                            <div>
                                <h4>Jednostki</h4>
                                <p class="setting-desc">Waga i objętość</p>
                            </div>
                        </div>
                        <div class="setting-control">
                            <div class="toggle-group">
                                <button class="toggle-btn ${settings.units === 'metric' ? 'active' : ''}" data-unit="metric">Metryczne (g/ml)</button>
                                <button class="toggle-btn ${settings.units === 'imperial' ? 'active' : ''}" data-unit="imperial">Imperial (oz/fl oz)</button>
                            </div>
                        </div>
                    </div>

                    <!-- Logout -->
                    <div class="settings-card">
                        <button class="btn-logout">Wyloguj się</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Color picker
        this.container.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                this.changeAccentColor(color);

                this.container.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Default Params Listeners
        const doseInput = this.container.querySelector('#setting-dose');
        const ratioInput = this.container.querySelector('#setting-ratio');
        if (doseInput) {
            doseInput.addEventListener('change', (e) => {
                store.updateSettings({ defaultDose: parseFloat(e.target.value) });
            });
        }
        if (ratioInput) {
            ratioInput.addEventListener('change', (e) => {
                store.updateSettings({ defaultRatio: parseFloat(e.target.value) });
            });
        }

        // Temperature slider
        const tempSlider = this.container.querySelector('#temp-slider');
        const tempValue = this.container.querySelector('#temp-value');

        if (tempSlider) {
            tempSlider.addEventListener('input', (e) => {
                tempValue.textContent = e.target.value;
                store.updateSettings({ preferredTemp: parseInt(e.target.value) });
            });
        }

        // Units toggle
        this.container.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const unit = e.currentTarget.dataset.unit;
                store.updateSettings({ units: unit });

                this.container.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Logout
        this.container.querySelector('.btn-logout')?.addEventListener('click', () => {
            if (confirm('Czy na pewno chcesz się wylogować?')) {
                localStorage.removeItem('dialin_auth');
                window.location.href = '../login.html';
            }
        });
    }

    changeAccentColor(colorName) {
        const colors = {
            emerald: '#10b981',
            purple: '#a855f7',
            blue: '#3b82f6',
            orange: '#f97316',
            pink: '#ec4899',
            indigo: '#6366f1'
        };

        const color = colors[colorName];
        if (color) {
            document.documentElement.style.setProperty('--color-primary-500', color);
            document.documentElement.style.setProperty('--color-secondary-500', color);
            
            store.updateSettings({ accentColor: colorName });
        }
    }
}
