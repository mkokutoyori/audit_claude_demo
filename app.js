// ==========================================
// IndexedDB Database Manager
// ==========================================

class Database {
    constructor() {
        this.dbName = 'AuditExceptionDB';
        this.version = 4;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Upgrading database from version', event.oldVersion, 'to', event.newVersion);

                // Entities Store
                if (!db.objectStoreNames.contains('entities')) {
                    const entityStore = db.createObjectStore('entities', { keyPath: 'id', autoIncrement: true });
                    entityStore.createIndex('name', 'name', { unique: false });
                }

                // Fiscal Years Store
                if (!db.objectStoreNames.contains('fiscalYears')) {
                    const fyStore = db.createObjectStore('fiscalYears', { keyPath: 'id', autoIncrement: true });
                    fyStore.createIndex('year', 'year', { unique: true });
                }

                // Quarters Store
                if (!db.objectStoreNames.contains('quarters')) {
                    const quarterStore = db.createObjectStore('quarters', { keyPath: 'id', autoIncrement: true });
                    quarterStore.createIndex('fiscalYearId', 'fiscalYearId', { unique: false });
                }

                // Audit Reports Store
                if (!db.objectStoreNames.contains('reports')) {
                    const reportStore = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
                    reportStore.createIndex('entityId', 'entityId', { unique: false });
                    reportStore.createIndex('quarterId', 'quarterId', { unique: false });
                }

                // Exceptions Store
                if (!db.objectStoreNames.contains('exceptions')) {
                    const exceptionStore = db.createObjectStore('exceptions', { keyPath: 'id', autoIncrement: true });
                    exceptionStore.createIndex('reportId', 'reportId', { unique: false });
                    exceptionStore.createIndex('status', 'status', { unique: false });
                    exceptionStore.createIndex('risk_rating', 'risk_rating', { unique: false });
                }
            };
        });
    }

    async add(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(storeName, id) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async resetDatabase() {
        if (this.db) {
            this.db.close();
        }
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.dbName);
            request.onsuccess = () => {
                console.log('Database deleted successfully');
                resolve();
            };
            request.onerror = () => {
                console.error('Error deleting database:', request.error);
                reject(request.error);
            };
        });
    }
}

// Global function to reset the database if needed
async function resetAppDatabase() {
    if (confirm('This will delete all data and reset the application. Are you sure?')) {
        const db = new Database();
        await db.resetDatabase();
        location.reload();
    }
}

// ==========================================
// Application State Manager
// ==========================================

class AppState {
    constructor() {
        this.db = new Database();
        this.currentView = 'dashboard';
        this.charts = {};
        this.filters = {
            exceptions: { search: '', status: '', risk: '', entity: '' },
            reports: { search: '', entity: '', year: '' },
            entities: { search: '' }
        };
    }

    async init() {
        await this.db.init();
        await this.loadSampleData();
        this.setupEventListeners();
        this.updateLanguageSelector();
        this.updateAllI18nTexts();
        this.renderDashboard();
    }

    // Change language
    changeLanguage(lang) {
        i18n.setLanguage(lang);
        this.updateLanguageSelector();
        this.updateAllI18nTexts();
        this.renderCurrentView();
        NotificationUtil.show(i18n.t('messages.updateSuccess'), 'success');
    }

