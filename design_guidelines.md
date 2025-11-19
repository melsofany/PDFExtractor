# Design Guidelines: Electoral Data Extraction Tool

## Design Approach
**System-Based Approach**: Material Design principles adapted for Arabic RTL interface
- Focus on clarity, efficiency, and data processing workflow
- Prioritize functionality over decorative elements
- Clean, professional aesthetic suitable for administrative/electoral work

## Layout & Structure

### RTL Configuration
- Full RTL (Right-to-Left) layout for Arabic interface
- Text alignment: right-aligned throughout
- Navigation and controls: mirrored to RTL standards
- Table data flows right to left matching PDF source

### Spacing System
- Use Tailwind units: 2, 4, 6, 8, 12, 16 for consistent rhythm
- Container padding: p-6 on mobile, p-8 on desktop
- Section gaps: space-y-6 to space-y-8
- Component internal spacing: p-4 for cards, p-3 for inputs

### Page Layout
```
- Header: Tool title, simple navigation (if needed)
- Main Content Area: max-w-7xl mx-auto px-6
  - Upload Section (prominent card)
  - Processing Status (expandable during operation)
  - Preview Table (scrollable, fixed header)
  - Export Controls (sticky bottom or section)
```

## Typography

### Font Family
- Primary: 'Noto Sans Arabic' or 'Cairo' from Google Fonts
- Weights: 400 (regular), 600 (semibold), 700 (bold)

### Hierarchy
- Page Title: text-3xl font-bold
- Section Headers: text-xl font-semibold
- Table Headers: text-sm font-semibold uppercase tracking-wide
- Body Text: text-base
- Helper Text: text-sm text-gray-600

## Core Components

### 1. File Upload Area
- Large dropzone card with dashed border
- Upload icon (document with arrow)
- Primary text: "اسحب ملف PDF هنا أو انقر للاختيار"
- Supported format note below
- Selected file display with name and size

### 2. Progress Indicator
- Linear progress bar with percentage
- Status text: "جاري معالجة الصفحة X من Y"
- Estimated time remaining
- Cancel button option

### 3. Data Preview Table
- Fixed header with sticky positioning
- Columns (RTL order): اسم اللجنة | الرقم الفرعي | رقم الناخب | الاسم الكامل
- Striped rows for readability (even rows with bg-gray-50)
- Max height with scroll (max-h-96 overflow-auto)
- Row count indicator: "عرض X من Y ناخب"

### 4. Committee Grouping
- Visual separator between committees (border-t-2 with committee name)
- Committee header row with subtle background (bg-blue-50)
- Alternating background for committee blocks

### 5. Action Buttons
- Primary: "تصدير إلى Excel" (prominent, solid background)
- Secondary: "مسح البيانات" (outlined)
- Upload: "رفع ملف جديد" (outlined)
- Icons from Heroicons (download, upload, trash)

### 6. Status Messages
- Success: Green background card with checkmark icon
- Error: Red background card with warning icon
- Info: Blue background card with info icon
- Positioned at top of content area

## Component Specifications

### Cards
- Border: border border-gray-200
- Rounded: rounded-lg
- Shadow: shadow-sm
- Padding: p-6

### Input Fields
- Border: border-2 focus:border-blue-500
- Rounded: rounded-md
- Padding: px-4 py-2.5
- RTL text alignment

### Tables
- Header: bg-gray-100 border-b-2
- Cell padding: px-4 py-3
- Border: border-b border-gray-200
- Hover: hover:bg-gray-50

### Buttons
- Height: py-2.5 px-6
- Rounded: rounded-md
- Font: font-semibold text-base
- Icon spacing: gap-2 when with icons

## Interaction States

### Upload Zone
- Default: border-dashed border-2 border-gray-300
- Hover: border-blue-400 bg-blue-50
- Active/Dragging: border-blue-500 bg-blue-100
- Disabled: opacity-50 cursor-not-allowed

### Buttons
- Hover: Slight brightness increase
- Active: Scale down slightly (scale-95)
- Disabled: opacity-50

## Accessibility
- High contrast text ratios (WCAG AA minimum)
- Focus indicators on all interactive elements
- Screen reader labels in Arabic
- Keyboard navigation support
- Error messages clearly associated with fields

## No Images Required
This is a utility application - no hero images or decorative imagery needed. Focus on clear iconography from Heroicons for:
- Upload (arrow-up-tray)
- Download/Export (arrow-down-tray)
- Delete (trash)
- Success (check-circle)
- Error (exclamation-triangle)

## Additional Notes
- Minimal animations: Only smooth transitions for state changes (200ms)
- Loading spinners during processing
- Responsive: Full desktop layout on large screens, stacked mobile layout
- Print-friendly styles for preview table