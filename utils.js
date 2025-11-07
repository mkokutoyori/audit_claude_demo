// ==========================================
// Utility Functions
// ==========================================

class DateUtils {
    // Format date to dd/mm/yyyy
    static formatDate(dateString) {
        if (!dateString) return '';

        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    // Parse date from dd/mm/yyyy to Date object
    static parseDate(dateString) {
        if (!dateString) return null;

        const parts = dateString.split('/');
        if (parts.length !== 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? null : date;
    }

    // Convert dd/mm/yyyy to yyyy-mm-dd for storage
    static toISODate(dateString) {
        const date = this.parseDate(dateString);
        if (!date) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    // Calculate days between two dates
    static daysBetween(date1, date2) {
        const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
        const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    // Check if exception is overaged
    static isOveraged(targetDate) {
        if (!targetDate) return false;

        const target = new Date(targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return target < today;
    }

    // Get days overdue (returns 0 if not overdue)
    static getDaysOverdue(targetDate) {
        if (!targetDate) return 0;

        const target = new Date(targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (target >= today) return 0;

        return this.daysBetween(target, today);
    }

    // Calculate quarter dates properly - Each quarter is 3 months
    static calculateQuarterDates(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const quarters = [];
        let currentStart = new Date(start);

        for (let i = 0; i < 4; i++) {
            const qStart = new Date(currentStart);

            // For the last quarter, use the end date directly
            let qEnd;
            if (i === 3) {
                qEnd = new Date(end);
            } else {
                // Add 3 months for each quarter
                qEnd = new Date(qStart);
                qEnd.setMonth(qEnd.getMonth() + 3);
                // Go back one day to get the last day of the quarter
                qEnd.setDate(qEnd.getDate() - 1);
            }

            quarters.push({
                name: `Q${i + 1}`,
                startDate: this.toISODateString(qStart),
                endDate: this.toISODateString(qEnd)
            });

            // Set start for next quarter (day after the end of current quarter)
            currentStart = new Date(qEnd);
            currentStart.setDate(currentStart.getDate() + 1);
        }

        return quarters;
    }

    // Convert Date to ISO string (yyyy-mm-dd)
    static toISODateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    // Get deadline for follow-up (e.g., 7 days from now)
    static getFollowUpDeadline(daysFromNow = 7) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + daysFromNow);
        return this.formatDate(deadline);
    }
}

class EmailGenerator {
    // Helper function to wrap text to fit column width
    static wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + word).length <= maxWidth) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine) lines.push(currentLine);

        return lines;
    }

    // Generate email for open exceptions in a report - Markdown format
    static generateReportEmail(report, entity, exceptions, lang = 'en') {
        const managerName = entity.manager || 'Manager';
        const reportName = report.name;
        const reportDate = i18n.formatDate(report.date);
        const deadline = DateUtils.getFollowUpDeadline(7);

        let email = '';

        // Subject
        email += `**Subject:** Follow-up on Open Audit Exceptions – ${reportName}\n\n`;

        // Greeting
        email += `Dear **${managerName}**,\n\n`;

        // Introduction
        email += `I hope this email finds you well.\n\n`;
        email += `This is a follow-up regarding the open audit exceptions from the **"${reportName}"** audit report dated **${reportDate}**. `;
        email += `We would appreciate receiving an update on the current status and progress of these items.\n\n`;
        email += `Below is a summary of the pending exceptions that require your attention:\n\n`;

        // Markdown table header
        email += `| **No.** | **Exception Title & Description** | **Status Update (To be completed)** |\n`;
        email += `| :-----: | :------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |\n`;

        // Table rows
        exceptions.forEach((exception, index) => {
            const isOveraged = DateUtils.isOveraged(exception.target_date);
            const daysOverdue = DateUtils.getDaysOverdue(exception.target_date);
            const overagedTag = isOveraged ? ` ⚠️ **OVERAGED by ${daysOverdue} days**` : '';

            // Build exception details with line breaks
            let details = `**Title:** ${exception.title}<br>`;
            details += `**Risk Level:** ${exception.risk_rating.charAt(0).toUpperCase() + exception.risk_rating.slice(1)}${overagedTag}<br>`;
            details += `**Target Date:** ${i18n.formatDate(exception.target_date)}<br>`;
            details += `**Description:** ${exception.description}<br>`;
            details += `**Recommendation:** ${exception.recommendations}`;

            const statusUpdate = `[Please provide status update here – include current status, actions taken, expected completion date, and any challenges or support needed.]`;

            email += `| **${index + 1}** | ${details} | ${statusUpdate} |\n`;
        });

        email += `\n`;

        // Instructions
        email += `Please complete the **"Status Update"** column for each exception with:\n\n`;
        email += `* Current status of the remediation\n`;
        email += `* Actions taken to date\n`;
        email += `* Expected completion date (if still pending)\n`;
        email += `* Any challenges or support needed\n\n`;

        // Closing
        email += `We would appreciate receiving your response by **${deadline}**.\n\n`;
        email += `Should you have any questions or require clarification on any of the exceptions, please do not hesitate to contact us.\n\n`;

        // Signature
        email += `Best regards,\n`;
        email += `**Internal Audit Team**\n`;

        return email;
    }

