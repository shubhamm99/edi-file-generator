# Monaco Editor Integration

## Overview
Added Monaco Editor (the code editor that powers VS Code) to the EDI Visualizer component for an enhanced editing experience with syntax highlighting, line numbers, and advanced editor features.

## Features

### 🎨 Custom EDI Syntax Highlighting
- **Segment Identifiers** (ISA, GS, ST, BPR, etc.) - Blue, Bold
- **Segment Terminators** (~) - Red, Bold
- **Element Separators** (*) - Green
- **Sub-element Separators** (:) - Gray
- **Numbers** - Dark Green
- **Dates** (YYMMDD, YYYYMMDD) - Dark Red
- **General Text** - Black/White (depending on theme)

### 🌓 Theme Support
- **Light Theme** (`edi-theme`) - Clean white background with colorful syntax
- **Dark Theme** (`edi-theme-dark`) - VS Code-style dark theme
- Toggle button (🌙/☀️) in the header

### ⚙️ Editor Features
- ✅ Line numbers
- ✅ Word wrap
- ✅ Syntax folding
- ✅ Minimap (optional)
- ✅ Smooth scrolling
- ✅ Auto-layout (responsive)
- ✅ Whitespace rendering on selection
- ✅ Smooth cursor blinking

### 🔄 Fallback Mode
- Option to switch between Monaco Editor and standard textarea
- Checkbox toggle in the header: "Monaco Editor"
- Maintains functionality when Monaco is disabled

## Architecture

### Components

#### MonacoEditorComponent (`monaco-editor.component.ts`)
Reusable wrapper component for Monaco Editor with EDI language support.

**Inputs:**
- `value` - Initial editor content
- `language` - Programming language (default: 'plaintext', supports 'edi')
- `theme` - Editor theme (default: 'vs')
- `height` - Editor height (default: '400px')
- `options` - Monaco editor options
- `readOnly` - Read-only mode flag

**Outputs:**
- `valueChange` - Emits when content changes
- `editorReady` - Emits when editor is initialized

**Methods:**
- `setValue(value: string)` - Set editor content
- `getValue(): string` - Get current content
- `setLanguage(language: string)` - Change syntax language
- `setTheme(theme: string)` - Change editor theme
- `format()` - Format document

#### EDI Language Definition
Custom Monaco language with tokenizer for EDI format:

```typescript
{
  tokenizer: {
    root: [
      [/^[A-Z0-9]{2,3}/, 'keyword'],          // Segment IDs
      [/~/, 'delimiter.segment'],              // Segment terminator
      [/\*/, 'delimiter.element'],             // Element separator
      [/:/, 'delimiter.subelement'],           // Sub-element separator
      [/\d+(\.\d+)?/, 'number'],              // Numbers
      [/\d{6,8}/, 'string.date'],             // Dates
      [/./, 'string'],                         // Everything else
    ],
  },
}
```

### Configuration

#### Monaco Loader Configuration (CDN)
**Current Implementation** - Uses CDN for reliability and smaller bundle size:

```typescript
loader.config({ 
  paths: { 
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
  } 
});
```

**Benefits of CDN approach:**
- ✅ Smaller bundle size (~3-4 MB reduction)
- ✅ Better caching across websites
- ✅ No build configuration needed
- ✅ Faster initial page load
- ✅ Works with any base href

#### Alternative: Local Assets Configuration
If you prefer to bundle Monaco locally (offline support), update `angular.json`:

```json
{
  "assets": [
    "src/favicon.ico",
    "src/assets",
    {
      "glob": "**/*",
      "input": "node_modules/monaco-editor",
      "output": "assets/monaco-editor"
    }
  ]
}
```

And update the loader configuration in `monaco-editor.component.ts`:

```typescript
// For local assets with base href
loader.config({ 
  paths: { 
    vs: window.location.origin + '/edi-file-generator/assets/monaco-editor/min/vs'
  } 
});

// Or for local assets without base href
loader.config({ 
  paths: { 
    vs: '/assets/monaco-editor/min/vs'
  } 
});
```

## Implementation Details

### EDI Visualizer Integration

**New Signals:**
- `useMonaco` - Toggle Monaco editor on/off (default: true)
- `editorTheme` - Current theme ('edi-theme' or 'edi-theme-dark')

**New Methods:**
- `onEditorChange(value: string)` - Handle editor content changes
- `toggleTheme()` - Switch between light and dark themes
- Updated `loadSampleEDI()` - Formats sample with line breaks
- Updated `clearInput()` - Clears Monaco editor content

**HTML Structure:**
```html
<div class="flex items-center justify-between">
  <h2>EDI Input</h2>
  <div class="flex gap-2 items-center">
    <label>
      <input type="checkbox" [(ngModel)]="useMonaco" />
      Monaco Editor
    </label>
    <button (click)="toggleTheme()">
      {{ editorTheme() === 'edi-theme' ? '🌙' : '☀️' }}
    </button>
  </div>
</div>

@if (useMonaco()) {
  <app-monaco-editor
    [value]="ediInput()"
    (valueChange)="onEditorChange($event)"
    [language]="'edi'"
    [theme]="editorTheme()"
    [height]="'400px'"
  ></app-monaco-editor>
} @else {
  <textarea [(ngModel)]="ediInput"></textarea>
}
```

## Dependencies

### Packages Installed
```bash
npm install monaco-editor
npm install @monaco-editor/loader
```

