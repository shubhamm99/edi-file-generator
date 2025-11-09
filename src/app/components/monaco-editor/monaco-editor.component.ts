import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  Output,
  EventEmitter,
  AfterViewInit,
  signal,
  OnChanges,
  SimpleChanges,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import loader from '@monaco-editor/loader';
import * as monaco from 'monaco-editor';
import type * as Monaco from 'monaco-editor';

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div class="monaco-loading" [style.height]="height">
        <div class="spinner"></div>
        <p>Loading editor...</p>
      </div>
    } @else if (loadError()) {
      <div class="monaco-error" [style.height]="height">
        <p class="error-message">{{ loadError() }}</p>
        <p class="error-hint">Please check your internet connection or try refreshing the page.</p>
      </div>
    } @else {
      <div #editorContainer class="monaco-editor-container" [style.height]="height"></div>
    }
  `,
  styles: [`
    .monaco-editor-container {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
    }
    .monaco-loading, .monaco-error {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      gap: 0.5rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error-message {
      color: #dc2626;
      font-weight: 600;
    }
    .error-hint {
      color: #6b7280;
      font-size: 0.875rem;
    }
  `],
})
export class MonacoEditorComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;
  
  @Input() value = '';
  @Input() language = 'plaintext';
  @Input() theme = 'vs';
  @Input() height = '400px';
  @Input() options: Monaco.editor.IStandaloneEditorConstructionOptions = {};
  @Input() readOnly = false;
  
  @Output() valueChange = new EventEmitter<string>();
  @Output() editorReady = new EventEmitter<Monaco.editor.IStandaloneCodeEditor>();

  private editor?: Monaco.editor.IStandaloneCodeEditor;
  private monaco = signal<typeof Monaco | null>(null);
  isLoading = signal<boolean>(true);
  loadError = signal<string>('');
  private initializationPending = false;

  constructor(private cdr: ChangeDetectorRef) {
    // Configure Monaco loader to use the npm package directly
    // This avoids CDN/CORS issues
    console.log('Configuring loader with npm package');
    loader.config({ monaco });

    // Initialize editor when monaco loads and view is ready
    effect(() => {
      const monacoValue = this.monaco();
      const monacoLoaded = !!monacoValue;
      const notLoading = !this.isLoading();
      const noError = !this.loadError();
      
      console.log('Effect: monaco value:', monacoValue, 'type:', typeof monacoValue, 'loaded?', monacoLoaded, 'not loading?', notLoading, 'no error?', noError);
      
      // When monaco loads and not loading, try to init if container exists
      if (monacoLoaded && notLoading && noError && !this.editor) {
        console.log('Monaco ready, will check for container in AfterViewInit');
      }
    });
  }

  async ngOnInit() {
    try {
      console.log('Loading Monaco Editor...');
      console.log('Loader object:', loader);
      console.log('Calling loader.init()...');
      
      // The loader.init() returns a cancelable promise that resolves to monaco
      const initPromise = loader.init();
      console.log('Init promise:', initPromise);
      
      const monacoInstance = await initPromise;
      
      console.log('Monaco loaded! Type:', typeof monacoInstance, 'Value:', monacoInstance);
      console.log('Has editor?:', !!(monacoInstance?.editor));
      console.log('Has languages?:', !!(monacoInstance?.languages));
      
      if (!monacoInstance) {
        throw new Error('Monaco loader returned undefined - check network tab for loading errors');
      }
      
      this.monaco.set(monacoInstance);
      console.log('Monaco signal set. Retrieved:', !!this.monaco());
      this.isLoading.set(false);
      console.log('Loading complete, triggering change detection');
      
      // Mark that we need to initialize once the view is ready
      this.initializationPending = true;
      this.cdr.detectChanges();
      
      // Wait for the next tick to ensure container is rendered
      setTimeout(() => {
        console.log('Timeout: Container?', !!this.editorContainer, 'Monaco?', !!this.monaco(), 'Editor?', !!this.editor);
        if (this.editorContainer && !this.editor) {
          console.log('Container now available, initializing editor');
          this.initEditor();
        }
      }, 0);
    } catch (error) {
      console.error('Failed to load Monaco Editor:', error);
      this.loadError.set('Failed to load editor');
      this.isLoading.set(false);
    }
  }

  ngAfterViewInit() {
    console.log('AfterViewInit - Container available?', !!this.editorContainer, 'Monaco loaded?', !!this.monaco(), 'Pending?', this.initializationPending);
    
    // If initialization is pending and container is now available
    if (this.initializationPending && this.editorContainer && this.monaco() && !this.editor) {
      console.log('Initializing editor from AfterViewInit');
      setTimeout(() => this.initEditor(), 0);
      this.initializationPending = false;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.editor) {
      console.log('Editor not ready for changes:', Object.keys(changes));
      return;
    }

    // Handle input property changes
    if (changes['value'] && !changes['value'].firstChange) {
      const currentValue = this.editor.getValue();
      if (currentValue !== changes['value'].currentValue) {
        this.editor.setValue(changes['value'].currentValue || '');
      }
    }

    if (changes['theme'] && !changes['theme'].firstChange) {
      console.log('Theme change detected:', changes['theme'].currentValue);
      this.setTheme(changes['theme'].currentValue);
    }

    if (changes['language'] && !changes['language'].firstChange) {
      this.setLanguage(changes['language'].currentValue);
    }

    if (changes['readOnly'] && !changes['readOnly'].firstChange) {
      this.editor.updateOptions({ readOnly: changes['readOnly'].currentValue });
    }
  }

  private initEditor() {
    const monacoInstance = this.monaco();
    if (!monacoInstance || !this.editorContainer || this.editor) {
      console.log('Editor init skipped:', { 
        hasMonaco: !!monacoInstance, 
        hasContainer: !!this.editorContainer, 
        hasEditor: !!this.editor 
      });
      return;
    }

    console.log('Initializing Monaco editor with theme:', this.theme);

    // Register custom EDI language first
    this.registerEdiLanguage();

    const defaultOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
      value: this.value,
      language: this.language,
      theme: this.theme,
      readOnly: this.readOnly,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      lineNumbers: 'on',
      wordWrap: 'on',
      wrappingIndent: 'indent',
      folding: true,
      renderWhitespace: 'selection',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      ...this.options,
    };

    try {
      this.editor = monacoInstance.editor.create(
        this.editorContainer.nativeElement,
        defaultOptions
      );

      console.log('Monaco editor created successfully');

      // Emit changes
      this.editor.onDidChangeModelContent(() => {
        const value = this.editor?.getValue() || '';
        this.valueChange.emit(value);
      });

      // Focus the editor
      this.editor.focus();

      this.editorReady.emit(this.editor);
    } catch (error) {
      console.error('Error creating Monaco editor:', error);
      this.loadError.set('Failed to create editor');
    }
  }

  private registerEdiLanguage() {
    const monacoInstance = this.monaco();
    if (!monacoInstance) return;

    // Register EDI language
    monacoInstance.languages.register({ id: 'edi' });

    // Define EDI tokenizer
    monacoInstance.languages.setMonarchTokensProvider('edi', {
      tokenizer: {
        root: [
          // Segment identifiers (ISA, GS, ST, etc.)
          [/^[A-Z0-9]{2,3}/, 'keyword'],
          
          // Segment terminator (~)
          [/~/, 'delimiter.segment'],
          
          // Element separator (*)
          [/\*/, 'delimiter.element'],
          
          // Sub-element separator (:)
          [/:/, 'delimiter.subelement'],
          
          // Numbers
          [/\d+(\.\d+)?/, 'number'],
          
          // Dates (YYMMDD, YYYYMMDD)
          [/\d{6,8}/, 'string.date'],
          
          // Everything else
          [/./, 'string'],
        ],
      },
    });

    // Define EDI theme
    monacoInstance.editor.defineTheme('edi-theme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'delimiter.segment', foreground: 'FF0000', fontStyle: 'bold' },
        { token: 'delimiter.element', foreground: '008000' },
        { token: 'delimiter.subelement', foreground: '808080' },
        { token: 'number', foreground: '098658' },
        { token: 'string.date', foreground: 'A31515' },
        { token: 'string', foreground: '000000' },
      ],
      colors: {
        'editor.foreground': '#000000',
        'editor.background': '#FFFFFF',
        'editorCursor.foreground': '#000000',
        'editor.lineHighlightBackground': '#F0F0F0',
        'editorLineNumber.foreground': '#237893',
        'editor.selectionBackground': '#ADD6FF',
        'editor.inactiveSelectionBackground': '#E5EBF1',
      },
    });

    // Define dark EDI theme
    monacoInstance.editor.defineTheme('edi-theme-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'delimiter.segment', foreground: 'F48771', fontStyle: 'bold' },
        { token: 'delimiter.element', foreground: '4EC9B0' },
        { token: 'delimiter.subelement', foreground: '808080' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'string.date', foreground: 'CE9178' },
        { token: 'string', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.foreground': '#D4D4D4',
        'editor.background': '#1E1E1E',
        'editorCursor.foreground': '#AEAFAD',
        'editor.lineHighlightBackground': '#2A2A2A',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
      },
    });
  }

  setValue(value: string) {
    if (this.editor) {
      this.editor.setValue(value);
    }
  }

  getValue(): string {
    return this.editor?.getValue() || '';
  }

  setLanguage(language: string) {
    const monacoInstance = this.monaco();
    if (this.editor && monacoInstance) {
      const model = this.editor.getModel();
      if (model) {
        monacoInstance.editor.setModelLanguage(model, language);
      }
    }
  }

  setTheme(theme: string) {
    const monacoInstance = this.monaco();
    if (monacoInstance) {
      monacoInstance.editor.setTheme(theme);
    }
  }

  format() {
    if (this.editor) {
      this.editor.getAction('editor.action.formatDocument')?.run();
    }
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.dispose();
    }
  }
}
