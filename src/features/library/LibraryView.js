/**
 * @file src/features/library/LibraryView.js
 * @description Master-Detail Library View with Unified Editing & Auto-Save
 */

import { store } from '../../core/Store.js';
import { calculateFreshness } from '../../shared/utils/freshness.js';

export class LibraryView {
    constructor() {
        this.container = document.getElementById('library-view');
        this.filters = {
            search: '',
            status: 'active', // default to active
            sort: 'newest'
        };
        
        // State
        this.selectedCoffeeId = null;
        
        // Palette
        this.accentColors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
            '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
            '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
            '#f43f5e', '#64748b'
        ];

        this.init();
    }

    init() {
        this.render();
        store.addEventListener('inventory-updated', () => this.handleInventoryUpdate());
    }

    handleInventoryUpdate() {
        this.renderSidebarList();
        
        // Refresh detail view if selected still exists, else clear
        if (this.selectedCoffeeId) {
            const coffee = store.state.coffees.find(c => c.id === this.selectedCoffeeId);
            if (coffee) {
                // We do NOT re-render the whole detail view here to avoid losing focus if user is typing.
                // Instead, we might update specific elements if needed, or rely on the input's own consistency.
                // For now, we simple re-render ONLY if it was an external update, but to prevent cursor jumps
                // on auto-save re-renders, we might skip this if the update came from THIS view.
                // A simple approach: Only re-render side bar items visuals. Details are "source of truth" while editing.
                
                // However, updates like "Archive" from sidebar need to reflect.
                // Let's re-render detail ONLY if we are not currently focusing an input?
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                   this.renderDetailView(coffee);
                }
            } else {
                this.selectedCoffeeId = null;
                this.renderEmptyState();
            }
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="library-layout">
                <!-- SIDEBAR -->
                <aside class="library-sidebar">
                    <div class="sidebar-toolbar">
                        <div class="toolbar-top">
                            <span class="toolbar-title">Biblioteka</span>
                            <div class="toolbar-actions">
                <button class="icon-btn-small" id="toggle-archive" title="Pokaż Archiwum">
                                    <i class="fa-solid fa-box-archive"></i>
                                </button>
                                <button class="icon-btn-small primary" id="add-new-coffee" title="Nowa Kawa">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="search-box small">
                             <i class="fa-solid fa-magnifying-glass"></i>
                             <input type="text" id="lib-search" placeholder="Szukaj...">
                        </div>
                        
                        <div class="filter-status-indicator" id="filter-indicator">
                            Pokazuję: <strong>Aktywne</strong>
                        </div>
                    </div>
                    
                    <div class="coffee-list" id="coffee-list"></div>
                    
                    <!-- Mobile FAB (Backup) -->
                    <button class="fab-mobile" id="mobile-add-btn">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </aside>

                <!-- DETAIL PANE -->
                <main class="library-detail" id="library-detail">
                    ${this.getEmptyStateHTML()}
                </main>
            </div>
        `;

        this.attachGlobalListeners();
        this.renderSidebarList();
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-selection">
                <div class="empty-icon"><i class="fa-solid fa-mug-hot"></i></div>
                <h3>Wybierz kawę</h3>
                <p>Wybierz z listy lub dodaj nową</p>
            </div>
        `;
    }

    renderEmptyState() {
        const container = this.container.querySelector('#library-detail');
        if (container) {
            container.innerHTML = this.getEmptyStateHTML();
            container.classList.remove('visible'); // Hide on mobile if empty
        }
    }

    renderSidebarList() {
        const listContainer = this.container.querySelector('#coffee-list');
        const indicator = this.container.querySelector('#filter-indicator');
        
        // Update Indicator
        if (indicator) {
            indicator.innerHTML = this.filters.status === 'active' 
                ? 'Pokazuję: <strong>Aktywne</strong>' 
                : 'Pokazuję: <strong>Archiwum</strong>';
            
            indicator.style.color = this.filters.status === 'active' ? 'var(--text-secondary)' : 'var(--color-warning)';
        }

        const coffees = this.getFilteredCoffees();

        if (coffees.length === 0) {
            listContainer.innerHTML = `<div class="no-results">Brak wyników</div>`;
            return;
        }

        listContainer.innerHTML = coffees.map(coffee => {
            const isSelected = coffee.id === this.selectedCoffeeId;
            const accent = coffee.accentColor || '#10b981';
            const freshness = calculateFreshness(coffee.roastDate);
            
            return `
                <div class="coffee-list-item ${isSelected ? 'active' : ''}" 
                     data-id="${coffee.id}"
                     style="--item-accent: ${accent}">
                    <div class="item-content">
                        <div class="item-top">
                            <span class="item-name">${coffee.name}</span>
                            
                            <!-- Action Menu -->
                            <div class="action-menu-container" onclick="event.stopPropagation()">
                                <button class="action-menu-btn" data-id="${coffee.id}">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                                <div class="action-dropdown" id="dropdown-${coffee.id}">
                                    ${this.filters.status === 'active' ? `
                                    <button class="action-item archive-action" data-id="${coffee.id}">
                                        <i class="fa-solid fa-box-archive"></i>
                                        Archiwizuj
                                    </button>
                                    ` : `
                                    <button class="action-item restore-action" data-id="${coffee.id}">
                                         <i class="fa-solid fa-rotate-left"></i>
                                        Przywróć
                                    </button>
                                    `}
                                    <button class="action-item delete delete-action" data-id="${coffee.id}">
                                        <i class="fa-solid fa-trash"></i>
                                        Usuń
                                    </button>
                                </div>
                            </div>

                        </div>
                        <div class="item-sub">
                            <span class="item-roaster">${coffee.roaster || 'Bez palarni'}</span>
                            <span class="item-date">${freshness ? freshness.daysOld + ' dni' : ''}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');



        // Item Click Listeners
        listContainer.querySelectorAll('.coffee-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // If menu was clicked, do nothing here (handled by stopPropagation on container, but just in case)
                this.selectCoffee(item.dataset.id);
            });
        });

        // Action Menu Listeners
        listContainer.querySelectorAll('.action-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Don't select row
                const id = btn.dataset.id;
                this.toggleActionMenu(id);
            });
        });

        // Archive Action
        listContainer.querySelectorAll('.archive-action').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if(confirm('Archiwizować tę kawę?')) {
                     await store.updateCoffee({ id, status: 'archived' });
                     this.closeAllActionMenus();
                }
            });
        });

        // Restore Action (if implemented in logic)
         listContainer.querySelectorAll('.restore-action').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                await store.updateCoffee({ id, status: 'active' });
                this.closeAllActionMenus();
            });
        });

        // Delete Action
        listContainer.querySelectorAll('.delete-action').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (confirm('Czy na pewno usunąć tę kawę? Operacji nie można cofnąć.')) {
                    await store.deleteCoffee(id);
                    if (this.selectedCoffeeId === id) {
                        this.selectedCoffeeId = null;
                        this.renderEmptyState();
                    }
                }
            });
        });
    }

    selectCoffee(id) {
        this.selectedCoffeeId = id;
        
        // Update Sidebar Active State
        this.container.querySelectorAll('.coffee-list-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === id);
        });

        const coffee = store.state.coffees.find(c => c.id === id);
        this.renderDetailView(coffee);

        // Mobile slide-in
        if (window.innerWidth < 768) {
            this.container.querySelector('#library-detail').classList.add('visible');
        }
    }

    toggleActionMenu(id) {
        // Close others first
        this.container.querySelectorAll('.action-dropdown').forEach(d => {
            if (d.id !== `dropdown-${id}`) {
                d.classList.remove('visible');
                // Remove z-index boost from parent row
                d.closest('.coffee-list-item')?.classList.remove('z-elevated');
            }
        });

        const dropdown = this.container.querySelector(`#dropdown-${id}`);
        if (dropdown) {
            const isVisible = dropdown.classList.toggle('visible');
            const row = dropdown.closest('.coffee-list-item');
            if (row) {
                 if (isVisible) row.classList.add('z-elevated');
                 else row.classList.remove('z-elevated');
            }
        }
    }

    closeAllActionMenus() {
        this.container.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('visible'));
        this.container.querySelectorAll('.coffee-list-item').forEach(item => item.classList.remove('z-elevated'));
    }

    renderDetailView(coffee) {
        const container = this.container.querySelector('#library-detail');
        if (!coffee) return;

        const accent = coffee.accentColor || '#10b981';
        const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];
        
        container.innerHTML = `
            <!-- HEADER with Accent Background -->
            <div class="detail-header editable-header" style="background: linear-gradient(135deg, ${accent}dd, ${accent})">
                <button class="back-btn-mobile" id="detail-back-btn">
                    <i class="fa-solid fa-chevron-left"></i> Wróć
                </button>
                
                <div class="header-content">
                     <!-- Toolbar inside header -->
                    <div class="header-actions-top">
                         <div class="chip-status ${coffee.status}">${coffee.status === 'active' ? 'Aktywna' : 'Zarchiwizowana'}</div>
                         <div class="header-right-actions">
                            <button class="icon-btn white" id="action-archive" title="${coffee.status === 'active' ? 'Archiwizuj' : 'Przywróć'}">
                                ${coffee.status === 'active' 
                                    ? '<i class="fa-solid fa-box-archive"></i>'
                                    : '<i class="fa-solid fa-rotate-left"></i>'
                                }
                            </button>
                            <button class="icon-btn white danger" id="action-delete" title="Usuń">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                         </div>
                    </div>

                    <!-- Roaster Input -->
                    <input type="text" class="edit-input roaster-input required-field" name="roaster" value="${coffee.roaster || ''}" placeholder="Nazwa Palarni (Wymagane)">
                    
                    <!-- Name Input -->
                    <input type="text" class="edit-input name-input required-field" name="name" value="${coffee.name || ''}" placeholder="Nazwa Kawy (Wymagane)">

                    <!-- Meta Row: Color Picker -->
                    <div class="meta-row-header">
                        <div class="color-picker-mini">
                            ${this.accentColors.slice(0, 8).map(c => `
                                <div class="color-dot-mini ${c === accent ? 'selected' : ''}" 
                                     style="background: ${c}" data-color="${c}"></div>
                            `).join('')}
                            <!-- Show more hint could go here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- SCROLLABLE BODY -->
            <div class="detail-body">
                
                <!-- MAIN GRID FORM -->
                <div class="edit-grid">
                    <div class="edit-field">
                        <label>Kraj / Region</label>
                        <input type="text" class="std-input" name="origin" value="${coffee.origin || ''}" placeholder="np. Ethiopia">
                    </div>
                    <div class="edit-field">
                        <label>Data Palenia</label>
                        <input type="date" class="std-input" name="roastDate" value="${coffee.roastDate || ''}" max="${today}">
                    </div>
                    
                    <!-- WEIGHTS ROW -->
                    <div class="edit-field">
                        <label>Waga Paczki (g)</label>
                        <div class="input-with-presets">
                            <input type="number" class="std-input" name="weightInitial" value="${coffee.weightInitial || 250}" step="50" min="0">
                            <div class="weight-presets-chips">
                                <button class="chip-preset" data-weight="250">250g</button>
                                <button class="chip-preset" data-weight="500">500g</button>
                                <button class="chip-preset" data-weight="1000">1kg</button>
                            </div>
                        </div>
                    </div>

                    <div class="edit-field">
                        <label>Obróbka</label>
                        <select class="std-input" name="process" id="process-edit-select">
                            <option value="">Wybierz...</option>
                            ${store.state.processes.map(p => `<option value="${p}" ${p === coffee.process ? 'selected' : ''}>${p}</option>`).join('')}
                             <option value="custom" ${!store.state.processes.includes(coffee.process) && coffee.process ? 'selected' : ''}>Inna...</option>
                        </select>
                        <div id="custom-process-container" style="display: ${!store.state.processes.includes(coffee.process) && coffee.process ? 'block' : 'none'}; margin-top: 8px;">
                            <input type="text" 
                                   id="custom-process-input" 
                                   class="std-input" 
                                   placeholder="Wpisz nazwę obróbki..." 
                                   value="${!store.state.processes.includes(coffee.process) && coffee.process ? coffee.process : ''}">
                        </div>
                    </div>
                    <div class="edit-field">
                        <label>Wysokość (m)</label>
                        <input type="number" class="std-input" name="altitude" value="${coffee.altitude || ''}" placeholder="-" step="50" min="0" max="4000">
                    </div>
                    <div class="edit-field">
                        <label>Ocena (1-10)</label>
                        <input type="number" class="std-input" name="rating" value="${coffee.rating || ''}" max="10" min="1">
                    </div>
                </div>

                <!-- FLAVORS -->
                <div class="flavor-section">
                    <div class="flex-row-between">
                        <h3>Profil Smakowy (SCAA)</h3>
                        <button class="btn-text-action" id="add-flavor-btn">+ Zmień</button>
                    </div>
                    <div class="flavor-tags" id="flavor-container">
                        ${(coffee.flavors || []).map(f => `
                            <span class="tag-pill removable" data-name="${f.name}" style="background:${f.color}40; color:${f.color}; border:1px solid ${f.color}">
                                ${f.name}
                            </span>
                        `).join('')}
                         ${(!coffee.flavors || coffee.flavors.length === 0) ? '<span class="empty-text">Brak tagów</span>' : ''}
                    </div>
                </div>

                <!-- NOTES -->
                <div class="notes-section">
                    <h3>Notatki</h3>
                    <textarea class="std-textarea" name="notes" placeholder="Wpisz swoje notatki, przepis, wrażenia...">${coffee.notes || ''}</textarea>
                </div>
            </div>
            
            <!-- Flavor Picker Overlay -->
            <div id="flavor-overlay" class="overlay" style="display:none;">
                <div class="picker-modal">
                    <h3>Wybierz Główne Nuty</h3>
                    <div class="flavor-grid-picker">
                        ${store.state.flavors.map(f => `
                            <button class="flavor-btn scaa-btn" data-name="${f.name}" data-color="${f.color}" style="background-color: ${f.color}20; border: 2px solid ${f.color}; color: ${f.color}">
                                ${f.name}
                            </button>
                        `).join('')}
                    </div>
                    <button class="btn-primary full-width" id="close-flavor-overlay">Gotowe</button>
                </div>
            </div>
        `;

        this.attachDetailListeners(coffee);
    }

    attachGlobalListeners() {
        // Toolbar: Add
        this.container.querySelector('#add-new-coffee').addEventListener('click', async () => {
             const newId = await store.createEmptyCoffee();
             this.filters.status = 'active'; // switch to active to see new coffee
             this.selectCoffee(newId);
        });

        // Toolbar: Filter Toggle
        const toggleBtn = this.container.querySelector('#toggle-archive');
        toggleBtn.addEventListener('click', () => {
            if (this.filters.status === 'active') {
                this.filters.status = 'archived';
                toggleBtn.classList.add('active-state'); // Styled as pressed
            } else {
                this.filters.status = 'active';
                toggleBtn.classList.remove('active-state');
            }
            this.selectedCoffeeId = null; 
            this.handleInventoryUpdate();
        });

        // Search
        this.container.querySelector('#lib-search').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.renderSidebarList();
        });
        
        // Mobile FAB
        this.container.querySelector('#mobile-add-btn').addEventListener('click', async () => {
             const newId = await store.createEmptyCoffee();
             this.selectCoffee(newId);
        });

        // Close dropdowns when clicking outside (attach once)
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.action-menu-container')) {
                this.closeAllActionMenus();
            }
        });
    }

    attachDetailListeners(coffee) {
        const container = this.container.querySelector('#library-detail');

        // 1. Back Button
        container.querySelector('#detail-back-btn')?.addEventListener('click', () => {
            container.classList.remove('visible');
        });

        // 2. Archive / Delete Actions
        container.querySelector('#action-archive')?.addEventListener('click', () => {
            if (coffee.status === 'active') {
                store.archiveCoffee(coffee.id);
            } else {
                store.unarchiveCoffee(coffee.id);
            }
        });

        container.querySelector('#action-delete')?.addEventListener('click', () => {
            if (confirm('Usunąć tę kawę trwale?')) {
                store.deleteCoffee(coffee.id);
                this.selectedCoffeeId = null;
                this.renderEmptyState();
                if (window.innerWidth < 768) container.classList.remove('visible');
            }
        });

        // 3. Auto-Save Inputs with Validation
        const inputs = container.querySelectorAll('input, textarea, select');
        const roastDateInput = container.querySelector('input[name="roastDate"]');
        if (roastDateInput) {
            roastDateInput.dataset.lastValid = roastDateInput.value || '';
        }

        const todayISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const field = e.target.name;
                const value = e.target.value;

                if (field === 'roastDate') {
                    if (value && value > todayISO) {
                        input.setCustomValidity('Data palenia nie może być z przyszłości.');
                        input.reportValidity();
                        input.value = input.dataset.lastValid || todayISO;
                        input.setCustomValidity('');
                        return;
                    }
                    input.setCustomValidity('');
                    input.dataset.lastValid = value;
                }

                // Simple Validation for Required Fields
                if (input.classList.contains('required-field') && !value.trim()) {
                    input.style.borderColor = '#ef4444';
                    // Shake animation or toast could be added here
                    console.warn(`Field ${field} is required.`);
                    return; // Do not save invalid state
                } else {
                    input.style.borderColor = ''; // Reset error style
                }

                if (field) {
                    // Logic for Process handled separately? No, standard handling is fine, unless it's custom logic
                    // If select is 'custom', we don't save 'custom' as value yet, we wait for input
                    if (field === 'process' && value === 'custom') return;
                    
                    store.updateCoffee({ id: coffee.id, [field]: value });
                }
            });
        });

        // 3a. Weight Presets
        container.querySelectorAll('.chip-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const weight = parseInt(btn.dataset.weight);
                store.updateCoffee({ 
                    id: coffee.id, 
                    weightInitial: weight,
                    weightCurrent: weight
                });
                container.querySelector('input[name="weightInitial"]').value = weight;
            });
        });

        // 3b. Custom Process Logic
        const processSelect = container.querySelector('#process-edit-select');
        const customProcessDiv = container.querySelector('#custom-process-container');
        const customProcessInput = container.querySelector('#custom-process-input');

        processSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customProcessDiv.style.display = 'block';
                customProcessInput.focus();
                // do not save 'custom' string to store
            } else {
                customProcessDiv.style.display = 'none';
                store.updateCoffee({ id: coffee.id, process: e.target.value });
            }
        });

        customProcessInput.addEventListener('change', (e) => {
            store.updateCoffee({ id: coffee.id, process: e.target.value });
        });

        // 4. Color Picker
        container.querySelectorAll('.color-dot-mini').forEach(dot => {
            dot.addEventListener('click', () => {
                const color = dot.dataset.color;
                store.updateCoffee({ id: coffee.id, accentColor: color });
                container.querySelector('.detail-header').style.background = `linear-gradient(135deg, ${color}dd, ${color})`;
                container.querySelectorAll('.color-dot-mini').forEach(d => d.classList.remove('selected'));
                dot.classList.add('selected');
            });
        });

        // 5. Flavors (Simplified SCAA)
        const flavorOverlay = container.querySelector('#flavor-overlay');
        const containerFlavors = container.querySelector('#flavor-container');
        let currentFlavors = coffee.flavors || [];

        container.querySelector('#add-flavor-btn')?.addEventListener('click', () => {
            flavorOverlay.style.display = 'flex';
        });

        container.querySelector('#close-flavor-overlay')?.addEventListener('click', () => {
            flavorOverlay.style.display = 'none';
        });

        // Flavor pills inside overlay
        flavorOverlay.querySelectorAll('.flavor-btn').forEach(btn => {
            // Restore active state based on current flavors
            if (currentFlavors.some(f => f.name === btn.dataset.name)) {
                btn.classList.add('active');
                btn.style.backgroundColor = btn.dataset.color;
                btn.style.color = 'white';
            }

            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const color = btn.dataset.color;
                
                const exists = currentFlavors.find(f => f.name === name);
                
                if (exists) {
                    currentFlavors = currentFlavors.filter(f => f.name !== name);
                    btn.classList.remove('active');
                    btn.style.backgroundColor = `${color}20`; // Reset to faint bg
                    btn.style.color = color;
                } else {
                    currentFlavors.push({ name, color });
                    btn.classList.add('active');
                    btn.style.backgroundColor = color; // Solid bg
                    btn.style.color = 'white';
                }
                
                store.updateCoffee({ id: coffee.id, flavors: currentFlavors });
                this.renderFlavorPills(containerFlavors, currentFlavors);
            });
        });

        // 6. Remove flavor via pill 'x'
        containerFlavors.addEventListener('click', (e) => {
            if (e.target.classList.contains('removable')) {
               const nameToRemove = e.target.dataset.name;
               currentFlavors = currentFlavors.filter(f => f.name !== nameToRemove);
               store.updateCoffee({ id: coffee.id, flavors: currentFlavors });
               this.renderFlavorPills(containerFlavors, currentFlavors);
            }
        });
    }

    renderFlavorPills(container, flavors) {
        if (!flavors.length) {
            container.innerHTML = '<span class="empty-text">Brak tagów</span>';
            return;
        }
        container.innerHTML = flavors.map(f => `
            <span class="tag-pill removable" data-name="${f.name}" style="background:${f.color}40; color:${f.color}; border:1px solid ${f.color}">
                ${f.name} ×
            </span>
        `).join('');
    }

    getFilteredCoffees() {
        let coffees = store.state.coffees;
        // Search
        if (this.filters.search) {
            const term = this.filters.search.toLowerCase();
            coffees = coffees.filter(c => c.name.toLowerCase().includes(term));
        }
        // Status
        coffees = coffees.filter(c => c.status === this.filters.status);
        
        // Sort: Newest first
        coffees.sort((a,b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        return coffees;
    }
}