### Package Versions
- `monaco-editor` - ^0.52.0 (or latest)
- `@monaco-editor/loader` - ^1.4.0 (or latest)

## Testing

### Test Coverage

**MonacoEditorComponent Tests** (`monaco-editor.component.spec.ts`):
- ✅ Component creation
- ✅ Default property values
- ✅ Input property binding
- ✅ Output event emitters
- ✅ Lifecycle hooks (init, destroy)
- ✅ Editor methods (setValue, getValue, setLanguage, setTheme, format)
- ✅ Signal management
- ✅ Error handling

**EdiVisualizerComponent Tests** (updated):
- ✅ Monaco editor initial state
- ✅ Editor value change handling
- ✅ Theme toggling
- ✅ Monaco editor toggle
- ✅ Sample EDI loading with formatting

### Running Tests
```powershell
# All tests
ng test

# Specific component
ng test --include='**/monaco-editor/**/*.spec.ts'

# With coverage
ng test --code-coverage
```

## Usage Guide

### For Users

**Enable Monaco Editor:**
1. Check the "Monaco Editor" checkbox in the EDI Input panel
2. Paste or type EDI content
3. Enjoy syntax highlighting and editor features

**Change Theme:**
1. Click the 🌙 (moon) icon for dark theme
2. Click the ☀️ (sun) icon for light theme

**Disable Monaco Editor:**
1. Uncheck the "Monaco Editor" checkbox
2. Falls back to standard textarea

**Load Sample:**
- Click "Load Sample" button
- Sample EDI is formatted with line breaks for better readability

### For Developers

**Using Monaco Editor Component:**

```typescript
import { MonacoEditorComponent } from './components/monaco-editor/monaco-editor.component';

@Component({
  imports: [MonacoEditorComponent],
  template: `
    <app-monaco-editor
      [value]="content"
      (valueChange)="onContentChange($event)"
      [language]="'edi'"
      [theme]="'edi-theme'"
      [height]="'500px'"
      [options]="editorOptions"
    ></app-monaco-editor>
  `
})
export class MyComponent {
  content = 'ISA*test~';
  editorOptions = {
    minimap: { enabled: true },
    readOnly: false
  };

  onContentChange(value: string) {
    console.log('Editor content:', value);
  }
}
```

**Custom Language Definition:**

The EDI language is automatically registered when the component initializes. You can extend or modify it in the `registerEdiLanguage()` method.

**Custom Themes:**

Define custom themes in the `registerEdiLanguage()` method:

```typescript
this.monaco.editor.defineTheme('my-custom-theme', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'FF0000' },
    // ... more rules
  ],
  colors: {
    'editor.background': '#FFFFFF',
    // ... more colors
  }
});
```

## Benefits

### Enhanced User Experience
1. **Syntax Highlighting** - Instantly identify segment types and delimiters
2. **Line Numbers** - Easy reference and navigation
3. **Word Wrap** - Better readability for long segments
4. **Minimap** - Quick overview of document structure
5. **Theme Options** - Comfortable viewing in any lighting

### Developer Experience
1. **Familiar Interface** - VS Code-like editor
2. **Reusable Component** - Can be used in other parts of the application
3. **Type Safety** - Full TypeScript support
4. **Extensible** - Easy to add more languages or themes

### Code Quality
1. **Better Error Detection** - Syntax errors are more visible
2. **Formatting** - Built-in formatting capabilities
3. **Navigation** - Go to line, find/replace, etc.
4. **Accessibility** - Keyboard shortcuts and screen reader support

## Future Enhancements

### Potential Features
- [ ] Auto-completion for EDI segment identifiers
- [ ] Error squiggles for validation errors
- [ ] Hover tooltips with segment descriptions
- [ ] Code folding for complete transactions
- [ ] Find and replace functionality
- [ ] Export with syntax highlighting (HTML)
- [ ] Compare two EDI files side-by-side
- [ ] EDI snippet library
- [ ] Custom color schemes
- [ ] Keyboard shortcuts documentation

### Performance Optimizations
- [ ] Lazy load Monaco Editor on demand
- [ ] Virtual scrolling for large files
- [ ] Web Worker for parsing
- [ ] Incremental parsing and validation

## Troubleshooting

### Common Issues

**Monaco Editor doesn't load:**
- Check browser console for errors
- Verify assets are correctly copied in `angular.json`
- Ensure Monaco files are in `dist/assets/monaco-editor`

**Syntax highlighting not working:**
- Verify language is set to 'edi'
- Check that custom language is registered
- Ensure theme is loaded correctly

**Performance issues with large files:**
- Disable minimap for files > 1000 lines
- Consider pagination or virtual scrolling
- Use `scrollBeyondLastLine: false`

**Theme not applying:**
- Check theme name matches defined themes
- Verify theme is registered before use
- Try switching themes to reset

## Technical Notes

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (may need polyfills)
- IE11: ❌ Not supported (Monaco requires modern browsers)

### Bundle Size
- **CDN Approach (Current)**: No impact on bundle size! Monaco is loaded from CDN
- **Local Assets Approach**: Adds ~3-4 MB to the bundle
- Loaded asynchronously for better initial load time
- Benefits from browser caching

### Accessibility
- Full keyboard navigation support
- Screen reader compatible
- ARIA attributes for semantic structure
- High contrast theme support

## References

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [Monaco Loader](https://www.npmjs.com/package/@monaco-editor/loader)
- [Custom Language Guide](https://microsoft.github.io/monaco-editor/monarch.html)
