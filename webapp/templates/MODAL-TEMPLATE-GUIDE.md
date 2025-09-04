# 5ive Trackr Modal Template Guide

## Quick Start

Use the standardized modal template for all new modals to ensure consistent styling and behavior across the webapp.

## File Locations

- **Complete Template**: `/templates/modal-template.html` - Full HTML structure with CSS and JS
- **CSS Only**: `/css/modal-template.css` - Just the styling for existing modals
- **This Guide**: `/templates/MODAL-TEMPLATE-GUIDE.md` - Usage instructions

## Basic Usage

### 1. Copy the Template Structure

```html
<div class="modal-overlay" id="your-modal-id">
    <div class="standard-modal">
        <div class="modal-header">
            <h2 class="modal-title">Your Modal Title</h2>
            <button class="modal-close" onclick="closeModal('your-modal-id')">&times;</button>
        </div>
        
        <div class="modal-body">
            <!-- Your content here -->
        </div>
        
        <div class="modal-footer">
            <button type="button" class="btn btn-cancel" onclick="closeModal('your-modal-id')">Cancel</button>
            <button type="button" class="btn btn-save" onclick="handleSubmit()">Save</button>
        </div>
    </div>
</div>
```

### 2. Include the CSS

Either include the CSS file:
```html
<link rel="stylesheet" href="../../css/modal-template.css">
```

Or copy the styles directly into your page's `<style>` section.

### 3. Add JavaScript Functions

```javascript
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
```

## Form Layout Standards

### Primary Fields (Full Width)
Use for main information like names, titles, descriptions:

```html
<div class="form-group">
    <label class="form-label" for="name">Name</label>
    <input type="text" id="name" class="form-input" placeholder="Enter name" required>
</div>
```

### Secondary Fields (Side by Side)
Use for related pairs like size + status, date + time:

```html
<div class="form-row">
    <div class="form-group">
        <label class="form-label" for="size">Size</label>
        <select id="size" class="form-input">
            <option value="">Select size</option>
        </select>
    </div>
    <div class="form-group">
        <label class="form-label" for="status">Status</label>
        <select id="status" class="form-input">
            <option value="">Select status</option>
        </select>
    </div>
</div>
```

### Form Sections
Group related fields:

```html
<div class="form-section">
    <h3 class="section-header">Basic Information</h3>
    <!-- Fields here -->
</div>
```

## Button Standards

### Standard Layout
- **Cancel**: Transparent with gray outline (left side of right group)
- **Save/Submit**: Green background (rightmost)
- **Delete**: Red background (far left, optional)

```html
<div class="modal-footer">
    <!-- Optional delete button -->
    <button type="button" class="btn btn-delete" onclick="handleDelete()">Delete</button>
    
    <!-- Standard cancel and save -->
    <button type="button" class="btn btn-cancel" onclick="closeModal('modal-id')">Cancel</button>
    <button type="button" class="btn btn-save" onclick="handleSubmit()">Save Changes</button>
</div>
```

## Features Included

### ✅ Consistent Styling
- Green gradient headers matching app theme
- Professional form field layouts
- Standard button designs and colors
- Proper spacing and typography

### ✅ Responsive Design
- Mobile-friendly layouts
- Stacked forms on small screens
- Proper touch targets

### ✅ Accessibility
- Focus trap when modal opens
- Escape key to close
- Proper ARIA labels
- Keyboard navigation

### ✅ User Experience
- Smooth animations (fade in/slide in)
- Click outside to close
- Scrollable content area
- Loading states and transitions

### ✅ Technical Features
- Clean HTML structure
- Minimal DOM manipulation
- Event delegation
- Memory leak prevention

## Customization

### Changing Modal Size
```css
.standard-modal {
    max-width: 800px; /* Larger modal */
}
```

### Adding Custom Sections
```html
<div class="form-section">
    <h3 class="section-header">Custom Section</h3>
    <!-- Your custom content -->
</div>
```

### Custom Button Types
```css
.btn-custom {
    background: #your-color;
    color: white;
    border-color: #your-color;
}
```

## Migration from Existing Modals

### Step 1: Identify Current Modal
Find your existing modal structure.

### Step 2: Update Structure
Replace with standardized structure:
- Change class names to standard ones
- Update header to use green gradient
- Ensure proper footer button layout

### Step 3: Update CSS
Replace custom modal CSS with template CSS.

### Step 4: Update JavaScript
Use standard open/close functions.

### Step 5: Test
Verify functionality and styling match the template.

## Examples

### Simple Form Modal
```html
<div class="modal-overlay" id="add-team-modal">
    <div class="standard-modal">
        <div class="modal-header">
            <h2 class="modal-title">Add New Team</h2>
            <button class="modal-close" onclick="closeModal('add-team-modal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-section">
                <h3 class="section-header">Team Information</h3>
                <div class="form-group">
                    <label class="form-label" for="team-name">Team Name</label>
                    <input type="text" id="team-name" class="form-input" placeholder="Enter team name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="team-division">Division</label>
                        <select id="team-division" class="form-input">
                            <option value="">Select division</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="team-status">Status</label>
                        <select id="team-status" class="form-input">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-cancel" onclick="closeModal('add-team-modal')">Cancel</button>
            <button type="button" class="btn btn-save" onclick="addTeam()">Add Team</button>
        </div>
    </div>
</div>
```

## Best Practices

1. **Always use the template** for new modals
2. **Test on mobile** devices for responsive behavior
3. **Use semantic HTML** with proper labels and roles
4. **Handle form validation** gracefully with error states
5. **Provide feedback** during save operations
6. **Clear forms** when closing modals
7. **Focus management** for accessibility
8. **Consistent naming** for IDs and functions

## Troubleshooting

### Modal Not Appearing
- Check if `active` class is added to modal-overlay
- Verify z-index is higher than other elements
- Ensure modal HTML is in the DOM

### Styling Issues
- Verify CSS is loaded correctly
- Check for CSS conflicts with existing styles
- Use browser dev tools to inspect computed styles

### JavaScript Errors
- Ensure modal ID matches function parameters
- Check console for error messages
- Verify event handlers are bound correctly

## Support

For questions or issues with the modal template, check existing modals in the webapp for reference, particularly the venue modal which serves as the base template.