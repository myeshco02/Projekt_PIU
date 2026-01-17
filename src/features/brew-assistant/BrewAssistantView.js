/**
 * @file src/features/brew-assistant/BrewAssistantView.js
 * @description Main controller for the Brewing Assistant feature.
 */

import { HomeView } from './components/HomeView.js';
import { LogDetailView } from './components/LogDetailView.js';
import { store } from '../../core/Store.js';

export class BrewAssistantView {
    constructor() {
        this.container = document.getElementById('assistant-view');
        this.currentView = 'home'; // 'home' | 'log'
        this.currentLogId = null;
        
        this.init();
    }

    init() {
        this.renderLayout();
        this.setupNavigation();
        
        // Initial Render
        this.navigateTo('home');

        // Listen for log updates to refresh sidebar
        store.addEventListener('logs-updated', () => this.renderSidebarLogs());

        // Listen for inventory updates to refresh Home view (suggestions/pantry)
        store.addEventListener('inventory-updated', () => {
            if (this.currentView === 'home') {
                const mainContent = this.container.querySelector('#brew-main-content');
                if (mainContent) new HomeView(mainContent, this);
            }
        });
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="brew-layout">
                <aside class="brew-sidebar">
                    <div class="sidebar-toolbar">
                        <div class="toolbar-top">
                            <span class="toolbar-title">Asystent</span>
                            <button class="icon-btn-small mobile-only" id="close-logs-btn" title="Zamknij listę">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        
                         <div class="nav-item-main active" id="nav-home">
                            <i class="fa-solid fa-house"></i>
                            <span>Strona Główna</span>
                        </div>
                        
                        <div style="font-size: 0.75rem; font-weight: bold; color: var(--text-tertiary); text-transform: uppercase; margin-top: 0.5rem; padding-left: 0.5rem;">
                            Ostatnie Parzenia
                        </div>
                    </div>
                    
                    <div class="logs-list" id="logs-list">
                        <!-- Populated by JS -->
                    </div>
                </aside>
                
                <main class="brew-main">
                    <div class="brew-mobile-header">
                        <button class="icon-btn-small" id="open-logs-btn" title="Historia parzeń">
                            <i class="fa-solid fa-list"></i>
                        </button>
                        <span class="brew-mobile-title">Asystent</span>
                        <span class="brew-mobile-spacer"></span>
                    </div>
                    <div id="brew-main-content">
                        <!-- Dynamic Content -->
                    </div>
                </main>
            </div>
            
            <!-- Placeholders for Modals/Overlays -->
            <div id="recipe-modal-container"></div>
            <div id="timer-view-container"></div>
        `;
        
        this.renderSidebarLogs();
    }

    renderSidebarLogs() {
        const list = this.container.querySelector('#logs-list');
        const logs = store.getRecentLogs(20); // Show last 20

        if (logs.length === 0) {
            list.innerHTML = `<div class="empty-text" style="padding: 1rem; text-align:center;">Brak historii parzeń</div>`;
            return;
        }

        list.innerHTML = logs.map(log => {
            const coffee = store.state.coffees.find(c => c.id === log.coffeeId) || { name: 'Usunięta kawa' };
            const date = new Date(log.date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' });
            
            return `
                <div class="log-item ${this.currentLogId === log.id ? 'active' : ''}" data-id="${log.id}">
                    <div style="flex:1;">
                        <div class="log-item-header">
                            <span class="log-name">${coffee.name}</span>
                            <span class="log-rating" style="font-size:0.8rem; color:var(--color-warning);">
                                ${log.rating ? '★ ' + log.rating : ''}
                            </span>
                        </div>
                        <div class="log-meta">
                            <span>${log.method}</span>
                            <span>${date}</span>
                        </div>
                    </div>
                    <button class="delete-log-btn" data-id="${log.id}" title="Usuń">&times;</button>
                </div>
            `;
        }).join('');

        // Attach listeners
        list.querySelectorAll('.log-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateTo('log', item.dataset.id);
                this.setSidebarVisible(false);
            });
        });

        // Attach Delete Listeners
        list.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm('Usunąć to parzenie?')) {
                    store.deleteLog(btn.dataset.id);
                    if(this.currentLogId === btn.dataset.id) {
                        this.navigateTo('home');
                    }
                }
            });
        });
    }

    setupNavigation() {
        // Home Button
        this.container.querySelector('#nav-home').addEventListener('click', () => {
            this.navigateTo('home');
            this.setSidebarVisible(false);
        });

        // Mobile open/close logs
        this.container.querySelector('#open-logs-btn')?.addEventListener('click', () => {
            this.setSidebarVisible(true);
        });
        this.container.querySelector('#close-logs-btn')?.addEventListener('click', () => {
            this.setSidebarVisible(false);
        });
    }

    navigateTo(view, param = null) {
        this.currentView = view;
        const mainContent = this.container.querySelector('#brew-main-content');
        
        // Update Sidebar Active State
        const homeBtn = this.container.querySelector('#nav-home');
        if (view === 'home') {
            homeBtn?.classList.add('active');
            this.currentLogId = null;
        } else {
            homeBtn?.classList.remove('active');
            this.currentLogId = param;
        }
        this.renderSidebarLogs(); // Re-render to update active class on log items

        // Render Main Content
        mainContent.innerHTML = '';
        if (view === 'home') {
             new HomeView(mainContent, this);
        } else if (view === 'log' && param) {
             const log = store.state.logs.find(l => l.id === param);
             if (log) {
                 new LogDetailView(mainContent, log);
             } else {
                 mainContent.innerHTML = '<p>Log nie znaleziony.</p>';
            }
        }
    }

    setSidebarVisible(visible) {
        const sidebar = this.container.querySelector('.brew-sidebar');
        if (!sidebar || window.innerWidth >= 768) return;
        sidebar.classList.toggle('visible', visible);
    }
    
    // Public method to open a log (called from Timer after finish)
    openLog(logId) {
        this.navigateTo('log', logId);
    }
}