    // Convert Markdown to HTML
    static markdownToHtml(markdown) {
        let html = markdown;

        // Convert tables
        const tableRegex = /\|(.+)\|\n\|[\s:|-]+\|\n((?:\|.+\|\n?)+)/g;
        html = html.replace(tableRegex, (match, header, body) => {
            const headers = header.split('|').map(h => h.trim()).filter(h => h);
            const rows = body.trim().split('\n').map(row =>
                row.split('|').map(cell => cell.trim()).filter(cell => cell)
            );

            let table = '<table class="email-table">\n<thead>\n<tr>\n';
            headers.forEach(h => {
                table += `<th>${h}</th>\n`;
            });
            table += '</tr>\n</thead>\n<tbody>\n';

            rows.forEach(row => {
                table += '<tr>\n';
                row.forEach(cell => {
                    table += `<td>${cell}</td>\n`;
                });
                table += '</tr>\n';
            });

            table += '</tbody>\n</table>';
            return table;
        });

        // Convert bold text
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Convert line breaks
        html = html.replace(/<br>/g, '<br>');

        // Convert bullet lists
        html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Convert paragraphs (double line breaks)
        html = html.split('\n\n').map(para => {
            if (para.startsWith('<table') || para.startsWith('<ul') || para.startsWith('<li>')) {
                return para;
            }
            return `<p>${para.replace(/\n/g, '<br>')}</p>`;
        }).join('\n');

        return html;
    }

    // Download email as text file
    static downloadEmail(emailContent, filename = 'audit_follow_up.txt') {
        const blob = new Blob([emailContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Copy to clipboard
    static copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text)
                .then(() => true)
                .catch(() => false);
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return Promise.resolve(success);
        }
    }
}

class DataExporter {
    // Export all data as JSON
    static async exportAllData(db) {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            entities: await db.getAll('entities'),
            fiscalYears: await db.getAll('fiscalYears'),
            quarters: await db.getAll('quarters'),
            reports: await db.getAll('reports'),
            exceptions: await db.getAll('exceptions')
        };

        return JSON.stringify(data, null, 2);
    }

    // Import all data from JSON
    static async importAllData(db, jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validate data structure
            if (!data.entities || !data.fiscalYears || !data.quarters ||
                !data.reports || !data.exceptions) {
                throw new Error('Invalid data format');
            }

            // Clear existing data (optional - could also merge)
            // For now, we'll assume user wants to replace all data

            // Import entities
            for (const entity of data.entities) {
                await db.add('entities', entity);
            }

            // Import fiscal years
            for (const fy of data.fiscalYears) {
                await db.add('fiscalYears', fy);
            }

            // Import quarters
            for (const quarter of data.quarters) {
                await db.add('quarters', quarter);
            }

            // Import reports
            for (const report of data.reports) {
                await db.add('reports', report);
            }

            // Import exceptions
            for (const exception of data.exceptions) {
                await db.add('exceptions', exception);
            }

            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    // Export report as JSON
    static async exportReport(db, report, exceptions) {
        const entity = await db.getById('entities', report.entityId);
        const quarter = await db.getById('quarters', report.quarterId);
        const fiscalYear = await db.getById('fiscalYears', quarter.fiscalYearId);

        const data = {
            report: {
                name: report.name,
                date: report.date,
                entity: entity.name,
                fiscalYear: fiscalYear.year,
                quarter: quarter.name
            },
            exceptions: exceptions.map(ex => ({
                title: ex.title,
                description: ex.description,
                risk: ex.risk,
                risk_rating: ex.risk_rating,
                recommendations: ex.recommendations,
                response: ex.response || '',
                action_plan: ex.action_plan || '',
                root_cause: ex.root_cause || '',
                target_date: ex.target_date || '',
                status: ex.status
            }))
        };

        return JSON.stringify(data, null, 2);
    }

    // Download JSON file
    static downloadJSON(jsonString, filename) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Parse import JSON for report
    static parseReportJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.report || !data.exceptions) {
                throw new Error('Invalid report format');
            }

            return data;
        } catch (error) {
            console.error('Parse error:', error);
            return null;
        }
    }
}

// Notification utility
class NotificationUtil {
    static show(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style it
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
