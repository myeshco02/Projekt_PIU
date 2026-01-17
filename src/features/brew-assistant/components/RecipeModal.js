/**
 * @file src/features/brew-assistant/components/RecipeModal.js
 */

import { store } from '../../../core/Store.js';
import { TimerView } from './TimerView.js';

export class RecipeModal {
    constructor(coffee, mainController) {
        this.coffee = coffee;
        this.mainController = mainController;
        this.container = document.getElementById('recipe-modal-container');
        this.render();
    }

    render() {
        const grinders = store.state.grinders || [];
        const settings = store.state.userSettings || {};
        const defaultDose = settings.defaultDose || 18;
        const defaultRatio = settings.defaultRatio || 16.6;
        const defaultTemp = settings.preferredTemp || 92;
        
        this.container.innerHTML = /*html*/`
            <div class="brew-modal-overlay open">
                <div class="brew-modal">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h2 style="margin:0;">Parametry Parzenia</h2>
                        <button class="icon-btn-small" id="close-modal"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="form-group">
                        <label>Kawa</label>
                        <div class="input-display">${this.coffee.name}</div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Masa Kawy (g)</label>
                            <input type="number" id="brew-dose" value="${defaultDose}" min="1" step="0.1">
                        </div>
                         <div class="form-group">
                            <label>Ratio (1:x)</label>
                            <input type="number" id="brew-ratio" value="${defaultRatio}" min="1" step="0.1">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Woda (ml) - <small>Obliczone</small></label>
                        <input type="number" id="brew-water" value="${Math.round(defaultDose * defaultRatio)}" readonly style="background: var(--bg-secondary);">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Temperatura (°C)</label>
                            <input type="number" id="brew-temp" value="${defaultTemp}" min="60" max="100">
                        </div>
                         <div class="form-group">
                            <label>Metoda</label>
                            <select id="brew-method">
                                <option value="V60">V60</option>
                                <option value="Aeropress">Aeropress</option>
                                <option value="Chemex">Chemex</option>
                                <option value="French Press">French Press</option>
                                <option value="Kalita">Kalita</option>
                                <option value="Flat Bottom">Flat Bottom</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                         <label>Młynek & Ustawienie</label>
                         <div style="display:grid; grid-template-columns: 1fr 100px; gap: 0.5rem;">
                             <select id="brew-grinder">
                                <option value="">Wybierz młynek...</option>
                                ${grinders.map(g => `<option value="${g.name}">${g.name}</option>`).join('')}
                             </select>
                             <input type="number" id="brew-clicks" placeholder="Kliki">
                         </div>
                    </div>

                    <div class="form-group checkbox-group" style="margin-top:1rem;">
                        <label class="checkbox-label">
                            <input type="checkbox" id="brew-preinfusion" checked>
                            <span>Asystent Preinfuzji (30s)</span>
                        </label>
                    </div>

                    <div class="form-actions" style="margin-top: 2rem;">
                        <button class="btn-primary full-width" id="start-brew-btn">
                            Dalej <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.attachListeners();
    }

    attachListeners() {
        const overlay = this.container.querySelector('.brew-modal-overlay');
        const closeBtn = this.container.querySelector('#close-modal');
        const startBtn = this.container.querySelector('#start-brew-btn');

        const doseInput = this.container.querySelector('#brew-dose');
        const ratioInput = this.container.querySelector('#brew-ratio');
        const waterInput = this.container.querySelector('#brew-water');

        const closeModal = () => {
            overlay.classList.remove('open');
            setTimeout(() => {
                this.container.innerHTML = '';
            }, 300);
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Auto-calculate Water
        const updateWater = () => {
            const dose = parseFloat(doseInput.value) || 0;
            const ratio = parseFloat(ratioInput.value) || 0;
            waterInput.value = Math.round(dose * ratio);
        };

        doseInput.addEventListener('input', updateWater);
        ratioInput.addEventListener('input', updateWater);

        startBtn.addEventListener('click', () => {
            const params = {
                coffeeId: this.coffee.id,
                dose: parseFloat(doseInput.value),
                ratio: parseFloat(ratioInput.value),
                water: parseInt(waterInput.value),
                temp: parseInt(this.container.querySelector('#brew-temp').value),
                method: this.container.querySelector('#brew-method').value,
                grinder: this.container.querySelector('#brew-grinder').value,
                clicks: this.container.querySelector('#brew-clicks').value,
                preinfusion: this.container.querySelector('#brew-preinfusion').checked
            };

            closeModal();
            new TimerView(params, this.mainController);
        });
    }
}
