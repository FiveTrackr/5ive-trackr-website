# 5ive Trackr Website

Marketing website and signup pages for 5ive Trackr.

## Live URLs
- **Production**: https://www.5ivetrackr.com/
- **GitHub Pages**: https://fivetrackr.github.io/5ive-trackr-website/

## Domain Setup (Squarespace DNS)
This site uses Squarespace DNS management (no domain transfer required):

**DNS Record in Squarespace:**
- Type: CNAME
- Name: www
- Value: fivetrackr.github.io

## Deployment
Deploy using:
```powershell
.\deploy-website-only.ps1 -CommitMessage "Your update message"
```

## Structure
- /: Website root with signup and marketing pages
- css/: Stylesheets
- js/: JavaScript files  
- img/: Images and assets
- signup.html: Main signup page
- email-verification.html: Email verification page

## User Flow
1. User visits www.5ivetrackr.com (marketing site)
2. Signs up via Stripe payment
3. Receives email verification  
4. Redirects to app.5ivetrackr.com (separate webapp)

Generated: 2025-09-03 18:43:10
