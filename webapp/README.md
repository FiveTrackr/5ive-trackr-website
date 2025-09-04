# 5ive Trackr Webapp - Live Build

## Project Structure

This is the main live build folder for the 5ive Trackr webapp, organized for clean development and deployment.

### Directory Structure

```
webapp/
├── src/                    # Source code and assets
│   ├── assets/            # Static assets (images, icons, etc.)
│   ├── core/              # Core JavaScript files
│   ├── css/               # Stylesheets
│   ├── fonts/             # Font files
│   ├── img/               # Images
│   ├── js/                # JavaScript modules and components
│   ├── pages/             # HTML pages
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── league-manager/ # League manager interface
│   │   └── referee/       # Referee interface
│   ├── templates/         # HTML templates
│   └── manifest.json      # PWA manifest
│
├── server/                # Server-side code and data
│   ├── api/               # API endpoints
│   ├── data/              # Data storage files
│   ├── data-server.py     # Python data server
│   └── mobile-server.ps1  # Mobile server scripts
│
├── build/                 # Build and deployment files
│   ├── .do/               # DigitalOcean configuration
│   ├── deploy.sh          # Deployment script
│   ├── prepare-production.* # Production preparation scripts
│   └── .deployment-state.json # Deployment tracking
│
├── docs/                  # Documentation
│   ├── README.md          # Project documentation
│   ├── DEPLOYMENT_GUIDE.md # Deployment instructions
│   └── *.md               # Other documentation files
│
├── tests/                 # Test files and test pages
│
├── .git/                  # Git repository
├── .gitignore             # Git ignore rules
├── CNAME                  # Domain configuration (www.webapp.5ivetrackr.com)
└── requirements.txt       # Python dependencies
```

### Key Files

- **api/server.py**: Multi-tenant Python server with SQLite databases per league
- **requirements.txt**: Python dependencies (PyJWT for authentication)
- **.do/app.yaml**: DigitalOcean deployment configuration
- **CNAME**: Domain configuration for `www.webapp.5ivetrackr.com`
- **src/manifest.json**: Progressive Web App configuration
- **src/pages/**: Main application pages organized by user role

### Python Multi-Tenant Server

The application uses a Python server with:
- **Central Authentication**: Single auth database for all users
- **League Isolation**: Separate SQLite database per league manager
- **JWT Security**: Token-based authentication with SHA-256 password hashing
- **Environment Detection**: Automatic localhost vs production API switching

### Development Commands

- **Start local server**: `cd server && python data-server.py`
- **Deploy to live**: `cd build && ./deploy.sh`
- **Prepare for production**: `cd build && ./prepare-production.sh`

### Live Deployment

This webapp is deployed to: `https://www.webapp.5ivetrackr.com/`

### Architecture

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python data server with API endpoints
- **Deployment**: GitHub Pages with custom domain
- **Data**: JSON-based data storage with live API integration

This clean structure separates concerns and makes the project much easier to navigate and maintain.
