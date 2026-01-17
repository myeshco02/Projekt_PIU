/**
 * @file src/core/Store.js
 * @description Central Data Store using JSON-Server (Async API).
 */

const API_URL = 'http://localhost:3000';

export class Store extends EventTarget {
  constructor() {
    super();
    if (Store.instance) return Store.instance;

    this.state = {
      coffees: [],
      logs: [],
      grinders: [],
      origins: [],
      processes: [],
      flavors: [],
      userSettings: { theme: 'light' }
    };

    this.init();
    Store.instance = this;
  }

  async init() {
    try {
      await this.fetchCoffees();
      await this.fetchLogs();
      await this.fetchReferenceData();
      
      // Keep settings local for now
      this.loadSettings();
      
      // Load processes from local or default
      const localProcesses = localStorage.getItem('dialin_processes');
      this.state.processes = localProcesses 
        ? JSON.parse(localProcesses) 
        : ['Washed', 'Natural', 'Honey', 'Anaerobic', 'Carbonic Maceration', 'Semi-Washed'];

      this.notify('init');
    } catch (error) {
      console.error('❌ Store init failed:', error);
    }
  }

  // --- HELPERS ---

  getActiveCoffees() {
    return this.state.coffees
      .filter(c => c.status !== 'archived')
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  }

  getArchivedCoffees() {
    return this.state.coffees
      .filter(c => c.status === 'archived')
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  }

  getRecentLogs(limit = 5) {
      return this.state.logs
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, limit);
  }

  getLogsForCoffee(coffeeId) {
      return this.state.logs
          .filter(log => log.coffeeId === coffeeId)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // --- API CRUD OPERATIONS ---

  async fetchCoffees() {
    try {
      const response = await fetch(`${API_URL}/coffees`);
      if (!response.ok) throw new Error('Failed to fetch coffees');
      this.state.coffees = await response.json();
      console.log('📦 Loaded inventory from API');
      this.notify('inventory-updated');
    } catch (err) {
      console.error(err);
    }
  }

  async createEmptyCoffee() {
    const newCoffee = {
        id: crypto.randomUUID(),
        name: 'Nowa Kawa',
        roaster: '',
        origin: '',
        roastDate: new Date().toISOString().split('T')[0],
        weightInitial: 250,
        weightCurrent: 250,
        status: 'active',
        dateAdded: new Date().toISOString(),
        accentColor: '#10b981',
        flavors: [],
        notes: ''
    };

    try {
        const response = await fetch(`${API_URL}/coffees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCoffee)
        });
        
        if (response.ok) {
            const savedCoffee = await response.json();
            this.state.coffees.push(savedCoffee);
            this.notify('inventory-updated');
            return savedCoffee.id;
        }
    } catch (err) {
        console.error('Failed to create coffee:', err);
    }
  }

  async updateCoffee(updatedFields) {
    const id = updatedFields.id;
    if (!id) return;

    try {
        // Optimistic UI Update possible here, but let's stick to simple sync for now
        const response = await fetch(`${API_URL}/coffees/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFields)
        });

        if (response.ok) {
            const updatedCoffee = await response.json();
            const index = this.state.coffees.findIndex(c => c.id === id);
            if (index !== -1) {
                this.state.coffees[index] = updatedCoffee;
                this.notify('inventory-updated');
            }
        }
    } catch (err) {
        console.error('Failed to update coffee:', err);
    }
  }

  async deleteCoffee(id) {
    try {
        const response = await fetch(`${API_URL}/coffees/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            this.state.coffees = this.state.coffees.filter(c => c.id !== id);
            this.notify('inventory-updated');
        }
    } catch (err) {
        console.error('Failed to delete coffee:', err);
    }
  }

  async archiveCoffee(id) {
      await this.updateCoffee({ id, status: 'archived' });
  }

  async unarchiveCoffee(id) {
      await this.updateCoffee({ id, status: 'active' });
  }

  // --- LOGS OPERATIONS ---

  async fetchLogs() {
      try {
          // If using json-server, ensure 'logs' endpoint exists in db.json or similar.
          // Fallback to local array if 404
          const response = await fetch(`${API_URL}/logs`);
          if (response.ok) {
              this.state.logs = await response.json();
          } else {
              this.state.logs = []; // Default empty
          }
          this.notify('logs-updated');
      } catch (err) {
          console.error('Failed to fetch logs:', err);
      }
  }

  async addLog(logData) {
      const newLog = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          ...logData
      };

      try {
          const response = await fetch(`${API_URL}/logs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newLog)
          });

          if (response.ok) {
              const savedLog = await response.json();
              this.state.logs.push(savedLog);
              this.notify('logs-updated');
              return savedLog.id;
          }
      } catch (err) {
          console.error('Failed to add log:', err);
      }
  }

  async updateLog(updatedFields) {
      const id = updatedFields.id;
      if (!id) return;
      
      try {
           const response = await fetch(`${API_URL}/logs/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedFields)
          });
          
          if (response.ok) {
              const updatedLog = await response.json();
              const index = this.state.logs.findIndex(l => l.id === id);
              if (index !== -1) {
                  this.state.logs[index] = updatedLog;
                  this.notify('logs-updated');
              }
          }
      } catch (err) {
          console.error('Failed to update log:', err);
      }
  }

  // --- REFERENCE DATA ---

  async fetchReferenceData() {
    // These could also move to DB, but fixtures are fine for static data
    const [grindersRes, originsRes, flavorsRes] = await Promise.all([
      fetch('../src/data/fixtures/grinders.json'),
      fetch('../src/data/fixtures/origins.json'),
      fetch('../src/data/fixtures/flavors.json')
    ]);
    this.state.grinders = await grindersRes.json();
    this.state.origins = await originsRes.json();
    this.state.flavors = await flavorsRes.json();
  }

  addProcess(processName) {
    if (!this.state.processes.includes(processName)) {
      this.state.processes.push(processName);
      localStorage.setItem('dialin_processes', JSON.stringify(this.state.processes));
      this.notify('reference-data-updated');
    }
  }

  // --- SETTINGS (Local Storage) ---

  updateSettings(newSettings) {
    this.state.userSettings = { ...this.state.userSettings, ...newSettings };
    localStorage.setItem('dialin_settings', JSON.stringify(this.state.userSettings));
    this.notify('settings-updated');
  }

  loadSettings() {
    const saved = localStorage.getItem('dialin_settings');
    if (saved) {
      this.state.userSettings = JSON.parse(saved);
    }
  }

  notify(type) {
    this.dispatchEvent(new CustomEvent(type));
  }
}

export const store = new Store();
