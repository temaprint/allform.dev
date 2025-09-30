# PDF Editor

Interactive PDF document editor with text annotation, highlighting, and state management capabilities.

## 🚀 Features

- **PDF Viewing** - Load and display PDF documents
- **Text Annotation** - Add text annotations with customizable font, size, and color settings
- **Highlighting** - Create colored highlights (white, black, red, blue, green, yellow)
- **Object Movement** - Move and reposition added annotations
- **State Management** - Automatic state saving with numbering (State 0001, State 0002, etc.)
- **State Navigation** - Switch between saved states using arrow controls
- **Download** - Export edited PDF with all changes preserved

## 🛠 Technologies

- **Astro** - Static site generator
- **React** - For interactive components
- **PDF.js** - For PDF rendering
- **jsPDF** - For PDF creation with annotations
- **Tailwind CSS** - For styling
- **Lucide React** - Icons

## 📁 Project Structure

```
/
├── public/
│   ├── *.pdf                    # PDF form files
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── PdfEditor.jsx        # Main editor component
│   │   ├── PdfViewer.jsx        # PDF viewer
│   │   ├── EditingToolbar.jsx   # Toolbar
│   │   └── FormCard.jsx         # Form card
│   ├── data/
│   │   └── forms.js             # Available forms list
│   ├── layouts/
│   │   └── Layout.astro         # Main layout
│   └── pages/
│       ├── index.astro          # Home page
│       └── edit/
│           └── [id].astro       # Edit page
└── package.json
```

## 🚀 Installation and Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## 📖 Usage

### Main Tools

1. **Move Objects** (cursor) - Select and move annotations
2. **Add Text** (T) - Add text annotations
3. **Highlight** (marker) - Create colored highlights

### Text Settings

- **Font Size**: 8px - 24px
- **Font Family**: Arial, Helvetica, Times New Roman, Courier New
- **Text Color**: Color picker

### Highlight Colors

- White (#FFFFFF)
- Black (#000000)
- Red (#FF0000)
- Blue (#0000FF)
- Green (#00FF00)
- Yellow (#FFFF00)

### State Management

- **Save Changes** - Save current state with automatic naming
- **←** - Navigate to previous state
- **→** - Navigate to next state
- **Download** - Download edited PDF

## 🎯 Key Features

- **Precise Coordinates** - Annotations appear exactly where you create them
- **100% Scale** - PDF displays at natural size
- **All Pages** - Downloaded PDF contains all original pages
- **State Persistence** - Return to any saved state
- **Simple Interface** - Minimalist design with essential functions

## 🔧 Development

### Adding New Forms

Edit `src/data/forms.js`:

```javascript
export const pdfForms = [
  {
    id: 'form-id',
    title: 'Form Title',
    description: 'Form description',
    url: '/path/to/form.pdf',
    category: 'Category',
    thumbnail: 'https://example.com/thumbnail.jpg'
  }
];
```

### Customizing Highlight Colors

In `src/components/EditingToolbar.jsx`, add new colors to the highlight section:

```javascript
<button
  className={`w-8 h-8 rounded border-2 ${
    highlightColor === '#YOUR_COLOR' ? 'border-blue-500' : 'border-gray-300'
  } bg-your-color`}
  onClick={() => onHighlightColorChange('#YOUR_COLOR')}
/>
```

## 🎨 Interface Overview

### Toolbar
- **Tool Selection**: Move Objects, Add Text, Highlight
- **State Navigation**: Previous/Next state arrows with current state name
- **Save Button**: Save current state with automatic naming

### Text Tool Settings
- Font size dropdown (8px - 24px)
- Font family selection
- Color picker

### Highlight Tool Settings
- Color palette with 6 predefined colors
- Visual selection indicators

### State Management
- Automatic state numbering (State 0001, State 0002, etc.)
- Arrow navigation between states
- Current state display

## 🚀 Getting Started

1. **Select a PDF form** from the home page
2. **Choose your tool** (Move, Text, or Highlight)
3. **Add annotations** to the PDF
4. **Save your state** using the "Save Changes" button
5. **Navigate between states** using the arrow buttons
6. **Download your edited PDF** when ready

## 📝 License

MIT License