// ==========================================
// Internationalization (i18n) System
// ==========================================

const translations = {
    en: {
        // App Title
        appTitle: 'Audit Tracker',

        // Navigation
        nav: {
            dashboard: 'Dashboard',
            exceptions: 'Exceptions',
            reports: 'Audit Reports',
            entities: 'Entities',
            fiscalYears: 'Fiscal Years',
            views: 'Reports & Views',
            settings: 'Settings'
        },

        // Dashboard
        dashboard: {
            title: 'Dashboard',
            subtitle: 'Key metrics and insights',
            metrics: {
                openExceptions: 'Open Exceptions',
                totalRaised: 'Total Raised',
                closedExceptions: 'Closed Exceptions',
                closureRate: 'Closure Rate',
                overaged: 'Overaged Exceptions',
                dueThisMonth: 'Due This Month',
                highRisk: 'High Risk Open'
            },
            charts: {
                byStatus: 'Exceptions by Status',
                byRisk: 'Exceptions by Risk Rating',
                byEntity: 'Exceptions by Entity',
                trend: 'Monthly Trend',
                overaged: 'Overaged vs On-Time'
            }
        },

        // Exceptions
        exceptions: {
            title: 'Exception Management',
            addException: 'Add Exception',
            editException: 'Edit Exception',
            viewException: 'Exception Details',
            closeException: 'Close Exception',
            deleteException: 'Delete Exception',
            searchPlaceholder: 'Search exceptions...',
            filters: {
                allStatus: 'All Status',
                open: 'Open',
                closed: 'Closed',
                overaged: 'Overaged',
                allRisk: 'All Risk Levels',
                exposure: 'Exposure',
                concern: 'Concern',
                housekeeping: 'Housekeeping',
                observation: 'Observation',
                allEntities: 'All Entities'
            },
            table: {
                title: 'Title',
                entity: 'Entity',
                riskRating: 'Risk Rating',
                status: 'Status',
                targetDate: 'Target Date',
                daysOverdue: 'Days Overdue',
                actions: 'Actions'
            },
            form: {
                report: 'Audit Report',
                selectReport: 'Select Report',
                title: 'Title',
                description: 'Description',
                risk: 'Risk',
                riskRating: 'Risk Rating',
                selectRiskRating: 'Select Risk Rating',
                recommendations: 'Recommendations',
                response: 'Management Response',
                actionPlan: 'Action Plan',
                rootCause: 'Root Cause',
                targetDate: 'Target Date',
                closureDate: 'Closure Date',
                closureComments: 'Closure Comments',
                closureCommentsPlaceholder: 'Document the actions taken, resolution details, and any relevant information...',
                save: 'Save',
                cancel: 'Cancel',
                close: 'Close',
                required: 'Required fields marked with *'
            },
            details: {
                createdDate: 'Created Date',
                report: 'Report',
                notSet: 'Not set'
            },
            closeDialog: {
                title: 'Close Exception',
                message: 'You are closing exception:',
                closingException: 'Closing Exception'
            },
            emailDraft: {
                title: 'Email Draft for Open Exceptions',
                generate: 'Generate Email Draft',
                copy: 'Copy to Clipboard',
                download: 'Download as .txt',
                subject: 'Subject',
                body: 'Email Body',
                copied: 'Copied to clipboard!'
            },
            empty: {
                title: 'No exceptions found',
                icon: '⚠️'
            }
        },

        // Reports
        reports: {
            title: 'Audit Reports',
            addReport: 'Add Report',
            editReport: 'Edit Report',
            deleteReport: 'Delete Report',
            searchPlaceholder: 'Search reports...',
            importJson: 'Import from JSON',
            exportJson: 'Export to JSON',
            generateEmail: 'Generate Email for Open Exceptions',
            table: {
                name: 'Report Name',
                entity: 'Entity',
                fiscalYear: 'Fiscal Year',
                quarter: 'Quarter',
                date: 'Date',
                exceptionsCount: 'Exceptions',
                actions: 'Actions'
            },
            form: {
                name: 'Report Name',
                entity: 'Entity',
                selectEntity: 'Select Entity',
                fiscalYear: 'Fiscal Year',
                selectFiscalYear: 'Select Fiscal Year',
                quarter: 'Quarter',
                selectQuarter: 'Select Quarter',
                date: 'Report Date',
                save: 'Save',
                cancel: 'Cancel'
            },
            import: {
                title: 'Import Audit Report from JSON',
                instructions: 'Paste your audit report JSON below. The system will parse it and create the report with all exceptions.',
                jsonPlaceholder: 'Paste JSON here...',
                preview: 'Preview',
                import: 'Import',
                cancel: 'Cancel',
                selectEntity: 'Select Entity for this Report',
                selectQuarter: 'Select Quarter',
                adjustments: 'Make any necessary adjustments before importing',
                success: 'Report imported successfully!',
                error: 'Error parsing JSON. Please check the format.'
            },
            export: {
                title: 'Export Report as JSON',
                download: 'Download JSON',
                copy: 'Copy JSON',
                copied: 'JSON copied to clipboard!'
            },
            empty: {
                title: 'No audit reports found',
                icon: '📋'
            }
        },

        // Entities
        entities: {
            title: 'Entities / Departments',
            addEntity: 'Add Entity',
            editEntity: 'Edit Entity',
            deleteEntity: 'Delete Entity',
            searchPlaceholder: 'Search entities...',
            table: {
                name: 'Entity Name',
                manager: 'Responsible Manager',
                actions: 'Actions'
            },
            form: {
                name: 'Entity Name',
                manager: 'Responsible Manager',
                email: 'Manager Email',
                save: 'Save',
                cancel: 'Cancel'
            },
            deleteConfirm: 'Are you sure you want to delete this entity?',
            empty: {
                title: 'No entities found',
                icon: '🏢'
            }
        },

        // Fiscal Years
        fiscalYears: {
            title: 'Fiscal Years',
            addFiscalYear: 'Add Fiscal Year',
            deleteFiscalYear: 'Delete Fiscal Year',
            form: {
                year: 'Fiscal Year',
                yearPlaceholder: 'e.g., 2024',
                startDate: 'Start Date',
                endDate: 'End Date',
                note: 'Note: Four quarters will be automatically created for this fiscal year.',
                save: 'Create',
                cancel: 'Cancel'
            },
            deleteConfirm: 'Are you sure? This will also delete all associated quarters and reports.',
            empty: {
                title: 'No fiscal years found. Create your first fiscal year to get started.',
                icon: '📅'
            }
        },

        // Views
        views: {
            title: 'Reports & Views',
            subtitle: 'Specialized views and reports',
            byQuarter: {
                title: 'Exceptions by Quarter',
                description: 'View all exceptions grouped by fiscal quarter'
            },
            byEntity: {
                title: 'Exceptions by Entity',
                description: 'View all exceptions grouped by entity/department'
            },
            openByQuarter: {
                title: 'Open Exceptions by Quarter',
                description: 'View only open exceptions grouped by quarter'
            },
            overaged: {
                title: 'Overaged Exceptions',
                description: 'View all exceptions past their target date'
            },
            viewReport: 'View Report',
            totalExceptions: 'Total Exceptions',
            openExceptions: 'Open Exceptions'
        },

        // Common
        common: {
            save: 'Save',
            cancel: 'Cancel',
            close: 'Close',
            delete: 'Delete',
            edit: 'Edit',
            view: 'View',
            actions: 'Actions',
            search: 'Search',
            filter: 'Filter',
            export: 'Export',
            import: 'Import',
            download: 'Download',
            copy: 'Copy',
            loading: 'Loading...',
            noData: 'No data available',
            confirm: 'Confirm',
            yes: 'Yes',
            no: 'No',
            resetDatabase: 'Reset Database',
            language: 'Language',
            settings: 'Settings',
            backupData: 'Backup Data',
            restoreData: 'Restore Data',
            exportAll: 'Export All Data',
            importAll: 'Import All Data'
        },

        // Settings
        settings: {
            title: 'Settings',
            language: 'Language',
            selectLanguage: 'Select Language',
            dataManagement: 'Data Management',
            exportData: 'Export All Data',
            importData: 'Import Data',
            resetDatabase: 'Reset Database',
            resetWarning: 'This will delete all data and reset the application. Are you sure?',
            exportSuccess: 'Data exported successfully!',
            importSuccess: 'Data imported successfully!',
            theme: 'Theme',
            dateFormat: 'Date Format'
        },

        // Messages
        messages: {
            deleteConfirm: 'Are you sure you want to delete this item?',
            saveSuccess: 'Saved successfully!',
            deleteSuccess: 'Deleted successfully!',
            updateSuccess: 'Updated successfully!',
            error: 'An error occurred. Please try again.',
            noChanges: 'No changes to save',
            invalidDate: 'Invalid date format',
            required: 'This field is required',
            copied: 'Copied to clipboard!',
            downloadSuccess: 'Downloaded successfully!'
        },

        // Email Templates
        email: {
            subject: 'Follow-up on Open Audit Exceptions - {{reportName}}',
            greeting: 'Dear {{managerName}},',
            intro: 'This email is to follow up on the open audit exceptions from the report "{{reportName}}" dated {{reportDate}}.',
            purpose: 'We would like to request an update on the status and progress of the following exceptions:',
            exceptionsTitle: 'Open Exceptions:',
            exceptionTemplate: {
                title: 'Exception: {{title}}',
                riskRating: 'Risk Rating: {{riskRating}}',
                targetDate: 'Target Closure Date: {{targetDate}}',
                daysOverdue: 'Days Overdue: {{days}}',
                description: 'Description: {{description}}',
                recommendations: 'Recommendations: {{recommendations}}',
                actionPlan: 'Action Plan: {{actionPlan}}',
                requestUpdate: 'Please provide an update on:'
            },
            requestPoints: [
                'Current status of the exception',
                'Actions taken to date',
                'Expected closure date',
                'Any challenges or support needed'
            ],
            closing: 'Please respond by {{deadline}} with your updates.',
            signature: 'Best regards,\nAudit Team',
            overaged: '⚠️ OVERAGED',
            dueDate: 'Due Date'
        }
    },

    fr: {
        // Titre de l'app
        appTitle: 'Suivi d\'Audit',

        // Navigation
        nav: {
            dashboard: 'Tableau de Bord',
            exceptions: 'Exceptions',
            reports: 'Rapports d\'Audit',
            entities: 'Entités',
            fiscalYears: 'Années Fiscales',
            views: 'Rapports & Vues',
            settings: 'Paramètres'
        },

        // Tableau de bord
        dashboard: {
            title: 'Tableau de Bord',
            subtitle: 'Métriques clés et indicateurs',
            metrics: {
                openExceptions: 'Exceptions Ouvertes',
                totalRaised: 'Total Soulevées',
                closedExceptions: 'Exceptions Clôturées',
                closureRate: 'Taux de Clôture',
                overaged: 'Exceptions en Retard',
                dueThisMonth: 'Échéance ce Mois',
                highRisk: 'Risque Élevé Ouvert'
            },
            charts: {
                byStatus: 'Exceptions par Statut',
                byRisk: 'Exceptions par Niveau de Risque',
                byEntity: 'Exceptions par Entité',
                trend: 'Tendance Mensuelle',
                overaged: 'En Retard vs À Temps'
            }
        },

        // Exceptions
        exceptions: {
            title: 'Gestion des Exceptions',
            addException: 'Ajouter Exception',
            editException: 'Modifier Exception',
            viewException: 'Détails de l\'Exception',
            closeException: 'Clôturer Exception',
            deleteException: 'Supprimer Exception',
            searchPlaceholder: 'Rechercher des exceptions...',
            filters: {
                allStatus: 'Tous les Statuts',
                open: 'Ouvert',
                closed: 'Clôturé',
                overaged: 'En Retard',
                allRisk: 'Tous les Niveaux de Risque',
                exposure: 'Exposition',
                concern: 'Préoccupation',
                housekeeping: 'Tenue de Livres',
                observation: 'Observation',
                allEntities: 'Toutes les Entités'
            },
            table: {
                title: 'Titre',
                entity: 'Entité',
                riskRating: 'Niveau de Risque',
                status: 'Statut',
                targetDate: 'Date Cible',
                daysOverdue: 'Jours de Retard',
                actions: 'Actions'
            },
            form: {
                report: 'Rapport d\'Audit',
                selectReport: 'Sélectionner un Rapport',
                title: 'Titre',
                description: 'Description',
                risk: 'Risque',
                riskRating: 'Niveau de Risque',
                selectRiskRating: 'Sélectionner le Niveau de Risque',
                recommendations: 'Recommandations',
                response: 'Réponse de la Direction',
                actionPlan: 'Plan d\'Action',
                rootCause: 'Cause Racine',
                targetDate: 'Date Cible',
                closureDate: 'Date de Clôture',
                closureComments: 'Commentaires de Clôture',
                closureCommentsPlaceholder: 'Documentez les actions prises, les détails de résolution, et toute information pertinente...',
                save: 'Enregistrer',
                cancel: 'Annuler',
                close: 'Fermer',
                required: 'Champs obligatoires marqués avec *'
            },
            details: {
                createdDate: 'Date de Création',
                report: 'Rapport',
                notSet: 'Non défini'
            },
            closeDialog: {
                title: 'Clôturer l\'Exception',
                message: 'Vous clôturez l\'exception :',
                closingException: 'Clôture de l\'Exception'
            },
            emailDraft: {
                title: 'Brouillon d\'Email pour Exceptions Ouvertes',
                generate: 'Générer le Brouillon',
                copy: 'Copier dans le Presse-papier',
                download: 'Télécharger en .txt',
                subject: 'Objet',
                body: 'Corps du Message',
                copied: 'Copié dans le presse-papier !'
            },
            empty: {
                title: 'Aucune exception trouvée',
                icon: '⚠️'
            }
        },

        // Rapports
        reports: {
            title: 'Rapports d\'Audit',
            addReport: 'Ajouter Rapport',
            editReport: 'Modifier Rapport',
            deleteReport: 'Supprimer Rapport',
            searchPlaceholder: 'Rechercher des rapports...',
            importJson: 'Importer depuis JSON',
            exportJson: 'Exporter en JSON',
            generateEmail: 'Générer Email pour Exceptions Ouvertes',
            table: {
                name: 'Nom du Rapport',
                entity: 'Entité',
                fiscalYear: 'Année Fiscale',
                quarter: 'Trimestre',
                date: 'Date',
                exceptionsCount: 'Exceptions',
                actions: 'Actions'
            },
            form: {
                name: 'Nom du Rapport',
                entity: 'Entité',
                selectEntity: 'Sélectionner une Entité',
                fiscalYear: 'Année Fiscale',
                selectFiscalYear: 'Sélectionner une Année Fiscale',
                quarter: 'Trimestre',
                selectQuarter: 'Sélectionner un Trimestre',
                date: 'Date du Rapport',
                save: 'Enregistrer',
                cancel: 'Annuler'
            },
            import: {
                title: 'Importer un Rapport d\'Audit depuis JSON',
                instructions: 'Collez votre rapport d\'audit JSON ci-dessous. Le système l\'analysera et créera le rapport avec toutes les exceptions.',
                jsonPlaceholder: 'Collez le JSON ici...',
                preview: 'Aperçu',
                import: 'Importer',
                cancel: 'Annuler',
                selectEntity: 'Sélectionner l\'Entité pour ce Rapport',
                selectQuarter: 'Sélectionner le Trimestre',
                adjustments: 'Effectuez les ajustements nécessaires avant d\'importer',
                success: 'Rapport importé avec succès !',
                error: 'Erreur lors de l\'analyse du JSON. Veuillez vérifier le format.'
            },
            export: {
                title: 'Exporter le Rapport en JSON',
                download: 'Télécharger JSON',
                copy: 'Copier JSON',
                copied: 'JSON copié dans le presse-papier !'
            },
            empty: {
                title: 'Aucun rapport d\'audit trouvé',
                icon: '📋'
            }
        },

        // Entités
        entities: {
            title: 'Entités / Départements',
            addEntity: 'Ajouter Entité',
            editEntity: 'Modifier Entité',
            deleteEntity: 'Supprimer Entité',
            searchPlaceholder: 'Rechercher des entités...',
            table: {
                name: 'Nom de l\'Entité',
                manager: 'Responsable',
                actions: 'Actions'
            },
            form: {
                name: 'Nom de l\'Entité',
                manager: 'Responsable',
                email: 'Email du Responsable',
                save: 'Enregistrer',
                cancel: 'Annuler'
            },
            deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cette entité ?',
            empty: {
                title: 'Aucune entité trouvée',
                icon: '🏢'
            }
        },

        // Années fiscales
        fiscalYears: {
            title: 'Années Fiscales',
            addFiscalYear: 'Ajouter Année Fiscale',
            deleteFiscalYear: 'Supprimer Année Fiscale',
            form: {
                year: 'Année Fiscale',
                yearPlaceholder: 'ex: 2024',
                startDate: 'Date de Début',
                endDate: 'Date de Fin',
                note: 'Note : Quatre trimestres seront automatiquement créés pour cette année fiscale.',
                save: 'Créer',
                cancel: 'Annuler'
            },
            deleteConfirm: 'Êtes-vous sûr ? Cela supprimera également tous les trimestres et rapports associés.',
            empty: {
                title: 'Aucune année fiscale trouvée. Créez votre première année fiscale pour commencer.',
                icon: '📅'
            }
        },

        // Vues
        views: {
            title: 'Rapports & Vues',
            subtitle: 'Vues et rapports spécialisés',
            byQuarter: {
                title: 'Exceptions par Trimestre',
                description: 'Voir toutes les exceptions regroupées par trimestre fiscal'
            },
            byEntity: {
                title: 'Exceptions par Entité',
                description: 'Voir toutes les exceptions regroupées par entité/département'
            },
            openByQuarter: {
                title: 'Exceptions Ouvertes par Trimestre',
                description: 'Voir uniquement les exceptions ouvertes regroupées par trimestre'
            },
            overaged: {
                title: 'Exceptions en Retard',
                description: 'Voir toutes les exceptions dépassant leur date cible'
            },
            viewReport: 'Voir le Rapport',
            totalExceptions: 'Total Exceptions',
            openExceptions: 'Exceptions Ouvertes'
        },

        // Commun
        common: {
            save: 'Enregistrer',
            cancel: 'Annuler',
            close: 'Fermer',
            delete: 'Supprimer',
            edit: 'Modifier',
            view: 'Voir',
            actions: 'Actions',
            search: 'Rechercher',
            filter: 'Filtrer',
            export: 'Exporter',
            import: 'Importer',
            download: 'Télécharger',
            copy: 'Copier',
            loading: 'Chargement...',
            noData: 'Aucune donnée disponible',
            confirm: 'Confirmer',
            yes: 'Oui',
            no: 'Non',
            resetDatabase: 'Réinitialiser la Base',
            language: 'Langue',
            settings: 'Paramètres',
            backupData: 'Sauvegarder les Données',
            restoreData: 'Restaurer les Données',
            exportAll: 'Exporter Toutes les Données',
            importAll: 'Importer les Données'
        },

        // Paramètres
        settings: {
            title: 'Paramètres',
            language: 'Langue',
            selectLanguage: 'Sélectionner la Langue',
            dataManagement: 'Gestion des Données',
            exportData: 'Exporter Toutes les Données',
            importData: 'Importer des Données',
            resetDatabase: 'Réinitialiser la Base',
            resetWarning: 'Ceci supprimera toutes les données et réinitialisera l\'application. Êtes-vous sûr ?',
            exportSuccess: 'Données exportées avec succès !',
            importSuccess: 'Données importées avec succès !',
            theme: 'Thème',
            dateFormat: 'Format de Date'
        },

        // Messages
        messages: {
            deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
            saveSuccess: 'Enregistré avec succès !',
            deleteSuccess: 'Supprimé avec succès !',
            updateSuccess: 'Mis à jour avec succès !',
            error: 'Une erreur s\'est produite. Veuillez réessayer.',
            noChanges: 'Aucun changement à enregistrer',
            invalidDate: 'Format de date invalide',
            required: 'Ce champ est obligatoire',
            copied: 'Copié dans le presse-papier !',
            downloadSuccess: 'Téléchargé avec succès !'
        },

        // Modèles d'email
        email: {
            subject: 'Suivi des Exceptions d\'Audit Ouvertes - {{reportName}}',
            greeting: 'Cher(ère) {{managerName}},',
            intro: 'Cet email fait suite aux exceptions d\'audit ouvertes du rapport "{{reportName}}" daté du {{reportDate}}.',
            purpose: 'Nous souhaiterions obtenir une mise à jour sur le statut et l\'avancement des exceptions suivantes :',
            exceptionsTitle: 'Exceptions Ouvertes :',
            exceptionTemplate: {
                title: 'Exception : {{title}}',
                riskRating: 'Niveau de Risque : {{riskRating}}',
                targetDate: 'Date de Clôture Cible : {{targetDate}}',
                daysOverdue: 'Jours de Retard : {{days}}',
                description: 'Description : {{description}}',
                recommendations: 'Recommandations : {{recommendations}}',
                actionPlan: 'Plan d\'Action : {{actionPlan}}',
                requestUpdate: 'Veuillez fournir une mise à jour sur :'
            },
            requestPoints: [
                'Le statut actuel de l\'exception',
                'Les actions prises à ce jour',
                'La date de clôture prévue',
                'Tout défi ou support nécessaire'
            ],
            closing: 'Veuillez répondre avant le {{deadline}} avec vos mises à jour.',
            signature: 'Cordialement,\nÉquipe d\'Audit',
            overaged: '⚠️ EN RETARD',
            dueDate: 'Date d\'Échéance'
        }
    }
};

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('appLanguage') || 'en';
        this.translations = translations;
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('appLanguage', lang);
            return true;
        }
        return false;
    }

    getLanguage() {
        return this.currentLang;
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        // Replace parameters in translation
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param] !== undefined ? params[param] : match;
            });
        }

        return value || key;
    }

    // Format date according to current locale
    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    // Parse date from dd/mm/yyyy format
    parseDate(dateString) {
        if (!dateString) return null;

        const parts = dateString.split('/');
        if (parts.length !== 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        return new Date(year, month, day);
    }

    // Convert date to ISO format for storage
    toISODate(dateString) {
        const date = this.parseDate(dateString);
        if (!date) return '';

        return date.toISOString().split('T')[0];
    }

    // Get all available languages
    getAvailableLanguages() {
        return [
            { code: 'en', name: 'English' },
            { code: 'fr', name: 'Français' }
        ];
    }
}

// Global i18n instance
const i18n = new I18n();
