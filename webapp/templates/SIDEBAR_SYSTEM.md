# 5ive Trackr Sidebar System

## Overview
This system provides a consistent sidebar across all pages in the 5ive Trackr application. The sidebar is defined in a central location and dynamically injected into each page, ensuring consistency and making maintenance easier.

## How to Use

### 1. For New Pages

1. Copy the appropriate template from the `templates` directory:
   - For pages in the root `pages` directory: Use `page-with-sidebar.html`
   - For pages in subdirectories like `pages/league-manager/`: Use `subdirectory-page-with-sidebar.html`

2. Update the `data-page` attribute on the body tag to match the page identifier:
   ```html
   <body data-page="your_page_id">
   ```

3. Make sure the following scripts are included (already in the templates):
   ```html
   <script src="../js/components/sidebar-template.js"></script>
   <script src="../js/components/sidebar-manager.js"></script>
   ```
   (Adjust paths as needed based on your page's location)

### 2. Updating the Sidebar

If you need to add or modify menu items in the sidebar:

1. Edit the `sidebar-template.js` file in the `js/components/` directory
2. Update the `getSidebarHtml()` method to reflect your changes
3. The changes will automatically apply to all pages using the sidebar system

### 3. Page IDs

The current page IDs used for highlighting active menu items are:
- `dashboard` - League Manager Dashboard
- `leagues` - Leagues page
- `teams` - Teams page
- `fixtures` - Fixtures page
- `referees` - Referees page

Add new page IDs as needed in both the sidebar template and your pages.

## Benefits

- **Consistency**: All pages share the exact same sidebar structure
- **Maintainability**: Update the sidebar in one place instead of editing every HTML file
- **State Preservation**: Sidebar collapsed/expanded state is preserved between page loads
- **Automatic Path Resolution**: Paths to assets are automatically adjusted based on page depth

## Technical Details

The sidebar system consists of two main components:

1. **SidebarTemplate** - Defines the HTML structure of the sidebar
2. **SidebarManager** - Handles the injection and interaction logic

The system automatically detects the current page's location and adjusts asset paths accordingly.
