// ==========================================
// IndexedDB Database Manager
// ==========================================

class Database {
    constructor() {
        this.dbName = 'AuditExceptionDB';
        this.version = 3;
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
        this.renderDashboard();
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
            high: exceptions.filter(e => e.risk_rating === 'high').length,
            medium: exceptions.filter(e => e.risk_rating === 'medium').length,
            low: exceptions.filter(e => e.risk_rating === 'low').length
        };

        this.renderPieChart('riskChart',
            ['High', 'Medium', 'Low'],
            [riskData.high, riskData.medium, riskData.low],
            ['#ef4444', '#f59e0b', '#3b82f6']
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

            // Auto-create 4 quarters
            const start = new Date(startDate);
            const end = new Date(endDate);
            const quarterLength = Math.ceil((end - start) / (4 * 24 * 60 * 60 * 1000));

            for (let i = 0; i < 4; i++) {
                const qStart = new Date(start);
                qStart.setDate(qStart.getDate() + (quarterLength * i));
                const qEnd = new Date(qStart);
                qEnd.setDate(qEnd.getDate() + quarterLength - 1);

                // Ensure last quarter ends on the fiscal year end date
                if (i === 3) {
                    qEnd.setTime(end.getTime());
                }

                await this.db.add('quarters', {
                    fiscalYearId: fyId,
                    name: `Q${i + 1}`,
                    startDate: qStart.toISOString().split('T')[0],
                    endDate: qEnd.toISOString().split('T')[0]
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
                    <td colspan="6" class="text-center">
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

            return `
                <tr>
                    <td>${report.name}</td>
                    <td>${entity?.name || 'N/A'}</td>
                    <td>${fy?.year || 'N/A'}</td>
                    <td>${quarter?.name || 'N/A'}</td>
                    <td>${report.date || 'N/A'}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-sm btn-secondary" onclick="app.editReport(${report.id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteReport(${report.id})">Delete</button>
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
                    <label class="form-label">Report Date *</label>
                    <input type="date" class="form-input" id="report-date" value="${report?.date || ''}" required>
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
                date: document.getElementById('report-date').value
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
            filteredExceptions = filteredExceptions.filter(ex =>
                ex.status === this.filters.exceptions.status
            );
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

            return `
                <tr>
                    <td><strong>${exception.title}</strong></td>
                    <td>${entity?.name || 'N/A'}</td>
                    <td><span class="status-badge risk-${exception.risk_rating}">${exception.risk_rating}</span></td>
                    <td><span class="status-badge status-${exception.status}">${exception.status}</span></td>
                    <td>${exception.target_date || 'N/A'}</td>
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
                        <option value="high" ${exception?.risk_rating === 'high' ? 'selected' : ''}>High</option>
                        <option value="medium" ${exception?.risk_rating === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="low" ${exception?.risk_rating === 'low' ? 'selected' : ''}>Low</option>
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
        const container = document.getElementById('report-details-container');
        container.style.display = 'block';

        switch(viewId) {
            case 'view-exceptions-by-quarter':
                await this.renderExceptionsByQuarter(container);
                break;
            case 'view-exceptions-by-entity':
                await this.renderExceptionsByEntity(container);
                break;
            case 'view-open-exceptions-by-quarter':
                await this.renderOpenExceptionsByQuarter(container);
                break;
        }
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
