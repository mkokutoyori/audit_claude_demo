// ==========================================
// App Enhancements
// Additional methods to be integrated into AppState class
// ==========================================

// Add these methods to AppState class

/*
// Enhanced renderDashboard with overaged metrics
async renderDashboard() {
    const exceptions = await this.db.getAll('exceptions');
    const openExceptions = exceptions.filter(e => e.status === 'open');
    const closedExceptions = exceptions.filter(e => e.status === 'closed');
    const overagedExceptions = this.getOveragedExceptions(exceptions);

    const closureRate = exceptions.length > 0
        ? Math.round((closedExceptions.length / exceptions.length) * 100)
        : 0;

    // Update metrics
    document.getElementById('metric-open').textContent = openExceptions.length;
    document.getElementById('metric-raised').textContent = exceptions.length;
    document.getElementById('metric-closed').textContent = closedExceptions.length;
    document.getElementById('metric-closure-rate').textContent = `${closureRate}%`;

    // Update overaged metric if exists
    const overagedMetric = document.getElementById('metric-overaged');
    if (overagedMetric) {
        overagedMetric.textContent = overagedExceptions.length;
    }

    // Render charts
    await this.renderCharts();
}

// Generate email for report exceptions
async showReportEmailDraft(reportId) {
    const report = await this.db.getById('reports', reportId);
    const entity = await this.db.getById('entities', report.entityId);
    const exceptions = await this.db.getByIndex('exceptions', 'reportId', reportId);
    const openExceptions = exceptions.filter(e => e.status === 'open');

    if (openExceptions.length === 0) {
        NotificationUtil.show('No open exceptions to follow up on', 'info');
        return;
    }

    const emailContent = EmailGenerator.generateReportEmail(report, entity, openExceptions, i18n.getLanguage());

    const body = `
        <div class="email-draft-container">
            <h3>${i18n.t('exceptions.emailDraft.title')}</h3>
            <div class="email-preview">${emailContent}</div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="EmailGenerator.copyToClipboard(\`${emailContent.replace(/`/g, '\\`')}\`).then(() => NotificationUtil.show('${i18n.t('messages.copied')}', 'success'))">
                    ${i18n.t('exceptions.emailDraft.copy')}
                </button>
                <button class="btn btn-primary" onclick="EmailGenerator.downloadEmail(\`${emailContent.replace(/`/g, '\\`')}\`, 'audit_follow_up_${report.name.replace(/[^a-z0-9]/gi, '_')}.txt')">
                    ${i18n.t('exceptions.emailDraft.download')}
                </button>
                <button class="btn btn-secondary" onclick="app.closeModal()">
                    ${i18n.t('common.close')}
                </button>
            </div>
        </div>
    `;

    this.showModal('Email Draft', body);
}

// Show import JSON dialog
async showImportReportDialog() {
    const entities = await this.db.getAll('entities');
    const fiscalYears = await this.db.getAll('fiscalYears');

    const body = `
        <form id="import-report-form">
            <div class="form-group">
                <label class="form-label">${i18n.t('reports.import.instructions')}</label>
                <textarea class="json-editor" id="import-json" placeholder="${i18n.t('reports.import.jsonPlaceholder')}"></textarea>
            </div>

            <div class="form-group">
                <label class="form-label">${i18n.t('reports.import.selectEntity')}</label>
                <select class="form-select" id="import-entity" required>
                    <option value="">${i18n.t('reports.form.selectEntity')}</option>
                    ${entities.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">${i18n.t('reports.form.fiscalYear')}</label>
                <select class="form-select" id="import-fiscalyear" required>
                    <option value="">${i18n.t('reports.form.selectFiscalYear')}</option>
                    ${fiscalYears.map(fy => `<option value="${fy.id}">${fy.year}</option>`).join('')}
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">${i18n.t('reports.form.quarter')}</label>
                <select class="form-select" id="import-quarter" required>
                    <option value="">${i18n.t('reports.form.selectQuarter')}</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">${i18n.t('reports.form.date')}</label>
                <input type="text" class="form-input" id="import-date" placeholder="dd/mm/yyyy" required>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">${i18n.t('common.cancel')}</button>
                <button type="submit" class="btn btn-primary">${i18n.t('reports.import.import')}</button>
            </div>
        </form>
    `;

    this.showModal(i18n.t('reports.import.title'), body);

    // Handle fiscal year change
    document.getElementById('import-fiscalyear').addEventListener('change', async (e) => {
        const fyId = parseInt(e.target.value);
        const quarters = await this.db.getByIndex('quarters', 'fiscalYearId', fyId);
        const quarterSelect = document.getElementById('import-quarter');

        quarterSelect.innerHTML = `<option value="">${i18n.t('reports.form.selectQuarter')}</option>` +
            quarters.map(q => `<option value="${q.id}">${q.name}</option>`).join('');
    });

    // Handle form submission
    document.getElementById('import-report-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const jsonString = document.getElementById('import-json').value;
        const data = DataExporter.parseReportJSON(jsonString);

        if (!data) {
            NotificationUtil.show(i18n.t('reports.import.error'), 'error');
            return;
        }

        const entityId = parseInt(document.getElementById('import-entity').value);
        const quarterId = parseInt(document.getElementById('import-quarter').value);
        const dateStr = document.getElementById('import-date').value;
        const date = DateUtils.toISODate(dateStr);

        // Create report
        const reportData = {
            name: data.report.name,
            entityId: entityId,
            quarterId: quarterId,
            date: date
        };

        const reportId = await this.db.add('reports', reportData);

        // Create exceptions
        for (const ex of data.exceptions) {
            const exceptionData = {
                reportId: reportId,
                title: ex.title,
                description: ex.description,
                risk: ex.risk,
                risk_rating: ex.risk_rating,
                recommendations: ex.recommendations,
                response: ex.response || '',
                action_plan: ex.action_plan || '',
                root_cause: ex.root_cause || '',
                target_date: ex.target_date ? DateUtils.toISODate(ex.target_date) : '',
                status: 'open',
                created_date: new Date().toISOString().split('T')[0]
            };

            await this.db.add('exceptions', exceptionData);
        }

        this.closeModal();
        this.renderReports();
        NotificationUtil.show(i18n.t('reports.import.success'), 'success');
    });
}

// Export report as JSON
async exportReportAsJSON(reportId) {
    const report = await this.db.getById('reports', reportId);
    const exceptions = await this.db.getByIndex('exceptions', 'reportId', reportId);

    const jsonString = await DataExporter.exportReport(this.db, report, exceptions);

    // Show export dialog
    const body = `
        <div>
            <h3>${i18n.t('reports.export.title')}</h3>
            <textarea class="json-editor" readonly>${jsonString}</textarea>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="EmailGenerator.copyToClipboard(\`${jsonString.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`).then(() => NotificationUtil.show('${i18n.t('reports.export.copied')}', 'success'))">
                    ${i18n.t('reports.export.copy')}
                </button>
                <button class="btn btn-primary" onclick="DataExporter.downloadJSON(\`${jsonString.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`, 'report_${report.name.replace(/[^a-z0-9]/gi, '_')}.json')">
                    ${i18n.t('reports.export.download')}
                </button>
                <button class="btn btn-secondary" onclick="app.closeModal()">
                    ${i18n.t('common.close')}
                </button>
            </div>
        </div>
    `;

    this.showModal(i18n.t('reports.export.title'), body);
}

// Export all data
async exportAllData() {
    const jsonString = await DataExporter.exportAllData(this.db);

    DataExporter.downloadJSON(jsonString, `audit_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);

    NotificationUtil.show(i18n.t('settings.exportSuccess'), 'success');
}

// Import all data
async importAllData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (event) => {
            const jsonString = event.target.result;
            const success = await DataExporter.importAllData(this.db, jsonString);

            if (success) {
                NotificationUtil.show(i18n.t('settings.importSuccess'), 'success');
                location.reload();
            } else {
                NotificationUtil.show(i18n.t('messages.error'), 'error');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

*/

// These functions should be added to the AppState class
