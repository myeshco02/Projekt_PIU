/**
 * @file src/features/brew-assistant/components/LogDetailView.js
 */

import { store } from '../../../core/Store.js';

export class LogDetailView {
    constructor(container, log) {
        this.container = container;
        this.log = log;
        this.render();
    }

    render() {
        const coffee = store.state.coffees.find(c => c.id === this.log.coffeeId) || { name: 'Nieznana kawa' };
        const timeFormatted = `${Math.floor(this.log.timeSeconds / 60)}:${(this.log.timeSeconds % 60).toString().padStart(2, '0')}`;
        const dateFormatted = new Date(this.log.date).toLocaleString('pl-PL');

        this.container.innerHTML = `
            <div class="log-detail-container">
                <div class="log-header">
                    <div style="font-size: 0.9rem; color: var(--text-tertiary); margin-bottom: 0.5rem;">${dateFormatted}</div>
                    <h1 style="margin-bottom: 0.5rem;">${coffee.name}</h1>
                    <div class="big-rating" id="star-rating">
                        ${this.renderStars(this.log.rating || 0)}
                    </div>
                    <p style="color: var(--text-tertiary); font-size: 0.9rem;">Kliknij gwiazdki aby ocenić</p>
                </div>

                <div class="log-param-grid">
                    <div class="param-box">
                        <span class="param-label">Metoda</span>
                        <span class="param-value">${this.log.method}</span>
                    </div>
                     <div class="param-box">
                        <span class="param-label">Czas</span>
                        <span class="param-value">${timeFormatted}</span>
                    </div>
                    <div class="param-box">
                        <span class="param-label">Doza</span>
                        <span class="param-value">${this.log.dose}g</span>
                    </div>
                    <div class="param-box">
                        <span class="param-label">Uzysk</span>
                        <span class="param-value">${this.log.yield}ml</span>
                    </div>
                     <div class="param-box">
                        <span class="param-label">Temp</span>
                        <span class="param-value">${this.log.temp}°C</span>
                    </div>
                </div>

                <div class="notes-section">
                    <h3>Notatki</h3>
                    <textarea class="std-textarea" id="log-notes" placeholder="Jak smakowało? Co poprawić?">${this.log.notes || ''}</textarea>
                </div>
            </div>
        `;

        this.attachListeners();
    }

    renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 10; i++) {
            const isFilled = i <= rating;
            html += `<i class="fa-star ${isFilled ? 'fa-solid' : 'fa-regular'} ${!isFilled ? 'inactive' : ''}" data-value="${i}"></i>`;
        }
        return html;
    }

    attachListeners() {
        // Rating
        const starsContainer = this.container.querySelector('#star-rating');
        starsContainer.querySelectorAll('i').forEach(star => {
            star.addEventListener('click', () => {
                const val = parseInt(star.dataset.value);
                this.updateRating(val);
                store.updateLog({ id: this.log.id, rating: val });
            });
            
            // Hover effect? Minimal CSS handles some, but JS for fill preview is nicer. 
            // Stick to click for now to keep it simple.
        });

        // Notes
        const noteArea = this.container.querySelector('#log-notes');
        noteArea.addEventListener('change', (e) => {
            store.updateLog({ id: this.log.id, notes: e.target.value });
        });
    }

    updateRating(val) {
        this.container.querySelector('#star-rating').innerHTML = this.renderStars(val);
        // Re-attach listeners to new stars
        this.attachListeners(); // A bit recursive but safe here as content is replaced
    }
}
