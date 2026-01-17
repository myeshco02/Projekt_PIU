/**
 * @file src/features/brew-assistant/components/HomeView.js
 */

import { store } from '../../../core/Store.js';
import { calculateFreshness } from '../../../shared/utils/freshness.js';
import { RecipeModal } from './RecipeModal.js';

export class HomeView {
    constructor(container, mainController) {
        this.container = container;
        this.mainController = mainController;
        this.render();
    }

    render() {
        const coffees = store.getActiveCoffees();
        
        // Logic for "Suggestions"
        // 1. Freshness (Peak Flavor)
        const freshCoffees = coffees
            .map(c => ({ ...c, freshness: calculateFreshness(c.roastDate) }))
            .filter(c => c.freshness && c.freshness.state === 'peak')
            .slice(0, 2);

        // 2. Hot Picks (Highest Rated) - mocking rating if not present or using rating field
        const topCoffees = coffees
            .filter(c => c.rating && c.rating >= 8 && !freshCoffees.find(fc => fc.id === c.id))
            .slice(0, 2);

        const suggestions = [...freshCoffees.map(c => ({...c, badge: 'fresh', badgeText: 'Peak Flavor'})), 
                             ...topCoffees.map(c => ({...c, badge: 'hot', badgeText: 'Hot Pick'}))];

        this.container.innerHTML = `
            <div class="assistant-view-container">
                <div class="view-header full-width-header">
                    <div class="header-content centered-container">
                        <h1 class="page-title">Witaj w Asystencie</h1>
                        <p class="subtitle">Wybierz kawę i rozpocznij parzenie</p>
                    </div>
                </div>

                <div class="assistant-content centered-container" style="margin-top: 2rem;">
                    <!-- Suggestions Section -->
                    ${suggestions.length > 0 ? `
                    <div class="section-header">
                        <h2>Sugestie dla Ciebie</h2>
                    </div>
                    <div class="suggestions-grid">
                        ${suggestions.map(c => this.renderSuggestionCard(c)).join('')}
                    </div>
                    ` : ''}

                    <!-- All Coffees -->
                    <div class="section-header">
                        <h2>Twoja Spiżarnia</h2>
                    </div>
                    <div class="coffee-list-full">
                        ${coffees.map(c => this.renderCoffeeRow(c)).join('')}
                        ${coffees.length === 0 ? '<p>Brak aktywnych kaw. Dodaj coś w Bibliotece!</p>' : ''}
                    </div>
                </div>
            </div>
        `;

        this.attachListeners();
    }

    renderSuggestionCard(coffee) {
        return `
            <div class="suggestion-card">
                <div class="card-badge badge-${coffee.badge}">${coffee.badgeText}</div>
                <h3 style="margin-top: 1rem;">${coffee.name}</h3>
                <p style="color: var(--text-secondary);">${coffee.roaster}</p>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                   ${(coffee.flavors || []).slice(0, 3).map(f => 
                       `<span class="tag-pill" style="font-size:0.7rem; padding: 2px 6px; background:${f.color}20; color:${f.color}">${f.name}</span>`
                   ).join('')}
                </div>
                <button class="btn-primary full-width brew-btn" style="margin-top: 1rem;" data-id="${coffee.id}">
                    <i class="fa-solid fa-play"></i> Zaparz Teraz
                </button>
            </div>
        `;
    }

    renderCoffeeRow(coffee) {
        return `
            <div class="coffee-card-row">
                <div class="info">
                    <h3>${coffee.name}</h3>
                    <p>${coffee.roaster} • ${coffee.process || '-'}</p>
                </div>
                <button class="icon-btn-small primary brew-btn" data-id="${coffee.id}" title="Zaparz">
                    <i class="fa-solid fa-mug-hot"></i>
                </button>
            </div>
        `;
    }

    attachListeners() {
        this.container.querySelectorAll('.brew-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const coffeeId = btn.dataset.id;
                this.openRecipeModal(coffeeId);
            });
        });
    }

    openRecipeModal(coffeeId) {
        const coffee = store.state.coffees.find(c => c.id === coffeeId);
        if (coffee) {
            new RecipeModal(coffee, this.mainController);
        }
    }
}
