/**
 * @file src/features/dashboard/DashboardView.js
 * @description Dashboard with welcome, stats, highlights, and ad carousel
 */

import { store } from '../../core/Store.js';
import { calculateFreshness } from '../../shared/utils/freshness.js';

export class DashboardView {
    constructor() {
        this.container = document.getElementById('dashboard-view');
        this.currentAdIndex = 0;
        this.adInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.startAdCarousel();
        
        // Re-render on data updates
        store.addEventListener('inventory-updated', () => this.render());
    }

    render() {
        const auth = JSON.parse(localStorage.getItem('dialin_auth') || '{}');
        const email = auth.email || 'Demo User';
        const userName = email.split('@')[0];
        const coffees = store.getActiveCoffees();
        
        // Get top picks (no random ratings)
        const topPicks = coffees.slice(0, 3);
        
        // Get best-to-brew coffees (Peak Flavor window)
        const bestNowCoffees = coffees
            .map(c => ({ ...c, freshness: calculateFreshness(c.roastDate) }))
            .filter(c => c.freshness && c.freshness.state === 'peak')
            .slice(0, 3);

        this.container.innerHTML = `
            <div class="dashboard-container">
                <!-- Welcome Banner -->
                <div class="welcome-banner">
                    <div class="welcome-content">
                        <h1 class="welcome-title">Dzień dobry, ${userName}!</h1>
                        <p class="welcome-subtitle">Kawowy świat czeka na odkrycie</p>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats">
                    <div class="stat-card-mini">
                        <div class="stat-info">
                            <div class="stat-value">${coffees.length}</div>
                            <div class="stat-label">Aktywnych kaw</div>
                        </div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-info">
                            <div class="stat-value">23</div>
                            <div class="stat-label">Parzeń w tyg.</div>
                        </div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-info">
                            <div class="stat-value">8.9</div>
                            <div class="stat-label">Avg. ocena</div>
                        </div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-info">
                            <div class="stat-value">7</div>
                            <div class="stat-label">Dni streak</div>
                        </div>
                    </div>
                </div>

                <!-- Ad Banner Carousel -->
                <div class="ad-carousel-section">
                    <div class="ad-carousel">
                        ${this.renderAdBanners()}
                    </div>
                    <div class="carousel-dots">
                        <span class="dot active" data-index="0"></span>
                        <span class="dot" data-index="1"></span>
                        <span class="dot" data-index="2"></span>
                    </div>
                </div>

                <!-- Top Picks -->
                ${topPicks.length > 0 ? `
                <div class="dashboard-section">
                    <h2 class="section-title">
                        <span>Top Picks</span>
                        <span class="badge-accent"><i class="fa-solid fa-mug-hot"></i> Nuty smakowe</span>
                    </h2>
                    <p class="section-description">
                        Wyselekcjonowane kawy z najwyższym potencjałem smakowym. Sprawdź profile,
                        wybierz coś pod swoje preferencje i zaparz jeszcze dziś.
                    </p>
                    <div class="coffee-highlights">
                        ${topPicks.map(coffee => this.renderHighlightCard(coffee, 'top')).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Best-to-brew Coffees -->
                ${bestNowCoffees.length > 0 ? `
                <div class="dashboard-section">
                    <h2 class="section-title">
                        <span>Najlepsze teraz</span>
                        <span class="badge-accent"><i class="fa-solid fa-leaf"></i> Szczyt smaku</span>
                    </h2>
                    <p class="section-description">
                        To paczki w idealnym oknie smakowym. Mają najlepszy balans aromatu i czystości,
                        więc warto zaparzyć je właśnie teraz.
                    </p>
                    <div class="coffee-highlights">
                        ${bestNowCoffees.map(coffee => this.renderHighlightCard(coffee, 'fresh')).join('')}
                    </div>
                    <div class="freshness-info">
                        <h3>Freshness Score</h3>
                        <p>
                            System świeżości dzieli kawy na etapy, które pomagają dobrać moment parzenia.
                            To szybka informacja, czy ziarno potrzebuje odpoczynku, jest w szczycie,
                            czy zaczyna tracić aromaty.
                        </p>
                        <div class="freshness-legend">
                            <div class="freshness-item">
                                <span class="freshness-badge badge-resting">Resting</span>
                                <span>0–6 dni: za świeża po paleniu, najlepiej odczekać kilka dni.</span>
                            </div>
                            <div class="freshness-item">
                                <span class="freshness-badge badge-peak">Peak Flavor</span>
                                <span>7–30 dni: optymalny moment — najczystszy smak i aromat.</span>
                            </div>
                            <div class="freshness-item">
                                <span class="freshness-badge badge-good">Still Good</span>
                                <span>31–60 dni: wciąż smaczna, ale intensywność aromatów spada.</span>
                            </div>
                            <div class="freshness-item">
                                <span class="freshness-badge badge-old">Past Best</span>
                                <span>61+ dni: dalej ok, ale lepiej pod cold brew lub mleko.</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${coffees.length === 0 ? `
                <div class="empty-state-dashboard">
                    <div class="empty-icon"><i class="fa-solid fa-box-open"></i></div>
                    <h3>Spiżarnia pusta</h3>
                    <p>Dodaj pierwszą kawę i zacznij swoją kawową przygodę!</p>
                    <button class="btn-primary" onclick="document.querySelector('[data-view=\\"library\\"]').click()">
                        Dodaj kawę
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        this.attachEventListeners();
    }

    renderAdBanners() {
        const ads = [
            {
                title: "Nowa Etiopia Yirgacheffe!",
                subtitle: "Odkryj nuty bergamotki i czarnej porzeczki",
                cta: "Zobacz więcej",
                gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            },
            {
                title: "Black Friday -20%",
                subtitle: "Wszystkie młynki w promocyjnej cenie",
                cta: "Kup teraz",
                gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
            },
            {
                title: "Brewly Premium",
                subtitle: "Nieograniczone notatki i eksport danych",
                cta: "Wypróbuj za darmo",
                gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
            }
        ];

        return ads.map((ad, index) => `
            <div class="ad-slide ${index === 0 ? 'active' : ''}" style="background: ${ad.gradient}">
                <div class="ad-content">
                    <h3 class="ad-title">${ad.title}</h3>
                    <p class="ad-subtitle">${ad.subtitle}</p>
                    <button class="ad-cta">${ad.cta}</button>
                </div>
            </div>
        `).join('');
    }

    renderHighlightCard(coffee, type) {
        const freshness = coffee.freshness || calculateFreshness(coffee.roastDate);
        const badgeClass = freshness ? `badge-${freshness.state}` : '';
        const badgeLabel = freshness ? freshness.label : '';
        const flavors = Array.isArray(coffee.flavors) ? coffee.flavors : [];
        const flavorTags = flavors.length
            ? flavors.map(flavor => {
                const color = flavor.color || '#10b981';
                return `
                <span class="flavor-tag" style="background:${color}20; color:${color}; border-color:${color}">
                    ${flavor.name}
                </span>
            `;
            }).join('')
            : '<span class="flavor-empty">Brak profilu smakowego</span>';

        return `
            <article class="highlight-card" data-id="${coffee.id}">
                <div class="highlight-header">
                    <h3>${coffee.name}</h3>
                    ${type === 'fresh' && freshness ? `
                        <div class="freshness-group">
                            <span class="freshness-badge ${badgeClass}">${badgeLabel}</span>
                            <span class="freshness-counter">${freshness.daysOld} dni od palenia</span>
                        </div>
                    ` : ''}
                </div>
                <p class="highlight-roaster">${coffee.roaster}</p>
                <div class="highlight-meta">
                    ${coffee.origin ? `<span><i class="fa-solid fa-location-dot"></i> ${coffee.origin}</span>` : ''}
                    ${coffee.process ? `<span><i class="fa-solid fa-flask"></i> ${coffee.process}</span>` : ''}
                </div>
                ${type === 'top' ? `<div class="highlight-flavors">${flavorTags}</div>` : ''}
                <button class="btn-brew" onclick="alert('Asystent parzenia wkrótce!')">
                    Zaparz teraz
                </button>
            </article>
        `;
    }

    attachEventListeners() {
        // Carousel dots navigation
        this.container.querySelectorAll('.carousel-dots .dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.goToSlide(index);
            });
        });
    }

    startAdCarousel() {
        this.adInterval = setInterval(() => {
            this.currentAdIndex = (this.currentAdIndex + 1) % 3;
            this.goToSlide(this.currentAdIndex);
        }, 5000);
    }

    goToSlide(index) {
        this.currentAdIndex = index;
        
        const slides = this.container.querySelectorAll('.ad-slide');
        const dots = this.container.querySelectorAll('.carousel-dots .dot');
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    destroy() {
        if (this.adInterval) {
            clearInterval(this.adInterval);
        }
    }
}