    // Update all i18n texts in the DOM
    updateAllI18nTexts() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = i18n.t(key);
            if (translation && translation !== key) {
                element.textContent = translation;
            }
        });
    }

    // Update language selector
    updateLanguageSelector() {
        const selector = document.getElementById('language-selector');
        if (selector) {
            selector.value = i18n.getLanguage();
        }
    }

    // Render current view (refresh after language change)
    renderCurrentView() {
        this.switchView(this.currentView);
    }

    // Get overaged exceptions
    getOveragedExceptions(exceptions) {
        return exceptions.filter(ex => ex.status === 'open' && DateUtils.isOveraged(ex.target_date));
    }

    // Count overaged exceptions
    countOveraged(exceptions) {
        return this.getOveragedExceptions(exceptions).length;
    }

    async loadSampleData() {
        // Check if data already exists
        const entities = await this.db.getAll('entities');
        if (entities.length === 0) {
            // Add sample entities
            await this.db.add('entities', { name: 'Finance Department', manager: 'John Smith' });
            await this.db.add('entities', { name: 'IT Department', manager: 'Sarah Johnson' });
            await this.db.add('entities', { name: 'Operations', manager: 'Mike Williams' });
            await this.db.add('entities', { name: 'Human Resources', manager: 'Emily Brown' });

            // Add sample fiscal year
            const fyId = await this.db.add('fiscalYears', {
                year: '2024',
                startDate: '2024-01-01',
                endDate: '2024-12-31'
            });

            // Add quarters for the fiscal year
            await this.db.add('quarters', {
                fiscalYearId: fyId,
                name: 'Q1',
                startDate: '2024-01-01',
                endDate: '2024-03-31'
            });
            await this.db.add('quarters', {
                fiscalYearId: fyId,
                name: 'Q2',
                startDate: '2024-04-01',
                endDate: '2024-06-30'
            });
            await this.db.add('quarters', {
                fiscalYearId: fyId,
                name: 'Q3',
                startDate: '2024-07-01',
                endDate: '2024-09-30'
            });
            await this.db.add('quarters', {
                fiscalYearId: fyId,
                name: 'Q4',
                startDate: '2024-10-01',
                endDate: '2024-12-31'
            });
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Modal close
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.closeModal();
        });

        // Add buttons
        document.getElementById('add-exception-btn').addEventListener('click', () => this.showExceptionForm());
        document.getElementById('add-report-btn').addEventListener('click', () => this.showReportForm());
        document.getElementById('import-report-btn').addEventListener('click', () => this.showImportReportForm());
        document.getElementById('add-entity-btn').addEventListener('click', () => this.showEntityForm());
        document.getElementById('add-fiscalyear-btn').addEventListener('click', () => this.showFiscalYearForm());

        // Filters
        document.getElementById('exception-search').addEventListener('input', (e) => {
            this.filters.exceptions.search = e.target.value;
            this.renderExceptions();
        });
        document.getElementById('exception-status-filter').addEventListener('change', (e) => {
            this.filters.exceptions.status = e.target.value;
            this.renderExceptions();
        });
        document.getElementById('exception-risk-filter').addEventListener('change', (e) => {
            this.filters.exceptions.risk = e.target.value;
            this.renderExceptions();
        });
        document.getElementById('exception-entity-filter').addEventListener('change', (e) => {
            this.filters.exceptions.entity = e.target.value;
            this.renderExceptions();
        });

        document.getElementById('report-search').addEventListener('input', (e) => {
            this.filters.reports.search = e.target.value;
            this.renderReports();
        });
        document.getElementById('report-entity-filter').addEventListener('change', (e) => {
            this.filters.reports.entity = e.target.value;
            this.renderReports();
        });
        document.getElementById('report-year-filter').addEventListener('change', (e) => {
            this.filters.reports.year = e.target.value;
            this.renderReports();
        });

        document.getElementById('entity-search').addEventListener('input', (e) => {
            this.filters.entities.search = e.target.value;
            this.renderEntities();
        });

        // Report views
        document.querySelectorAll('.report-card .view-report-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cardId = e.target.closest('.report-card').id;
                this.showReportView(cardId);
            });
        });
    }

    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });

        // Update view sections
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        this.currentView = view;

        // Render appropriate view
        switch(view) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'exceptions':
                this.renderExceptions();
                this.updateExceptionFilters();
                break;
            case 'reports':
                this.renderReports();
                this.updateReportFilters();
                break;
            case 'entities':
                this.renderEntities();
                break;
            case 'fiscalyears':
                this.renderFiscalYears();
                break;
            case 'views':
                // Reports view - no initial render needed
                break;
        }
    }

    // Navigate to a specific view (alias for switchView)
    navigateTo(view) {
        this.switchView(view);
    }

    // ==========================================
    // Dashboard Methods
    // ==========================================

    async renderDashboard() {
        const exceptions = await this.db.getAll('exceptions');
        const openExceptions = exceptions.filter(e => e.status === 'open');
        const closedExceptions = exceptions.filter(e => e.status === 'closed');
        const closureRate = exceptions.length > 0
            ? Math.round((closedExceptions.length / exceptions.length) * 100)
            : 0;

        // Update metrics
        document.getElementById('metric-open').textContent = openExceptions.length;
        document.getElementById('metric-raised').textContent = exceptions.length;
        document.getElementById('metric-closed').textContent = closedExceptions.length;
        document.getElementById('metric-closure-rate').textContent = `${closureRate}%`;

        // Render charts
        await this.renderCharts();
    }

    async renderCharts() {
        const exceptions = await this.db.getAll('exceptions');
        const entities = await this.db.getAll('entities');

        // Status Chart
        const statusData = {
            open: exceptions.filter(e => e.status === 'open').length,
            closed: exceptions.filter(e => e.status === 'closed').length
        };

        this.renderPieChart('statusChart',
            ['Open', 'Closed'],
            [statusData.open, statusData.closed],
            ['#f59e0b', '#10b981']
        );

        // Risk Rating Chart
        const riskData = {
            exposure: exceptions.filter(e => e.risk_rating === 'exposure').length,
            concern: exceptions.filter(e => e.risk_rating === 'concern').length,
            housekeeping: exceptions.filter(e => e.risk_rating === 'housekeeping').length,
            observation: exceptions.filter(e => e.risk_rating === 'observation').length
        };

        this.renderPieChart('riskChart',
            ['Exposure', 'Concern', 'Housekeeping', 'Observation'],
            [riskData.exposure, riskData.concern, riskData.housekeeping, riskData.observation],
            ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
        );

        // Entity Chart
        const entityData = await this.getExceptionsByEntity();
        const entityLabels = entityData.map(e => e.name);
        const entityValues = entityData.map(e => e.count);

        this.renderBarChart('entityChart', entityLabels, entityValues);

        // Trend Chart (Monthly)
        const trendData = this.getMonthlyTrend(exceptions);
        this.renderLineChart('trendChart', trendData.labels, trendData.values);
    }

    async getExceptionsByEntity() {
        const exceptions = await this.db.getAll('exceptions');
        const reports = await this.db.getAll('reports');
        const entities = await this.db.getAll('entities');

        const entityMap = {};
        entities.forEach(entity => {
            entityMap[entity.id] = { name: entity.name, count: 0 };
        });

        for (const exception of exceptions) {
            const report = reports.find(r => r.id === exception.reportId);
            if (report && entityMap[report.entityId]) {
                entityMap[report.entityId].count++;
            }
        }

        return Object.values(entityMap);
    }

    getMonthlyTrend(exceptions) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthData = new Array(12).fill(0);

        exceptions.forEach(exception => {
            if (exception.created_date) {
                const month = new Date(exception.created_date).getMonth();
                monthData[month]++;
            }
        });

        return { labels: months, values: monthData };
    }

    renderPieChart(canvasId, labels, data, colors) {
        const ctx = document.getElementById(canvasId);

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderBarChart(canvasId, labels, data) {
        const ctx = document.getElementById(canvasId);

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Exceptions',
                    data: data,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderLineChart(canvasId, labels, data) {
        const ctx = document.getElementById(canvasId);

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Exceptions Raised',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // Entity Management
    // ==========================================

    async renderEntities() {
        const entities = await this.db.getAll('entities');
        const tbody = document.getElementById('entities-table-body');

        let filteredEntities = entities;
        if (this.filters.entities.search) {
            const search = this.filters.entities.search.toLowerCase();
            filteredEntities = entities.filter(e =>
                e.name.toLowerCase().includes(search) ||
                e.manager.toLowerCase().includes(search)
            );
        }

        if (filteredEntities.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">🏢</div>
                            <p>No entities found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredEntities.map(entity => `
            <tr>
                <td>${entity.name}</td>
                <td>${entity.manager}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-secondary" onclick="app.editEntity(${entity.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteEntity(${entity.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showEntityForm(entity = null) {
        const title = entity ? 'Edit Entity' : 'Add Entity';
        const body = `
            <form id="entity-form">
                <div class="form-group">
                    <label class="form-label">Entity Name *</label>
                    <input type="text" class="form-input" id="entity-name" value="${entity?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Responsible Manager *</label>
                    <input type="text" class="form-input" id="entity-manager" value="${entity?.manager || ''}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        `;

        this.showModal(title, body);

        document.getElementById('entity-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('entity-name').value,
                manager: document.getElementById('entity-manager').value
            };

            if (entity) {
                data.id = entity.id;
                await this.db.update('entities', data);
            } else {
                await this.db.add('entities', data);
            }

            this.closeModal();
            this.renderEntities();
            this.updateExceptionFilters();
            this.updateReportFilters();
        });
    }

    async editEntity(id) {
        const entity = await this.db.getById('entities', id);
        this.showEntityForm(entity);
    }

    async deleteEntity(id) {
        if (confirm('Are you sure you want to delete this entity?')) {
            await this.db.delete('entities', id);
            this.renderEntities();
        }
    }

    // ==========================================
    // Fiscal Year Management
    // ==========================================

    async renderFiscalYears() {
        const fiscalYears = await this.db.getAll('fiscalYears');
        const container = document.getElementById('fiscal-years-container');

        if (fiscalYears.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p>No fiscal years found. Create your first fiscal year to get started.</p>
                </div>
            `;
            return;
        }

        const html = await Promise.all(fiscalYears.map(async (fy) => {
            const quarters = await this.db.getByIndex('quarters', 'fiscalYearId', fy.id);
            return `
                <div class="fiscal-year-card">
                    <div class="fiscal-year-header">
                        <h3>Fiscal Year ${fy.year}</h3>
                        <div class="action-btns">
                            <button class="btn btn-sm btn-danger" onclick="app.deleteFiscalYear(${fy.id})">Delete</button>
                        </div>
                    </div>
                    <div class="quarters-grid">
                        ${quarters.map(q => `
                            <div class="quarter-card">
                                <h4>${q.name}</h4>
                                <p>${q.startDate} to ${q.endDate}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }));

        container.innerHTML = html.join('');
    }

    showFiscalYearForm() {
        const body = `
            <form id="fiscalyear-form">
                <div class="form-group">
                    <label class="form-label">Fiscal Year *</label>
                    <input type="text" class="form-input" id="fy-year" placeholder="e.g., 2024" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Start Date *</label>
                    <input type="date" class="form-input" id="fy-start" required>
                </div>
                <div class="form-group">
                    <label class="form-label">End Date *</label>
                    <input type="date" class="form-input" id="fy-end" required>
                </div>
                <div class="alert alert-info">
                    <strong>Note:</strong> Four quarters will be automatically created for this fiscal year.
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create</button>
                </div>
            </form>
        `;

        this.showModal('Add Fiscal Year', body);

        document.getElementById('fiscalyear-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const year = document.getElementById('fy-year').value;
            const startDate = document.getElementById('fy-start').value;
            const endDate = document.getElementById('fy-end').value;

            // Create fiscal year
            const fyId = await this.db.add('fiscalYears', { year, startDate, endDate });

            // Auto-create 4 quarters using proper calculation
            const quarters = DateUtils.calculateQuarterDates(startDate, endDate);

            for (const quarter of quarters) {
                await this.db.add('quarters', {
                    fiscalYearId: fyId,
                    ...quarter
                });
            }

            this.closeModal();
            this.renderFiscalYears();
            this.updateReportFilters();
        });
    }

    async deleteFiscalYear(id) {
        if (confirm('Are you sure? This will also delete all associated quarters and reports.')) {
            // Delete quarters
            const quarters = await this.db.getByIndex('quarters', 'fiscalYearId', id);
            for (const quarter of quarters) {
                await this.db.delete('quarters', quarter.id);
            }

            await this.db.delete('fiscalYears', id);
            this.renderFiscalYears();
        }
    }

    // ==========================================
    // Report Management
    // ==========================================

    async renderReports() {
        const reports = await this.db.getAll('reports');
        const entities = await this.db.getAll('entities');
        const quarters = await this.db.getAll('quarters');
        const fiscalYears = await this.db.getAll('fiscalYears');
        const tbody = document.getElementById('reports-table-body');

        let filteredReports = reports;

        // Apply filters
        if (this.filters.reports.search) {
            const search = this.filters.reports.search.toLowerCase();
            filteredReports = filteredReports.filter(r =>
                r.name.toLowerCase().includes(search)
            );
        }
        if (this.filters.reports.entity) {
            filteredReports = filteredReports.filter(r =>
                r.entityId === parseInt(this.filters.reports.entity)
            );
        }
        if (this.filters.reports.year) {
            const yearQuarters = quarters.filter(q =>
                q.fiscalYearId === parseInt(this.filters.reports.year)
            ).map(q => q.id);
            filteredReports = filteredReports.filter(r =>
                yearQuarters.includes(r.quarterId)
            );
        }

        if (filteredReports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">📋</div>
                            <p>No audit reports found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredReports.map(report => {
            const entity = entities.find(e => e.id === report.entityId);
            const quarter = quarters.find(q => q.id === report.quarterId);
            const fy = fiscalYears.find(f => f.id === quarter?.fiscalYearId);

            const ratingLabels = {
                'satisfactory': 'Satisfactory',
                'acceptable': 'Acceptable',
                'needs_improvement': 'Needs Improvement',
                'not_satisfactory': 'Not Satisfactory'
            };

            return `
                <tr>
                    <td><a href="#" class="link" onclick="app.viewReportDetail(${report.id}); return false;">${report.name}</a></td>
                    <td><a href="#" class="link" onclick="app.filterExceptionsByEntity(${entity?.id}); return false;">${entity?.name || 'N/A'}</a></td>
                    <td>${fy?.year || 'N/A'}</td>
                    <td>${quarter?.name || 'N/A'}</td>
                    <td>${report.date || 'N/A'}</td>
                    <td><span class="status-badge dept-rating-${report.department_rating || 'na'}">${ratingLabels[report.department_rating] || 'N/A'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-sm btn-primary" onclick="app.viewReportDetail(${report.id})" title="View Details">👁️</button>
                            <button class="btn btn-sm btn-info" onclick="app.generateReportEmail(${report.id})" title="Send Email">📧</button>
                            <button class="btn btn-sm btn-secondary" onclick="app.editReport(${report.id})" title="Edit">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteReport(${report.id})" title="Delete">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async showReportForm(report = null) {
        const entities = await this.db.getAll('entities');
        const fiscalYears = await this.db.getAll('fiscalYears');

        const title = report ? 'Edit Audit Report' : 'Add Audit Report';
        const body = `
            <form id="report-form">
                <div class="form-group">
                    <label class="form-label">Report Name *</label>
                    <input type="text" class="form-input" id="report-name" value="${report?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Entity *</label>
                    <select class="form-select" id="report-entity" required>
                        <option value="">Select Entity</option>
                        ${entities.map(e => `
                            <option value="${e.id}" ${report?.entityId === e.id ? 'selected' : ''}>
                                ${e.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Fiscal Year *</label>
                    <select class="form-select" id="report-fiscalyear" required>
                        <option value="">Select Fiscal Year</option>
                        ${fiscalYears.map(fy => `
                            <option value="${fy.id}">${fy.year}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Quarter *</label>
                    <select class="form-select" id="report-quarter" required>
                        <option value="">Select Quarter</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Report Date</label>
                    <input type="date" class="form-input" id="report-date" value="${report?.date || new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">Department Rating *</label>
                    <select class="form-select" id="report-dept-rating" required>
                        <option value="">Select Department Rating</option>
                        <option value="satisfactory" ${report?.department_rating === 'satisfactory' ? 'selected' : ''}>Satisfactory</option>
                        <option value="acceptable" ${report?.department_rating === 'acceptable' ? 'selected' : ''}>Acceptable</option>
                        <option value="needs_improvement" ${report?.department_rating === 'needs_improvement' ? 'selected' : ''}>Needs Improvement</option>
                        <option value="not_satisfactory" ${report?.department_rating === 'not_satisfactory' ? 'selected' : ''}>Not Satisfactory</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        `;

        this.showModal(title, body);

        // Handle fiscal year change to populate quarters
        document.getElementById('report-fiscalyear').addEventListener('change', async (e) => {
            const fyId = parseInt(e.target.value);
            const quarters = await this.db.getByIndex('quarters', 'fiscalYearId', fyId);
            const quarterSelect = document.getElementById('report-quarter');

            quarterSelect.innerHTML = '<option value="">Select Quarter</option>' +
                quarters.map(q => `
                    <option value="${q.id}" ${report?.quarterId === q.id ? 'selected' : ''}>
                        ${q.name} (${q.startDate} to ${q.endDate})
                    </option>
                `).join('');
        });

        // If editing, trigger fiscal year change to load quarters
        if (report) {
            const quarters = await this.db.getAll('quarters');
            const quarter = quarters.find(q => q.id === report.quarterId);
            if (quarter) {
                document.getElementById('report-fiscalyear').value = quarter.fiscalYearId;
                document.getElementById('report-fiscalyear').dispatchEvent(new Event('change'));
            }
        }

        document.getElementById('report-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const data = {
                name: document.getElementById('report-name').value,
                entityId: parseInt(document.getElementById('report-entity').value),
                quarterId: parseInt(document.getElementById('report-quarter').value),
                date: document.getElementById('report-date').value,
                department_rating: document.getElementById('report-dept-rating').value
            };

            if (report) {
                data.id = report.id;
                await this.db.update('reports', data);
            } else {
                await this.db.add('reports', data);
            }

            this.closeModal();
            this.renderReports();
        });
    }

    async editReport(id) {
        const report = await this.db.getById('reports', id);
        this.showReportForm(report);
    }

    async deleteReport(id) {
        if (confirm('Are you sure you want to delete this report?')) {
            await this.db.delete('reports', id);
            this.renderReports();
        }
    }

    async viewReportDetail(reportId) {
        const report = await this.db.getById('reports', reportId);
        const entity = await this.db.getById('entities', report.entityId);
        const quarter = await this.db.getById('quarters', report.quarterId);
        const fiscalYear = await this.db.getById('fiscalYears', quarter.fiscalYearId);
        const exceptions = await this.db.getByIndex('exceptions', 'reportId', reportId);

        const ratingLabels = {
            'satisfactory': 'Satisfactory',
            'acceptable': 'Acceptable',
            'needs_improvement': 'Needs Improvement',
            'not_satisfactory': 'Not Satisfactory'
        };

        document.getElementById('report-detail-title').textContent = report.name;

        const openExceptions = exceptions.filter(e => e.status === 'open');
        const closedExceptions = exceptions.filter(e => e.status === 'closed');

        let html = `
            <div class="report-section">
                <div class="report-info-grid">
                    <div class="info-item">
                        <span class="info-label">Entity:</span>
                        <span class="info-value"><a href="#" class="link" onclick="app.filterExceptionsByEntity(${entity.id}); return false;">${entity.name}</a></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Fiscal Year:</span>
                        <span class="info-value">${fiscalYear.year}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Quarter:</span>
                        <span class="info-value">${quarter.name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Report Date:</span>
                        <span class="info-value">${i18n.formatDate(report.date)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Department Rating:</span>
                        <span class="info-value"><span class="status-badge dept-rating-${report.department_rating || 'na'}">${ratingLabels[report.department_rating] || 'N/A'}</span></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Exceptions:</span>
                        <span class="info-value">${exceptions.length} (${openExceptions.length} open, ${closedExceptions.length} closed)</span>
                    </div>
                </div>

                <div class="action-buttons" style="margin-top: 1.5rem;">
                    <button class="btn btn-info" onclick="app.generateReportEmail(${reportId})">📧 Generate Email</button>
                    <button class="btn btn-secondary" onclick="app.editReport(${reportId})">✏️ Edit Report</button>
                </div>
            </div>

            <div class="report-section">
                <h3>Exceptions (${exceptions.length})</h3>
                ${exceptions.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>No exceptions found</p></div>' : `
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Risk Rating</th>
                                    <th>Status</th>
                                    <th>Target Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${exceptions.map(exc => {
                                    const isOveraged = DateUtils.isOveraged(exc.target_date);
                                    const daysOverdue = DateUtils.getDaysOverdue(exc.target_date);

                                    return `
                                        <tr>
                                            <td>${exc.title}</td>
                                            <td><span class="status-badge risk-${exc.risk_rating}">${exc.risk_rating.toUpperCase()}</span></td>
                                            <td><span class="status-badge status-${exc.status} ${isOveraged && exc.status === 'open' ? 'status-overaged' : ''}">${isOveraged && exc.status === 'open' ? '⚠️ OVERAGED' : exc.status.toUpperCase()}</span></td>
                                            <td>${i18n.formatDate(exc.target_date)}${isOveraged && exc.status === 'open' ? ` (${daysOverdue} days overdue)` : ''}</td>
                                            <td>
                                                <div class="action-btns">
                                                    <button class="btn btn-sm btn-secondary" onclick="app.viewException(${exc.id})">View</button>
                                                    <button class="btn btn-sm btn-secondary" onclick="app.editException(${exc.id})">Edit</button>
                                                    ${exc.status === 'open' ? `<button class="btn btn-sm btn-success" onclick="app.closeException(${exc.id})">Close</button>` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;

        document.getElementById('report-detail-content').innerHTML = html;
        this.navigateTo('report-detail');
    }

    async filterExceptionsByEntity(entityId) {
        this.filters.exceptions.entity = entityId.toString();
        this.navigateTo('exceptions');
        await this.renderExceptions();

        // Update the dropdown to reflect the selected entity
        const entityFilter = document.getElementById('exception-entity-filter');
        if (entityFilter) {
            entityFilter.value = entityId.toString();
        }
    }

    async generateReportEmail(reportId) {
        const report = await this.db.getById('reports', reportId);
        const entity = await this.db.getById('entities', report.entityId);
        const exceptions = await this.db.getByIndex('exceptions', 'reportId', reportId);
        const openExceptions = exceptions.filter(e => e.status === 'open');

        if (openExceptions.length === 0) {
            NotificationUtil.show('No open exceptions found for this report', 'info');
            return;
        }

        const emailContent = EmailGenerator.generateReportEmail(report, entity, openExceptions, i18n.getLanguage());

        // Store the email content and previous view
        this.currentEmailContent = emailContent;
        this.previousViewBeforeEmail = this.currentView;

        // Display in dedicated email view
        document.getElementById('email-content').textContent = emailContent;
        this.navigateTo('email');
    }

    goBackFromEmail() {
        // Return to previous view
        if (this.previousViewBeforeEmail) {
            this.navigateTo(this.previousViewBeforeEmail);
        } else {
            this.navigateTo('reports');
        }
    }

    copyEmailToClipboard() {
        if (this.currentEmailContent) {
            EmailGenerator.copyToClipboard(this.currentEmailContent).then(success => {
                if (success) {
                    NotificationUtil.show('Email copied to clipboard!', 'success');
                } else {
                    NotificationUtil.show('Failed to copy to clipboard', 'error');
                }
            });
        }
    }

    downloadEmail() {
        if (this.currentEmailContent) {
            const filename = `audit_follow_up_${new Date().toISOString().split('T')[0]}.txt`;
            EmailGenerator.downloadEmail(this.currentEmailContent, filename);
            NotificationUtil.show('Email downloaded!', 'success');
        }
    }

    async showImportReportForm() {
        const entities = await this.db.getAll('entities');
        const fiscalYears = await this.db.getAll('fiscalYears');

        const jsonExample = {
            "report": {
                "name": "Q1 2024 IT Audit",
                "date": "2024-03-31",
                "department_rating": "acceptable"
            },
            "exceptions": [
                {
                    "title": "Password Policy Not Enforced",
                    "description": "Password complexity requirements are not enforced system-wide",
                    "risk": "Weak passwords increase risk of unauthorized access",
                    "risk_rating": "concern",
                    "recommendations": "Implement and enforce password policy across all systems",
                    "response": "Management agrees and will implement by Q2",
                    "action_plan": "Update AD policies and deploy to all systems",
                    "root_cause": "Policy was not configured during initial setup",
                    "target_date": "2024-06-30",
                    "status": "open"
                }
            ]
        };

        const body = `
            <form id="import-report-form">
                <div class="alert alert-info">
                    <strong>JSON Structure:</strong> Your JSON should follow this format:
                    <details style="margin-top: 0.5rem;">
                        <summary style="cursor: pointer; font-weight: 600;">Click to see example</summary>
                        <pre style="background: #f8fafc; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.75rem; margin-top: 0.5rem;">${JSON.stringify(jsonExample, null, 2)}</pre>
                    </details>
                </div>
                <div class="form-group">
                    <label class="form-label">JSON Data *</label>
                    <textarea class="json-editor" id="import-json" placeholder="Paste JSON here..." required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Entity *</label>
                    <select class="form-select" id="import-entity" required>
                        <option value="">Select Entity</option>
                        ${entities.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Fiscal Year *</label>
                    <select class="form-select" id="import-fiscalyear" required>
                        <option value="">Select Fiscal Year</option>
                        ${fiscalYears.map(fy => `<option value="${fy.id}">${fy.year}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Quarter *</label>
                    <select class="form-select" id="import-quarter" required>
                        <option value="">Select Quarter</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Import</button>
                </div>
            </form>
        `;

        this.showModal('Import Audit Report from JSON', body);

        // Handle fiscal year change to populate quarters
        document.getElementById('import-fiscalyear').addEventListener('change', async (e) => {
            const fyId = parseInt(e.target.value);
            const quarters = await this.db.getByIndex('quarters', 'fiscalYearId', fyId);
            const quarterSelect = document.getElementById('import-quarter');

            quarterSelect.innerHTML = '<option value="">Select Quarter</option>' +
                quarters.map(q => `
                    <option value="${q.id}">
                        ${q.name} (${q.startDate} to ${q.endDate})
                    </option>
                `).join('');
        });

        document.getElementById('import-report-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const jsonData = JSON.parse(document.getElementById('import-json').value);
                const entityId = parseInt(document.getElementById('import-entity').value);
                const quarterId = parseInt(document.getElementById('import-quarter').value);

                // Create the report
                const reportData = {
                    name: jsonData.report?.name || 'Imported Report',
                    entityId: entityId,
                    quarterId: quarterId,
                    date: jsonData.report?.date || new Date().toISOString().split('T')[0],
                    department_rating: jsonData.report?.department_rating || 'acceptable'
                };

                const reportId = await this.db.add('reports', reportData);

                // Create exceptions
                if (jsonData.exceptions && Array.isArray(jsonData.exceptions)) {
                    for (const exc of jsonData.exceptions) {
                        await this.db.add('exceptions', {
                            reportId: reportId,
                            title: exc.title || 'Untitled Exception',
                            description: exc.description || '',
                            risk: exc.risk || '',
                            risk_rating: exc.risk_rating || 'observation',
                            recommendations: exc.recommendations || '',
                            response: exc.response || '',
                            action_plan: exc.action_plan || '',
                            root_cause: exc.root_cause || '',
                            target_date: exc.target_date || '',
                            status: exc.status || 'open',
                            created_date: new Date().toISOString().split('T')[0]
                        });
                    }
                }

                this.closeModal();
                this.renderReports();
                NotificationUtil.show('Report imported successfully!', 'success');
            } catch (error) {
                console.error('Import error:', error);
                NotificationUtil.show('Failed to import report. Please check the JSON format.', 'error');
            }
        });
    }

    async updateReportFilters() {
        const entities = await this.db.getAll('entities');
        const fiscalYears = await this.db.getAll('fiscalYears');

        const entityFilter = document.getElementById('report-entity-filter');
        entityFilter.innerHTML = '<option value="">All Entities</option>' +
            entities.map(e => `<option value="${e.id}">${e.name}</option>`).join('');

        const yearFilter = document.getElementById('report-year-filter');
        yearFilter.innerHTML = '<option value="">All Years</option>' +
            fiscalYears.map(fy => `<option value="${fy.id}">${fy.year}</option>`).join('');
    }

    // ==========================================
    // Exception Management
    // ==========================================

    async renderExceptions() {
        const exceptions = await this.db.getAll('exceptions');
        const reports = await this.db.getAll('reports');
        const entities = await this.db.getAll('entities');
        const tbody = document.getElementById('exceptions-table-body');

        let filteredExceptions = exceptions;

        // Apply filters
        if (this.filters.exceptions.search) {
            const search = this.filters.exceptions.search.toLowerCase();
            filteredExceptions = filteredExceptions.filter(ex =>
                ex.title.toLowerCase().includes(search) ||
                ex.description?.toLowerCase().includes(search)
            );
        }
        if (this.filters.exceptions.status) {
            if (this.filters.exceptions.status === 'overaged') {
                filteredExceptions = filteredExceptions.filter(ex =>
                    ex.status === 'open' && DateUtils.isOveraged(ex.target_date)
                );
            } else {
                filteredExceptions = filteredExceptions.filter(ex =>
                    ex.status === this.filters.exceptions.status
                );
            }
        }
        if (this.filters.exceptions.risk) {
            filteredExceptions = filteredExceptions.filter(ex =>
                ex.risk_rating === this.filters.exceptions.risk
            );
        }
        if (this.filters.exceptions.entity) {
            const entityReports = reports.filter(r =>
                r.entityId === parseInt(this.filters.exceptions.entity)
            ).map(r => r.id);
            filteredExceptions = filteredExceptions.filter(ex =>
                entityReports.includes(ex.reportId)
            );
        }

        if (filteredExceptions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">⚠️</div>
                            <p>No exceptions found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredExceptions.map(exception => {
            const report = reports.find(r => r.id === exception.reportId);
            const entity = entities.find(e => e.id === report?.entityId);
            const isOveraged = exception.status === 'open' && DateUtils.isOveraged(exception.target_date);
            const daysOverdue = DateUtils.getDaysOverdue(exception.target_date);

            return `
                <tr ${isOveraged ? 'style="background-color: #fef2f2;"' : ''}>
                    <td><strong>${exception.title}</strong></td>
                    <td>${entity?.name || 'N/A'}</td>
                    <td><span class="status-badge risk-${exception.risk_rating}">${exception.risk_rating}</span></td>
                    <td>
                        <span class="status-badge status-${exception.status}">${exception.status}</span>
                        ${isOveraged ? `<span class="status-badge status-overaged">⚠️ OVERAGED</span>` : ''}
                    </td>
                    <td>
                        ${exception.target_date ? i18n.formatDate(exception.target_date) : 'N/A'}
                        ${isOveraged ? `<br><span class="overaged-indicator">${daysOverdue} days overdue</span>` : ''}
                    </td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-sm btn-secondary" onclick="app.viewException(${exception.id})">View</button>
                            ${exception.status === 'open' ? `
                                <button class="btn btn-sm btn-success" onclick="app.closeException(${exception.id})">Close</button>
                            ` : ''}
                            <button class="btn btn-sm btn-danger" onclick="app.deleteException(${exception.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async showExceptionForm(exception = null) {
        const reports = await this.db.getAll('reports');
        const entities = await this.db.getAll('entities');
        const quarters = await this.db.getAll('quarters');
        const fiscalYears = await this.db.getAll('fiscalYears');

        const title = exception ? 'Edit Exception' : 'Add Exception';
        const body = `
            <form id="exception-form">
                <div class="form-group">
                    <label class="form-label">Audit Report *</label>
                    <select class="form-select" id="exception-report" required>
                        <option value="">Select Report</option>
                        ${reports.map(r => {
                            const entity = entities.find(e => e.id === r.entityId);
                            const quarter = quarters.find(q => q.id === r.quarterId);
                            const fy = fiscalYears.find(f => f.id === quarter?.fiscalYearId);
                            return `
                                <option value="${r.id}" ${exception?.reportId === r.id ? 'selected' : ''}>
                                    ${r.name} - ${entity?.name} - ${fy?.year} ${quarter?.name}
                                </option>
                            `;
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" class="form-input" id="exception-title" value="${exception?.title || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea class="form-textarea" id="exception-description" required>${exception?.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Risk *</label>
                    <textarea class="form-textarea" id="exception-risk" required>${exception?.risk || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Risk Rating *</label>
                    <select class="form-select" id="exception-risk-rating" required>
                        <option value="">Select Risk Rating</option>
                        <option value="exposure" ${exception?.risk_rating === 'exposure' ? 'selected' : ''}>Exposure</option>
                        <option value="concern" ${exception?.risk_rating === 'concern' ? 'selected' : ''}>Concern</option>
                        <option value="housekeeping" ${exception?.risk_rating === 'housekeeping' ? 'selected' : ''}>Housekeeping</option>
                        <option value="observation" ${exception?.risk_rating === 'observation' ? 'selected' : ''}>Observation</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Recommendations *</label>
                    <textarea class="form-textarea" id="exception-recommendations" required>${exception?.recommendations || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Management Response</label>
                    <textarea class="form-textarea" id="exception-response">${exception?.response || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Action Plan</label>
                    <textarea class="form-textarea" id="exception-action-plan">${exception?.action_plan || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Root Cause</label>
                    <textarea class="form-textarea" id="exception-root-cause">${exception?.root_cause || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Target Date</label>
                    <input type="date" class="form-input" id="exception-target-date" value="${exception?.target_date || ''}">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        `;

        this.showModal(title, body);

        document.getElementById('exception-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const data = {
                reportId: parseInt(document.getElementById('exception-report').value),
                title: document.getElementById('exception-title').value,
                description: document.getElementById('exception-description').value,
                risk: document.getElementById('exception-risk').value,
                risk_rating: document.getElementById('exception-risk-rating').value,
                recommendations: document.getElementById('exception-recommendations').value,
                response: document.getElementById('exception-response').value,
                action_plan: document.getElementById('exception-action-plan').value,
                root_cause: document.getElementById('exception-root-cause').value,
                target_date: document.getElementById('exception-target-date').value,
                status: exception?.status || 'open',
                created_date: exception?.created_date || new Date().toISOString().split('T')[0]
            };

            if (exception) {
                data.id = exception.id;
                data.closure_date = exception.closure_date;
                data.closure_comments = exception.closure_comments;
                await this.db.update('exceptions', data);
            } else {
                await this.db.add('exceptions', data);
            }

            this.closeModal();
            this.renderExceptions();
            if (this.currentView === 'dashboard') {
                this.renderDashboard();
            }
        });
    }

    async viewException(id) {
        const exception = await this.db.getById('exceptions', id);
        const report = await this.db.getById('reports', exception.reportId);
        const entity = await this.db.getById('entities', report.entityId);

        const body = `
            <div class="exception-details">
                <div class="form-group">
                    <label class="form-label">Title</label>
                    <p>${exception.title}</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Entity</label>
                    <p>${entity.name}</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Report</label>
                    <p>${report.name}</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <p><span class="status-badge status-${exception.status}">${exception.status}</span></p>
                </div>
                <div class="form-group">
                    <label class="form-label">Risk Rating</label>
                    <p><span class="status-badge risk-${exception.risk_rating}">${exception.risk_rating}</span></p>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <p>${exception.description}</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Risk</label>
                    <p>${exception.risk}</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Recommendations</label>
                    <p>${exception.recommendations}</p>
                </div>
                ${exception.response ? `
                <div class="form-group">
                    <label class="form-label">Management Response</label>
                    <p>${exception.response}</p>
                </div>
                ` : ''}
                ${exception.action_plan ? `
                <div class="form-group">
                    <label class="form-label">Action Plan</label>
                    <p>${exception.action_plan}</p>
                </div>
                ` : ''}
                ${exception.root_cause ? `
                <div class="form-group">
                    <label class="form-label">Root Cause</label>
                    <p>${exception.root_cause}</p>
                </div>
                ` : ''}
                <div class="form-group">
                    <label class="form-label">Target Date</label>
                    <p>${exception.target_date || 'Not set'}</p>
                </div>
                ${exception.status === 'closed' ? `
                <div class="form-group">
                    <label class="form-label">Closure Date</label>
                    <p>${exception.closure_date}</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Closure Comments</label>
                    <p>${exception.closure_comments}</p>
                </div>
                ` : ''}
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Close</button>
                    <button type="button" class="btn btn-primary" onclick="app.closeModal(); app.showExceptionForm(${JSON.stringify(exception).replace(/"/g, '&quot;')})">Edit</button>
                </div>
            </div>
        `;

        this.showModal('Exception Details', body);
    }

    async closeException(id) {
        const exception = await this.db.getById('exceptions', id);

        const body = `
            <form id="close-exception-form">
                <div class="alert alert-info">
                    You are closing exception: <strong>${exception.title}</strong>
                </div>
                <div class="form-group">
                    <label class="form-label">Closure Date *</label>
                    <input type="date" class="form-input" id="closure-date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Closure Comments *</label>
                    <textarea class="form-textarea" id="closure-comments" placeholder="Document the actions taken, resolution details, and any relevant information..." required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-success">Close Exception</button>
                </div>
            </form>
        `;

        this.showModal('Close Exception', body);

        document.getElementById('close-exception-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            exception.status = 'closed';
            exception.closure_date = document.getElementById('closure-date').value;
            exception.closure_comments = document.getElementById('closure-comments').value;

            await this.db.update('exceptions', exception);

            this.closeModal();
            this.renderExceptions();
            if (this.currentView === 'dashboard') {
                this.renderDashboard();
            }
        });
    }

    async editException(id) {
        const exception = await this.db.getById('exceptions', id);
        this.showExceptionForm(exception);
    }

    async deleteException(id) {
        if (confirm('Are you sure you want to delete this exception?')) {
            await this.db.delete('exceptions', id);
            this.renderExceptions();
            if (this.currentView === 'dashboard') {
                this.renderDashboard();
            }
        }
    }

    async updateExceptionFilters() {
        const entities = await this.db.getAll('entities');
        const entityFilter = document.getElementById('exception-entity-filter');
        entityFilter.innerHTML = '<option value="">All Entities</option>' +
            entities.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    }

    // ==========================================
    // Report Views
    // ==========================================

    async showReportView(viewId) {
        const container = document.getElementById('statistics-detail-content');
        const titleElement = document.getElementById('statistics-detail-title');

        let title = '';
        switch(viewId) {
            case 'view-exceptions-by-quarter':
                title = 'Exceptions by Quarter';
                await this.renderExceptionsByQuarter(container);
                break;
            case 'view-exceptions-by-entity':
                title = 'Exceptions by Entity';
                await this.renderExceptionsByEntity(container);
                break;
            case 'view-open-exceptions-by-quarter':
                title = 'Open Exceptions by Quarter';
                await this.renderOpenExceptionsByQuarter(container);
                break;
            case 'view-department-rating-timeline':
                title = 'Department Rating Timeline';
                await this.renderDepartmentRatingTimeline(container);
                break;
            case 'view-quarterly-statistics':
                title = 'Quarterly Statistics by Unit';
                await this.renderQuarterlyStatistics(container);
                break;
            case 'view-fiscal-year-closure':
                title = 'Fiscal Year Closure Statistics';
                await this.renderFiscalYearClosure(container);
                break;
        }

        titleElement.textContent = title;
        this.navigateTo('statistics-detail');
    }

    async renderExceptionsByQuarter(container) {
        const exceptions = await this.db.getAll('exceptions');
        const reports = await this.db.getAll('reports');
        const quarters = await this.db.getAll('quarters');
        const fiscalYears = await this.db.getAll('fiscalYears');

        const quarterMap = {};

        for (const exception of exceptions) {
            const report = reports.find(r => r.id === exception.reportId);
            if (!report) continue;

            const quarter = quarters.find(q => q.id === report.quarterId);
            if (!quarter) continue;

            const fy = fiscalYears.find(f => f.id === quarter.fiscalYearId);
            const key = `${fy.year}-${quarter.name}`;

            if (!quarterMap[key]) {
                quarterMap[key] = {
                    year: fy.year,
                    quarter: quarter.name,
                    exceptions: []
                };
            }

            quarterMap[key].exceptions.push({
                ...exception,
                reportName: report.name
            });
        }

        let html = '<h2 class="mb-3">Exceptions by Quarter</h2>';

        Object.values(quarterMap).forEach(data => {
            html += `
                <div class="report-section">
                    <h3>FY ${data.year} - ${data.quarter}</h3>
                    ${data.exceptions.map(ex => `
                        <div class="exception-item">
                            <h4>${ex.title}</h4>
                            <p><strong>Report:</strong> ${ex.reportName}</p>
                            <p><strong>Risk Rating:</strong> <span class="status-badge risk-${ex.risk_rating}">${ex.risk_rating}</span></p>
                            <p><strong>Status:</strong> <span class="status-badge status-${ex.status}">${ex.status}</span></p>
                            <p><strong>Description:</strong> ${ex.description}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    async renderExceptionsByEntity(container) {
        const exceptions = await this.db.getAll('exceptions');
        const reports = await this.db.getAll('reports');
        const entities = await this.db.getAll('entities');

        const entityMap = {};

        for (const exception of exceptions) {
            const report = reports.find(r => r.id === exception.reportId);
            if (!report) continue;

            const entity = entities.find(e => e.id === report.entityId);
            if (!entity) continue;

            if (!entityMap[entity.id]) {
                entityMap[entity.id] = {
                    name: entity.name,
                    manager: entity.manager,
                    exceptions: []
                };
            }

            entityMap[entity.id].exceptions.push({
                ...exception,
                reportName: report.name
            });
        }

        let html = '<h2 class="mb-3">Exceptions by Entity</h2>';

        Object.values(entityMap).forEach(data => {
            html += `
                <div class="report-section">
                    <h3>${data.name} (Manager: ${data.manager})</h3>
                    <p class="text-muted">Total Exceptions: ${data.exceptions.length}</p>
                    ${data.exceptions.map(ex => `
                        <div class="exception-item">
                            <h4>${ex.title}</h4>
                            <p><strong>Report:</strong> ${ex.reportName}</p>
                            <p><strong>Risk Rating:</strong> <span class="status-badge risk-${ex.risk_rating}">${ex.risk_rating}</span></p>
                            <p><strong>Status:</strong> <span class="status-badge status-${ex.status}">${ex.status}</span></p>
                            <p><strong>Description:</strong> ${ex.description}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    async renderOpenExceptionsByQuarter(container) {
        const exceptions = await this.db.getAll('exceptions');
        const openExceptions = exceptions.filter(e => e.status === 'open');
        const reports = await this.db.getAll('reports');
        const quarters = await this.db.getAll('quarters');
        const fiscalYears = await this.db.getAll('fiscalYears');

        const quarterMap = {};

        for (const exception of openExceptions) {
            const report = reports.find(r => r.id === exception.reportId);
            if (!report) continue;

            const quarter = quarters.find(q => q.id === report.quarterId);
            if (!quarter) continue;

            const fy = fiscalYears.find(f => f.id === quarter.fiscalYearId);
            const key = `${fy.year}-${quarter.name}`;

            if (!quarterMap[key]) {
                quarterMap[key] = {
                    year: fy.year,
                    quarter: quarter.name,
                    exceptions: []
                };
            }

            quarterMap[key].exceptions.push({
                ...exception,
                reportName: report.name
            });
        }

        let html = '<h2 class="mb-3">Open Exceptions by Quarter</h2>';

        if (Object.keys(quarterMap).length === 0) {
            html += '<div class="empty-state"><div class="empty-state-icon">✅</div><p>No open exceptions found!</p></div>';
        } else {
            Object.values(quarterMap).forEach(data => {
                html += `
                    <div class="report-section">
                        <h3>FY ${data.year} - ${data.quarter} (${data.exceptions.length} Open)</h3>
                        ${data.exceptions.map(ex => `
                            <div class="exception-item">
                                <h4>${ex.title}</h4>
                                <p><strong>Report:</strong> ${ex.reportName}</p>
                                <p><strong>Risk Rating:</strong> <span class="status-badge risk-${ex.risk_rating}">${ex.risk_rating}</span></p>
                                <p><strong>Target Date:</strong> ${ex.target_date || 'Not set'}</p>
                                <p><strong>Description:</strong> ${ex.description}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    }

    async renderDepartmentRatingTimeline(container) {
        const reports = await this.db.getAll('reports');
        const entities = await this.db.getAll('entities');
        const quarters = await this.db.getAll('quarters');
        const fiscalYears = await this.db.getAll('fiscalYears');

        const entityMap = {};

        // Group reports by entity
        for (const report of reports) {
            const entity = entities.find(e => e.id === report.entityId);
            if (!entity) continue;

            if (!entityMap[entity.id]) {
                entityMap[entity.id] = {
                    name: entity.name,
                    manager: entity.manager,
                    ratings: []
                };
            }

            const quarter = quarters.find(q => q.id === report.quarterId);
            const fy = fiscalYears.find(f => f.id === quarter?.fiscalYearId);

            entityMap[entity.id].ratings.push({
                reportName: report.name,
                rating: report.department_rating,
                date: report.date,
                fiscalYear: fy?.year,
                quarter: quarter?.name
            });
        }

        // Sort ratings by date
        Object.values(entityMap).forEach(entity => {
            entity.ratings.sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        const ratingLabels = {
            'satisfactory': 'Satisfactory',
            'acceptable': 'Acceptable',
            'needs_improvement': 'Needs Improvement',
            'not_satisfactory': 'Not Satisfactory'
        };

        let html = '<h2 class="mb-3">Department Rating Timeline</h2>';

        if (Object.keys(entityMap).length === 0) {
            html += '<div class="empty-state"><div class="empty-state-icon">📊</div><p>No department ratings found!</p></div>';
        } else {
            Object.values(entityMap).forEach(entity => {
                html += `
                    <div class="report-section">
                        <h3>${entity.name}</h3>
                        <p class="text-muted">Manager: ${entity.manager} | Total Audits: ${entity.ratings.length}</p>
                        <div class="timeline">
                            ${entity.ratings.map((rating, index) => `
                                <div class="timeline-item">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <div class="timeline-date">${i18n.formatDate(rating.date)} - ${rating.fiscalYear} ${rating.quarter}</div>
                                        <div class="timeline-report"><strong>${rating.reportName}</strong></div>
                                        <div class="timeline-rating">
                                            <span class="status-badge dept-rating-${rating.rating || 'na'}">${ratingLabels[rating.rating] || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    }

    async renderQuarterlyStatistics(container) {
        const fiscalYears = await this.db.getAll('fiscalYears');

        if (fiscalYears.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>No fiscal years found</p></div>';
            return;
        }

        let html = '<h2 class="mb-3">Quarterly Statistics by Unit</h2>';

        // Quarter selector
        html += `
            <div class="form-group" style="max-width: 400px; margin-bottom: 2rem;">
                <label class="form-label">Select Fiscal Year</label>
                <select class="form-select" id="stats-fiscalyear" onchange="app.loadQuarterlyStatsForYear()">
                    <option value="">Select Fiscal Year</option>
                    ${fiscalYears.map(fy => `<option value="${fy.id}">${fy.year}</option>`).join('')}
                </select>
            </div>
            <div class="form-group" style="max-width: 400px; margin-bottom: 2rem;">
                <label class="form-label">Select Quarter</label>
                <select class="form-select" id="stats-quarter">
                    <option value="">Select Quarter</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="app.generateQuarterlyStats()" style="margin-bottom: 2rem;">Generate Report</button>
            <div id="quarterly-stats-result"></div>
        `;

        container.innerHTML = html;
    }

    async loadQuarterlyStatsForYear() {
        const fyId = parseInt(document.getElementById('stats-fiscalyear').value);
        if (!fyId) return;

        const quarters = await this.db.getByIndex('quarters', 'fiscalYearId', fyId);
        const quarterSelect = document.getElementById('stats-quarter');

        quarterSelect.innerHTML = '<option value="">Select Quarter</option>' +
            quarters.map(q => `<option value="${q.id}">${q.name} (${q.startDate} to ${q.endDate})</option>`).join('');
    }

    async generateQuarterlyStats() {
        const quarterId = parseInt(document.getElementById('stats-quarter').value);
        if (!quarterId) {
            NotificationUtil.show('Please select a quarter', 'error');
            return;
        }

        const reports = await this.db.getByIndex('reports', 'quarterId', quarterId);
        const entities = await this.db.getAll('entities');
        const exceptions = await this.db.getAll('exceptions');

        // Build statistics by entity
        const stats = [];
        let totalExposure = 0, totalConcern = 0, totalHousekeeping = 0, totalObservation = 0, totalAll = 0;

        for (const entity of entities) {
            const entityReports = reports.filter(r => r.entityId === entity.id);
            if (entityReports.length === 0) continue;

            let exposure = 0, concern = 0, housekeeping = 0, observation = 0;
            let unitRating = 'N/A';

            for (const report of entityReports) {
                const reportExceptions = exceptions.filter(e => e.reportId === report.id);
                exposure += reportExceptions.filter(e => e.risk_rating === 'exposure').length;
                concern += reportExceptions.filter(e => e.risk_rating === 'concern').length;
                housekeeping += reportExceptions.filter(e => e.risk_rating === 'housekeeping').length;
                observation += reportExceptions.filter(e => e.risk_rating === 'observation').length;

                // Get the most recent rating
                if (report.department_rating && unitRating === 'N/A') {
                    unitRating = report.department_rating;
                }
            }

            const total = exposure + concern + housekeeping + observation;
            if (total > 0) {
                stats.push({
                    unit: entity.name,
                    exposure,
                    concern,
                    housekeeping,
                    observation,
                    total,
                    rating: unitRating
                });

                totalExposure += exposure;
                totalConcern += concern;
                totalHousekeeping += housekeeping;
                totalObservation += observation;
                totalAll += total;
            }
        }

        const ratingLabels = {
            'satisfactory': 'Satisfactory',
            'acceptable': 'Acceptable',
            'needs_improvement': 'Needs Improvement',
            'not_satisfactory': 'Not Satisfactory',
            'N/A': 'N/A'
        };

        // Generate HTML table
        let html = `
            <div class="report-section">
                <h3>Exceptions by Unit and Risk Rating</h3>
                <div class="table-container">
                    <table class="data-table" style="font-size: 0.875rem;">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Unit</th>
                                <th colspan="4" style="text-align: center;">Count per Risk Ratings</th>
                                <th>Total</th>
                                <th>Unit's Rating</th>
                            </tr>
                            <tr>
                                <th></th>
                                <th></th>
                                <th>Exposure</th>
                                <th>Concern</th>
                                <th>Housekeeping</th>
                                <th>Observation</th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.map((stat, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td><strong>${stat.unit}</strong></td>
                                    <td style="text-align: center;">${stat.exposure}</td>
                                    <td style="text-align: center;">${stat.concern}</td>
                                    <td style="text-align: center;">${stat.housekeeping}</td>
                                    <td style="text-align: center;">${stat.observation}</td>
                                    <td style="text-align: center;"><strong>${stat.total}</strong></td>
                                    <td><span class="status-badge dept-rating-${stat.rating}">${ratingLabels[stat.rating]}</span></td>
                                </tr>
                            `).join('')}
                            <tr style="background-color: #f1f5f9; font-weight: 700;">
                                <td></td>
                                <td>TOTAL</td>
                                <td style="text-align: center;">${totalExposure}</td>
                                <td style="text-align: center;">${totalConcern}</td>
                                <td style="text-align: center;">${totalHousekeeping}</td>
                                <td style="text-align: center;">${totalObservation}</td>
                                <td style="text-align: center;">${totalAll}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('quarterly-stats-result').innerHTML = html;
    }

    async renderFiscalYearClosure(container) {
        const fiscalYears = await this.db.getAll('fiscalYears');

        if (fiscalYears.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>No fiscal years found</p></div>';
            return;
        }

        let html = '<h2 class="mb-3">Fiscal Year Closure Statistics</h2>';

        // Fiscal Year selector
        html += `
            <div class="form-group" style="max-width: 400px; margin-bottom: 2rem;">
                <label class="form-label">Select Fiscal Year</label>
                <select class="form-select" id="closure-fiscalyear">
                    <option value="">Select Fiscal Year</option>
                    ${fiscalYears.map(fy => `<option value="${fy.id}">${fy.year}</option>`).join('')}
                </select>
            </div>
            <button class="btn btn-primary" onclick="app.generateClosureStats()" style="margin-bottom: 2rem;">Generate Report</button>
            <div id="closure-stats-result"></div>
        `;

        container.innerHTML = html;
    }

    async generateClosureStats() {
        const fyId = parseInt(document.getElementById('closure-fiscalyear').value);
        if (!fyId) {
            NotificationUtil.show('Please select a fiscal year', 'error');
            return;
        }

        const quarters = await this.db.getByIndex('quarters', 'fiscalYearId', fyId);
        const quarterIds = quarters.map(q => q.id);
        const allReports = await this.db.getAll('reports');
        const reports = allReports.filter(r => quarterIds.includes(r.quarterId));
        const reportIds = reports.map(r => r.id);
        const allExceptions = await this.db.getAll('exceptions');
        const exceptions = allExceptions.filter(e => reportIds.includes(e.reportId));

        // Calculate statistics by risk rating
        const riskRatings = ['exposure', 'concern', 'housekeeping', 'observation'];
        const stats = {
            raised: {},
            closed: {},
            achievement: {}
        };

        let totalRaised = 0, totalClosed = 0;

        riskRatings.forEach(rating => {
            const raisedCount = exceptions.filter(e => e.risk_rating === rating).length;
            const closedCount = exceptions.filter(e => e.risk_rating === rating && e.status === 'closed').length;
            const achievement = raisedCount > 0 ? ((closedCount / raisedCount) * 100).toFixed(1) : '0.0';

            stats.raised[rating] = raisedCount;
            stats.closed[rating] = closedCount;
            stats.achievement[rating] = achievement;

            totalRaised += raisedCount;
            totalClosed += closedCount;
        });

        const totalAchievement = totalRaised > 0 ? ((totalClosed / totalRaised) * 100).toFixed(1) : '0.0';

        // Generate HTML table
        let html = `
            <div class="report-section">
                <h3>Closure Status by Risk Rating</h3>
                <div class="table-container">
                    <table class="data-table" style="font-size: 0.875rem;">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: center;">Exposure</th>
                                <th style="text-align: center;">Concern</th>
                                <th style="text-align: center;">Housekeeping</th>
                                <th style="text-align: center;">Observation</th>
                                <th style="text-align: center;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Raised</strong></td>
                                <td style="text-align: center;">${stats.raised.exposure}</td>
                                <td style="text-align: center;">${stats.raised.concern}</td>
                                <td style="text-align: center;">${stats.raised.housekeeping}</td>
                                <td style="text-align: center;">${stats.raised.observation}</td>
                                <td style="text-align: center;"><strong>${totalRaised}</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Closed</strong></td>
                                <td style="text-align: center;">${stats.closed.exposure}</td>
                                <td style="text-align: center;">${stats.closed.concern}</td>
                                <td style="text-align: center;">${stats.closed.housekeeping}</td>
                                <td style="text-align: center;">${stats.closed.observation}</td>
                                <td style="text-align: center;"><strong>${totalClosed}</strong></td>
                            </tr>
                            <tr style="background-color: #f1f5f9; font-weight: 700;">
                                <td><strong>Achievement (%)</strong></td>
                                <td style="text-align: center;">${stats.achievement.exposure}%</td>
                                <td style="text-align: center;">${stats.achievement.concern}%</td>
                                <td style="text-align: center;">${stats.achievement.housekeeping}%</td>
                                <td style="text-align: center;">${stats.achievement.observation}%</td>
                                <td style="text-align: center;"><strong>${totalAchievement}%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('closure-stats-result').innerHTML = html;
    }

    // ==========================================
    // Modal Management
    // ==========================================

    showModal(title, body) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = body;
        document.getElementById('modal').classList.add('active');
    }

    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }

    // ==========================================
    // Import/Export Database
    // ==========================================

    async exportDatabase() {
        try {
            const jsonData = await DataExporter.exportAllData(this.db);
            const filename = `audit_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
            DataExporter.downloadJSON(jsonData, filename);
            NotificationUtil.show('Database exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            NotificationUtil.show('Failed to export database', 'error');
        }
    }

    async importDatabase() {
        const body = `
            <form id="import-form">
                <div class="alert alert-info">
                    <strong>Warning:</strong> This will replace all existing data in the database. Make sure to export your current data first if you want to keep it.
                </div>
                <div class="form-group">
                    <label class="form-label">Select JSON File *</label>
                    <input type="file" class="form-input" id="import-file" accept=".json" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Import</button>
                </div>
            </form>
        `;

        this.showModal('Import Database', body);

        document.getElementById('import-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const fileInput = document.getElementById('import-file');
            const file = fileInput.files[0];

            if (!file) {
                NotificationUtil.show('Please select a file', 'error');
                return;
            }

            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const jsonString = event.target.result;

                    // Reset database first
                    await this.db.resetDatabase();

                    // Reinitialize database
                    await this.db.init();

                    // Import data
                    const success = await DataExporter.importAllData(this.db, jsonString);

                    if (success) {
                        this.closeModal();
                        NotificationUtil.show('Database imported successfully!', 'success');

                        // Refresh the current view
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
                    } else {
                        NotificationUtil.show('Failed to import database. Invalid format.', 'error');
                    }
                };

                reader.onerror = () => {
                    NotificationUtil.show('Failed to read file', 'error');
                };

                reader.readAsText(file);
            } catch (error) {
                console.error('Import error:', error);
                NotificationUtil.show('Failed to import database', 'error');
            }
        });
    }
}

// ==========================================
// Initialize Application
// ==========================================

let app;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new AppState();
        await app.init();
    } catch (error) {
        console.error('Application initialization error:', error);

        // Handle version error specifically
        if (error.name === 'VersionError') {
            const message = `
                Database version conflict detected. This usually happens when the database
                structure has changed. Would you like to reset the database?

                Warning: This will delete all existing data.
            `;

            if (confirm(message)) {
                try {
                    await resetAppDatabase();
                } catch (resetError) {
                    console.error('Error resetting database:', resetError);
                    alert('Failed to reset database. Please clear your browser data manually:\n\n' +
                          '1. Open Developer Tools (F12)\n' +
                          '2. Go to Application tab\n' +
                          '3. Clear Storage\n' +
                          '4. Reload the page');
                }
            }
        } else {
            alert('Failed to initialize application. Please check the console for details.');
        }
    }
});

// ==========================================
// Mobile Menu Toggle
// ==========================================

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-menu-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}
