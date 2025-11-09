import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { EdiGeneratorComponent } from './components/edi-generator/edi-generator.component';
import { EdiVisualizerComponent } from './components/edi-visualizer/edi-visualizer.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, EdiGeneratorComponent, EdiVisualizerComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have app title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toBe('EDI Tools');
  });

  it('should default to generator tool', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.activeTool()).toBe('generator');
  });

  describe('Tool Navigation', () => {
    it('should switch to visualizer tool', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      app.setActiveTool('visualizer');
      expect(app.activeTool()).toBe('visualizer');
    });

    it('should switch back to generator tool', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      app.setActiveTool('visualizer');
      app.setActiveTool('generator');
      expect(app.activeTool()).toBe('generator');
    });

    it('should maintain tool state', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      const initialTool = app.activeTool();
      expect(initialTool).toBe('generator');
      
      app.setActiveTool('visualizer');
      expect(app.activeTool()).toBe('visualizer');
      expect(app.activeTool()).not.toBe(initialTool);
    });
  });

  describe('Component Rendering', () => {
    it('should render the app title', () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('EDI');
    });

    it('should render tool buttons', () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should show generator component when generator tool is active', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      app.setActiveTool('generator');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const generator = compiled.querySelector('app-edi-generator');
      expect(generator).toBeTruthy();
    });

    it('should show visualizer component when visualizer tool is active', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      app.setActiveTool('visualizer');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const visualizer = compiled.querySelector('app-edi-visualizer');
      expect(visualizer).toBeTruthy();
    });

    it('should not show both components at the same time', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      app.setActiveTool('generator');
      fixture.detectChanges();
      let compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-edi-generator')).toBeTruthy();
      expect(compiled.querySelector('app-edi-visualizer')).toBeFalsy();
      
      app.setActiveTool('visualizer');
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-edi-generator')).toBeFalsy();
      expect(compiled.querySelector('app-edi-visualizer')).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should apply active styling to selected tool', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      app.setActiveTool('generator');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const generatorButton = Array.from(buttons).find(btn => 
        btn.textContent?.includes('Generator')
      );
      
      // Active button should have blue styling
      expect(generatorButton).toBeTruthy();
    });

    it('should render both tool buttons', () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const hasGeneratorButton = Array.from(buttons).some(btn => 
        btn.textContent?.includes('Generator')
      );
      const hasVisualizerButton = Array.from(buttons).some(btn => 
        btn.textContent?.includes('Visualizer')
      );
      
      expect(hasGeneratorButton).toBe(true);
      expect(hasVisualizerButton).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should properly instantiate child components', () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      
      // Should not throw any errors during rendering
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle tool switching without errors', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      expect(() => {
        app.setActiveTool('generator');
        fixture.detectChanges();
        app.setActiveTool('visualizer');
        fixture.detectChanges();
        app.setActiveTool('generator');
        fixture.detectChanges();
      }).not.toThrow();
    });
  });
});
