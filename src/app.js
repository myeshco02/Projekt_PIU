import { store } from './core/Store.js';
import { calculateFreshness } from './shared/utils/freshness.js';
import { AccountView } from './features/account/AccountView.js';
import { DashboardView } from './features/dashboard/DashboardView.js';
import { LibraryView } from './features/library/LibraryView.js';
import { BrewAssistantView } from './features/brew-assistant/BrewAssistantView.js';

document.addEventListener('DOMContentLoaded', () => {

    setupNavigation();
    setupForms();

    // Initialize Account View
    new AccountView();
    
    // Initialize Dashboard View
    new DashboardView();
    
    // Initialize Library View
    new LibraryView();

    // Initialize Brew Assistant View
    new BrewAssistantView();
});

function setupNavigation() {
    const mainTabs = document.querySelectorAll('.tab-btn');
    const subTabs = document.querySelectorAll('.sub-tab-btn');
    const fab = document.getElementById('fab-add-coffee');

    // Main Tab Navigation (Bottom Bar)
    mainTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const viewName = e.currentTarget.dataset.view;
            if (!viewName) return;

            // Update active state
            mainTabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Hide all main views
            document.querySelectorAll('#app-content > .view').forEach(v => {
                v.style.display = 'none';
            });

            // Show selected view
            const targetView = document.getElementById(`${viewName}-view`);
            if (targetView) {
                targetView.style.display = 'block';
            }

            // Show/hide FAB (only on library)
            if (fab) {
                fab.style.display = (viewName === 'library') ? 'flex' : 'none';
            }
        });
    });

    // Sub-Tab Navigation (Within Library)
    subTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const subtabName = e.currentTarget.dataset.subtab;
            if (!subtabName) return;

            // Update active state
            subTabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Hide all subtab contents
            document.querySelectorAll('.subtab-content').forEach(content => {
                content.style.display = 'none';
            });

            // Show selected subtab
            const targetSubtab = document.getElementById(`${subtabName}-subtab`);
            if (targetSubtab) {
                targetSubtab.style.display = 'block';
            }
        });
    });

    // FAB -> Add Coffee
    if (fab) {
        fab.addEventListener('click', () => {
            document.querySelectorAll('#app-content > .view').forEach(v => {
                v.style.display = 'none';
            });
            document.getElementById('add-coffee-view').style.display = 'block';
        });
    }

    // Back Buttons
    document.querySelectorAll('.nav-btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            // Return to library view
            document.querySelectorAll('#app-content > .view').forEach(v => {
                v.style.display = 'none';
            });
            document.getElementById('library-view').style.display = 'block';

            // Reset main tabs
            mainTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-view="library"]').classList.add('active');

            if (fab) fab.style.display = 'flex';
        });
    });
}

