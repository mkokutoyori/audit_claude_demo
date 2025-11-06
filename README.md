# Audit Exception Tracking System

A comprehensive web application for managing and monitoring audit exceptions across organizational entities. Built with HTML, CSS, JavaScript, and IndexedDB for complete client-side data persistence.

## Features

### Core Functionality

- **Entity Management**: Create and manage organizational units/departments with responsible managers
- **Fiscal Year Management**: Define fiscal years with automatic quarter generation (Q1-Q4)
- **Audit Report Management**: Track audit reports linked to entities and quarters
- **Exception Tracking**: Comprehensive exception management with full lifecycle tracking

### Exception Attributes

Each exception includes:
- Title and detailed description
- Risk assessment and risk rating (High/Medium/Low)
- Audit recommendations
- Management response
- Action plan
- Root cause analysis
- Target resolution date
- Status tracking (Open/Closed)
- Closure workflow with comments and date capture

### Dashboard & Analytics

- **Key Metrics**:
  - Total open exceptions
  - Total raised exceptions
  - Closed exceptions count
  - Closure/regularization rate

- **Visual Charts**:
  - Exceptions by status (Doughnut chart)
  - Exceptions by risk rating (Doughnut chart)
  - Exceptions by entity (Bar chart)
  - Monthly trend analysis (Line chart)

### Specialized Views

1. **Exceptions by Quarter**: View all exceptions grouped by fiscal quarter
2. **Exceptions by Entity**: View all exceptions grouped by organizational unit
3. **Open Exceptions by Quarter**: Focus on outstanding items by quarter

### Advanced Features

- **Search & Filter**: Real-time search and filtering across all views
- **CRUD Operations**: Full Create, Read, Update, Delete functionality
- **Data Validation**: Form validation for required fields
- **Responsive Design**: Mobile-friendly interface
- **Modern UI/UX**: Clean, professional styling with intuitive navigation

## Getting Started

### Installation

1. Clone or download the repository
2. Open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
3. No server or installation required - runs entirely in your browser!

### First Steps

1. **Add Entities**: Navigate to "Entities" and create your organizational units
2. **Create Fiscal Year**: Go to "Fiscal Years" and add a fiscal year (quarters auto-generate)
3. **Add Audit Reports**: Create audit reports linked to entities and quarters
4. **Track Exceptions**: Add exceptions to your audit reports
5. **Monitor Progress**: Use the dashboard to track metrics and trends

## Usage Guide

### Managing Entities

1. Click "Entities" in the sidebar
2. Click "+ Add Entity" button
3. Enter entity name and responsible manager
4. Click "Save"

### Creating Fiscal Years

1. Navigate to "Fiscal Years"
2. Click "+ Add Fiscal Year"
3. Enter the year and date range
4. System automatically creates 4 quarters

### Adding Audit Reports

1. Go to "Audit Reports"
2. Click "+ Add Report"
3. Select entity, fiscal year, and quarter
4. Enter report name and date
5. Save the report

### Tracking Exceptions

1. Navigate to "Exceptions"
2. Click "+ Add Exception"
3. Fill in all required fields:
   - Select audit report
   - Enter title and description
   - Specify risk and risk rating
   - Add recommendations
   - Optionally add: response, action plan, root cause, target date
4. Save the exception

### Closing Exceptions

1. Find an open exception in the list
2. Click "Close" button
3. Enter closure date and detailed comments
4. Submit to close the exception

### Viewing Reports

1. Navigate to "Reports & Views"
2. Click on any report card:
   - Exceptions by Quarter
   - Exceptions by Entity
   - Open Exceptions by Quarter
3. View detailed breakdowns and analysis

## Technical Details

### Architecture

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Database**: IndexedDB for client-side persistence
- **Charts**: Chart.js library for data visualization
- **Design**: Responsive CSS with modern UI patterns

### Data Model

```
Entities
├── id (auto-increment)
├── name
└── manager

Fiscal Years
├── id (auto-increment)
├── year
├── startDate
└── endDate

Quarters
├── id (auto-increment)
├── fiscalYearId (foreign key)
├── name (Q1, Q2, Q3, Q4)
├── startDate
└── endDate

Audit Reports
├── id (auto-increment)
├── name
├── entityId (foreign key)
├── quarterId (foreign key)
└── date

Exceptions
├── id (auto-increment)
├── reportId (foreign key)
├── title
├── description
├── risk
├── risk_rating
├── recommendations
├── response
├── action_plan
├── root_cause
├── target_date
├── status
├── created_date
├── closure_date
└── closure_comments
```

### Browser Compatibility

- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 79+

All modern browsers with IndexedDB support.

## File Structure

```
audit-exception-tracker/
├── index.html          # Main application HTML
├── styles.css          # Complete styling
├── app.js             # Application logic and data layer
└── README.md          # Documentation
```

## Features Breakdown

### Search & Filtering

- **Exceptions**: Search by title/description, filter by status, risk rating, and entity
- **Reports**: Search by name, filter by entity and fiscal year
- **Entities**: Search by name or manager

### Data Persistence

All data is stored locally in your browser using IndexedDB:
- No server required
- Data persists across sessions
- Works offline
- No data leaves your computer

### Sample Data

The application includes sample data on first launch:
- 4 sample entities (Finance, IT, Operations, HR)
- Fiscal Year 2024 with 4 quarters
- Ready to add your own reports and exceptions

## Customization

### Adding Risk Ratings

Edit the risk rating options in `app.js` in the exception form.

### Modifying Dashboard Metrics

Update the `renderDashboard()` method to add custom metrics.

### Chart Customization

Modify chart colors and styles in the `renderCharts()` methods.

## Best Practices

1. **Consistent Naming**: Use clear, descriptive names for entities and reports
2. **Regular Updates**: Keep exception status and action plans current
3. **Detailed Comments**: Provide comprehensive closure comments for audit trail
4. **Risk Assessment**: Accurately assess and rate risks for proper prioritization
5. **Target Dates**: Set realistic target dates for exception resolution

## Security & Privacy

- All data stored locally in browser
- No external data transmission
- No user authentication required
- Export functionality can be added for backups

## Limitations

- Data stored per browser (not synced across devices)
- No built-in backup/export (can be added)
- Single-user system (no collaboration features)
- Browser storage limits apply (typically 50MB+)

## Future Enhancements

Potential additions:
- Data export to Excel/PDF
- Email notifications for overdue exceptions
- Attachment support for evidence
- Multi-user support with authentication
- Cloud sync capabilities
- Advanced reporting templates

## Support

For issues or questions:
1. Check browser console for errors
2. Verify browser supports IndexedDB
3. Clear browser data and reload if issues persist

## License

Free to use and modify for your organization's needs.

## Credits

Built with:
- Chart.js for data visualization
- Modern CSS Grid and Flexbox
- IndexedDB for data persistence
- Vanilla JavaScript (no frameworks)

---

**Version**: 1.0.0
**Last Updated**: 2024
**Author**: Claude
