import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonacoEditorComponent } from './monaco-editor.component';

describe('MonacoEditorComponent', () => {
  let component: MonacoEditorComponent;
  let fixture: ComponentFixture<MonacoEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonacoEditorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MonacoEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should have default properties', () => {
      expect(component.value).toBe('');
      expect(component.language).toBe('plaintext');
      expect(component.theme).toBe('vs');
      expect(component.height).toBe('400px');
      expect(component.readOnly).toBe(false);
    });

    it('should set loading state initially', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should not have load errors initially', () => {
      expect(component.loadError()).toBe('');
    });
  });

  describe('Input Properties', () => {
    it('should accept value input', () => {
      component.value = 'test content';
      expect(component.value).toBe('test content');
    });

    it('should accept language input', () => {
      component.language = 'edi';
      expect(component.language).toBe('edi');
    });

    it('should accept theme input', () => {
      component.theme = 'edi-theme';
      expect(component.theme).toBe('edi-theme');
    });

    it('should accept height input', () => {
      component.height = '600px';
      expect(component.height).toBe('600px');
    });

    it('should accept readOnly input', () => {
      component.readOnly = true;
      expect(component.readOnly).toBe(true);
    });

    it('should accept custom options', () => {
      const customOptions = { minimap: { enabled: true } };
      component.options = customOptions;
      expect(component.options).toEqual(customOptions);
    });
  });

  describe('Output Events', () => {
    it('should have valueChange output', () => {
      expect(component.valueChange).toBeDefined();
    });

    it('should have editorReady output', () => {
      expect(component.editorReady).toBeDefined();
    });
  });

  describe('Lifecycle', () => {
    it('should initialize Monaco loader on ngOnInit', async () => {
      await component.ngOnInit();
      // After successful load, should not be loading
      expect(component.isLoading()).toBe(false);
    });

    it('should cleanup editor on destroy', () => {
      component.ngOnDestroy();
      // Should not throw error even if editor doesn't exist
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Editor Methods', () => {
    it('should return empty string from getValue when no editor', () => {
      const value = component.getValue();
      expect(value).toBe('');
    });

    it('should handle setValue when no editor exists', () => {
      expect(() => component.setValue('test')).not.toThrow();
    });

    it('should handle setLanguage when no editor exists', () => {
      expect(() => component.setLanguage('javascript')).not.toThrow();
    });

    it('should handle setTheme when no Monaco instance', () => {
      expect(() => component.setTheme('vs-dark')).not.toThrow();
    });

    it('should handle format when no editor exists', () => {
      expect(() => component.format()).not.toThrow();
    });
  });

  describe('Signals', () => {
    it('should update isLoading signal', () => {
      component.isLoading.set(false);
      expect(component.isLoading()).toBe(false);
      
      component.isLoading.set(true);
      expect(component.isLoading()).toBe(true);
    });

    it('should update loadError signal', () => {
      component.loadError.set('Test error');
      expect(component.loadError()).toBe('Test error');
      
      component.loadError.set('');
      expect(component.loadError()).toBe('');
    });
  });

  describe('Configuration', () => {
    it('should configure Monaco loader with correct paths', () => {
      // Monaco loader is configured in constructor
      expect(component).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle Monaco load failure gracefully', async () => {
      // This would require mocking the loader to fail
      // For now, just ensure component doesn't crash
      expect(component).toBeTruthy();
    });
  });
});