function setupForms() {
    const form = document.getElementById('coffee-form');
    if (!form) return;

    const getTodayISO = () => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];
    };

    const roastDateInput = form.querySelector('input[name="roastDate"]');
    if (roastDateInput) {
        roastDateInput.max = getTodayISO();
        roastDateInput.addEventListener('input', () => {
            roastDateInput.setCustomValidity('');
        });
        roastDateInput.addEventListener('change', () => {
            const todayISO = getTodayISO();
            if (roastDateInput.value && roastDateInput.value > todayISO) {
                roastDateInput.setCustomValidity('Data palenia nie może być z przyszłości.');
            } else {
                roastDateInput.setCustomValidity('');
            }
        });
    }

    // 1. Populate Origins
    const originSelect = document.getElementById('origin-select');
    const customOriginGroup = document.getElementById('custom-origin-group');

    if (originSelect) {
        const renderOrigins = () => {
            if (!store.state.origins || store.state.origins.length === 0) return;

            // Sort origins (Blend first?)
            const sortedOrigins = [...store.state.origins].sort();
            
            // Keep first option "Wybierz kraj..."
            const defaultOption = originSelect.querySelector('option[value=""]');
            originSelect.innerHTML = '';
            if (defaultOption) originSelect.appendChild(defaultOption);

            sortedOrigins.forEach(origin => {
                const option = document.createElement('option');
                option.value = origin;
                option.textContent = origin;
                originSelect.appendChild(option);
            });

            // Add Custom Option
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.textContent = 'Inny / Niestandardowy...';
            originSelect.appendChild(customOption);
        };

        renderOrigins();
        // Wait for data if not loaded yet
        store.addEventListener('init', renderOrigins);

        // Listener for custom origin
        if (customOriginGroup) {
            originSelect.addEventListener('change', (e) => {
                const showCustom = e.target.value === 'custom' || e.target.value === 'Blend';
                customOriginGroup.style.display = showCustom ? 'block' : 'none';
                
                if (showCustom) {
                    const input = customOriginGroup.querySelector('input');
                    if (input) {
                        input.placeholder = e.target.value === 'Blend' ? 'Nazwa Blendu (opcjonalnie)...' : 'Wpisz kraj lub region...';
                        input.focus();
                    }
                }
            });
        }
    }

    // 2. Populate Processes
    const processSelect = document.getElementById('process-select');
    if (processSelect) {
        const renderProcesses = () => {
             // Keep default option
            const defaultOption = processSelect.querySelector('option[value=""]');
            
            processSelect.innerHTML = '';
            if (defaultOption) processSelect.appendChild(defaultOption);

            // Add standard processes from Store
            store.state.processes.forEach(proc => {
                const option = document.createElement('option');
                option.value = proc;
                option.textContent = proc;
                processSelect.appendChild(option);
            });

            // Add Custom option
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.textContent = 'Niestandardowa...';
            processSelect.appendChild(customOption);
        };

        renderProcesses();
        // Update if processes change (e.g. added new one)
        store.addEventListener('init', renderProcesses);
        store.addEventListener('reference-data-updated', renderProcesses);
    }

    // 3. Process Select Logic
    const customProcessGroup = document.getElementById('custom-process-group');
    if (processSelect && customProcessGroup) {
        processSelect.addEventListener('change', (e) => {
            customProcessGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
    }

    // 4. Weight Presets Logic
    const weightInput = document.getElementById('weight-input');
    const weightChips = document.querySelectorAll('.chip-radio[data-value]');
    
    if (weightInput && weightChips.length) {
        weightChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // UI update
                weightChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const val = chip.dataset.value;
                if (val !== 'custom') {
                    weightInput.value = val;
                } else {
                    weightInput.value = '';
                    weightInput.focus();
                }
            });
        });

        // If user types manually, handle active state
        weightInput.addEventListener('input', () => {
            const currentVal = weightInput.value;
            let matchFound = false;
            
            weightChips.forEach(chip => {
                if (chip.dataset.value === currentVal) {
                    chip.classList.add('active');
                    matchFound = true;
                } else {
                    chip.classList.remove('active');
                }
            });

            if (!matchFound) {
                const customChip = document.querySelector('.chip-radio[data-value="custom"]');
                if (customChip) customChip.classList.add('active');
            }
        });
    }

    // 5. Altitude Stepper Logic
    const altInput = document.getElementById('altitude-input');
    const stepBtns = document.querySelectorAll('.step-btn');
    
    if (altInput && stepBtns.length) {
        stepBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent submit
                const isPlus = btn.classList.contains('plus');
                const step = 50;
                let current = parseInt(altInput.value) || 0;
                
                // Round to nearest 50 if somehow offset
                current = Math.round(current / 50) * 50;

                if (isPlus) {
                    if (current < 4000) altInput.value = current + step;
                } else {
                    if (current > 0) altInput.value = current - step;
                }
            });
        });
        
        // Ensure manual input rounds to step on blur? Or just validate? 
        // User asked for "input with step restriction", standard type=number step=50 handles validation visually usually.
    }

    // 6. Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        const roastDate = formData.get('roastDate');
        if (roastDateInput && roastDate && roastDate > getTodayISO()) {
            roastDateInput.setCustomValidity('Data palenia nie może być z przyszłości.');
            roastDateInput.reportValidity();
            return;
        }
        roastDateInput?.setCustomValidity('');
        
        // Handle custom process
        let processValue = formData.get('process');
        if (processValue === 'custom') {
            const customName = formData.get('customProcess');
            const shouldSave = formData.get('saveProcess') === 'on';
            
            if (customName && customName.trim() !== '') {
                processValue = customName.trim();
                if (shouldSave) {
                    store.addProcess(processValue);
                }
            } else {
                processValue = 'Unknown'; // Fallback
            }
        }

        // Handle custom origin or Blend
        let originValue = formData.get('origin');
        if (originValue === 'custom' || originValue === 'Blend') {
            const customOrigin = formData.get('customOrigin');
            if (customOrigin && customOrigin.trim() !== '') {
                originValue = customOrigin.trim();
            } else if (originValue === 'custom') {
                originValue = 'Unknown';
            }
            // If Blend and empty custom input, keep 'Blend'
        }

        const newCoffee = {
            name: formData.get('name'),
            roaster: formData.get('roaster'),
            origin: originValue,
            roastDate,
            weightInitial: Number(formData.get('weightCurrent')) || 0,
            process: processValue,
            altitude: formData.get('altitude')
        };

        store.addCoffee(newCoffee);
        form.reset();
        
        // Reset UI specific elements
        if (customProcessGroup) customProcessGroup.style.display = 'none';
        if (weightChips) {
            weightChips.forEach(c => c.classList.remove('active'));
            document.querySelector('.chip-radio[data-value="250"]')?.classList.add('active');
        }

        // Go back to library
        document.querySelector('.nav-btn-back').click();
    });
}
