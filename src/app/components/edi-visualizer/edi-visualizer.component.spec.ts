import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EdiVisualizerComponent } from './edi-visualizer.component';
import { EdiGeneratorService } from '../../services/edi-generator.service';

describe('EdiVisualizerComponent', () => {
  let component: EdiVisualizerComponent;
  let fixture: ComponentFixture<EdiVisualizerComponent>;
  let service: EdiGeneratorService;

  const validEdi = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *230101*1200*^*00501*000000001*0*P*:~
GS*HP*SENDER*RECEIVER*20230101*1200*1*X*005010X221A1~
ST*835*0001*005010X221A1~
BPR*I*1000.00*C*ACH*CCP*01*123456789*DA*987654321*1234567890*20230101*01*123456789*DA*987654321*1234567890~
TRN*1*12345678*1234567890~
N1*PR*INSURANCE COMPANY~
N3*123 INSURANCE WAY~
N4*CITY*ST*12345~
REF*EV*123456~
DTM*405*20230101~
CLP*CLAIM001*1*1000.00*900.00*0.00*12*12345678~
NM1*QC*1*DOE*JOHN****MI*123456789~
SVC*HC:99213*100.00*90.00**1~
DTM*472*20230101~
CAS*CO*45*10.00~
SE*15*0001~
GE*1*1~
IEA*1*000000001~`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdiVisualizerComponent],
      providers: [EdiGeneratorService]
    }).compileComponents();

    fixture = TestBed.createComponent(EdiVisualizerComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(EdiGeneratorService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have empty EDI input', () => {
      expect(component.ediInput()).toBe('');
    });

    it('should have null EDI summary', () => {
      expect(component.ediSummary()).toBeNull();
    });

    it('should not have errors', () => {
      expect(component.errorMessage()).toBe('');
    });

    it('should have empty validation errors', () => {
      expect(component.validationErrors().length).toBe(0);
    });

    it('should have empty parsed segments', () => {
      expect(component.parsedSegments().length).toBe(0);
    });
  });

  describe('EDI Validation', () => {
    it('should validate EDI before parsing', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });
      
      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        expect(service.validate835).toHaveBeenCalledWith(validEdi);
        done();
      }, 400);
    });

    it('should show validation errors for invalid EDI', (done) => {
      const errors = ['Missing ISA segment', 'Invalid format'];
      spyOn(service, 'validate835').and.returnValue({ isValid: false, errors });

      component.ediInput.set('invalid edi');
      component.parseEDI();

      setTimeout(() => {
        expect(component.validationErrors().length).toBe(2);
        expect(component.errorMessage()).toContain('validation');
        done();
      }, 400);
    });

    it('should clear validation errors on valid EDI', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        expect(component.validationErrors().length).toBe(0);
        done();
      }, 400);
    });
  });

  describe('EDI Parsing', () => {
    it('should parse valid EDI successfully', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        expect(component.ediSummary()).not.toBeNull();
        expect(component.errorMessage()).toBe('');
        done();
      }, 400);
    });

    it('should extract payment information', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        const summary = component.ediSummary();
        expect(summary).not.toBeNull();
        expect(summary?.checkAmount).toBeDefined();
        expect(summary?.checkDate).toBeDefined();
        done();
      }, 400);
    });

    it('should extract payer information', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        const summary = component.ediSummary();
        expect(summary?.payerName).toBeDefined();
        expect(summary?.payerName).toContain('INSURANCE COMPANY');
        done();
      }, 400);
    });

    it('should extract claims information', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        const summary = component.ediSummary();
        expect(summary?.claims).toBeDefined();
        expect(summary?.claims.length).toBeGreaterThan(0);
        done();
      }, 400);
    });

    it('should parse segments correctly', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        const segments = component.parsedSegments();
        expect(segments.length).toBeGreaterThan(0);
        expect(segments[0].segmentId).toBe('ISA');
        done();
      }, 400);
    });

    it('should handle EDI with different formats', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      const singleLineEdi = validEdi.replace(/\n/g, '');
      component.ediInput.set(singleLineEdi);
      component.parseEDI();

      setTimeout(() => {
        expect(component.ediSummary()).not.toBeNull();
        done();
      }, 400);
    });
  });

  describe('Error Handling', () => {
    it('should set error for empty input', () => {
      component.ediInput.set('');
      component.parseEDI();

      expect(component.errorMessage()).toContain('Please enter');
    });

    it('should set error for missing ISA segment', (done) => {
      spyOn(service, 'validate835').and.returnValue({ 
        isValid: false, 
        errors: ['Missing ISA segment'] 
      });

      component.ediInput.set('GS*HP*test~');
      component.parseEDI();

      setTimeout(() => {
        expect(component.errorMessage()).toBeTruthy();
        expect(component.validationErrors().length).toBeGreaterThan(0);
        done();
      }, 400);
    });

    it('should handle parsing exceptions gracefully', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      // Force a parsing error by using incomplete EDI
      component.ediInput.set('ISA*incomplete');
      component.parseEDI();

      setTimeout(() => {
        // Should handle the error without crashing
        expect(component).toBeTruthy();
        done();
      }, 400);
    });
  });

  describe('Clear Functionality', () => {
    it('should clear all data', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();
      
      setTimeout(() => {
        component.clearInput();

        expect(component.ediInput()).toBe('');
        expect(component.ediSummary()).toBeNull();
        expect(component.errorMessage()).toBe('');
        expect(component.validationErrors().length).toBe(0);
        expect(component.parsedSegments().length).toBe(0);
        done();
      }, 400);
    });
  });

  describe('Sample Data', () => {
    it('should load sample EDI', () => {
      component.loadSampleEDI();

      expect(component.ediInput()).toBeTruthy();
      expect(component.ediInput()).toContain('ISA');
      expect(component.ediInput()).toContain('835');
    });

    it('should parse sample data successfully', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.loadSampleEDI();
      component.parseEDI();

      setTimeout(() => {
        expect(component.ediSummary()).not.toBeNull();
        expect(component.errorMessage()).toBe('');
        done();
      }, 400);
    });
  });

  describe('UI State', () => {
    it('should show no data message when no EDI is parsed', () => {
      expect(component.ediSummary()).toBeNull();
      expect(component.errorMessage()).toBe('');
    });

    it('should show parsed data after successful parsing', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        expect(component.ediSummary()).not.toBeNull();
        expect(component.errorMessage()).toBe('');
        done();
      }, 400);
    });

    it('should show error state when parsing fails', (done) => {
      spyOn(service, 'validate835').and.returnValue({ 
        isValid: false, 
        errors: ['Invalid EDI'] 
      });

      component.ediInput.set('invalid');
      component.parseEDI();

      setTimeout(() => {
        expect(component.errorMessage()).toBeTruthy();
        expect(component.ediSummary()).toBeNull();
        done();
      }, 400);
    });

    it('should toggle showSegments flag', () => {
      const initial = component.showSegments();
      component.showSegments.set(!initial);
      expect(component.showSegments()).toBe(!initial);
    });
  });

  describe('Download Functionality', () => {
    it('should download EDI input as text file', () => {
      component.ediInput.set('ISA*test~GS*test~ST*835~');

      const mockLink = {
        href: '',
        download: '',
        click: jasmine.createSpy('click'),
      } as any;

      spyOn(document, 'createElement').and.returnValue(mockLink);
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      component.downloadEDI();

      expect(mockLink.download).toContain('EDI-835-Input-');
      expect(mockLink.download).toContain('.txt');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should not download EDI if no input exists', () => {
      component.ediInput.set('');
      const createElementSpy = spyOn(document, 'createElement');

      component.downloadEDI();

      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('should download parsed data as JSON file', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        const mockLink = {
          href: '',
          download: '',
          click: jasmine.createSpy('click'),
        } as any;

        spyOn(document, 'createElement').and.returnValue(mockLink);
        spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
        spyOn(window.URL, 'revokeObjectURL');
        spyOn(document.body, 'appendChild');
        spyOn(document.body, 'removeChild');

        component.downloadParsedData();

        expect(mockLink.download).toContain('EDI-835-Parsed-');
        expect(mockLink.download).toContain('.json');
        expect(mockLink.click).toHaveBeenCalled();
        done();
      }, 400);
    });

    it('should not download parsed data if no summary exists', () => {
      component.ediSummary.set(null);
      const createElementSpy = spyOn(document, 'createElement');

      component.downloadParsedData();

      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('should create valid JSON for download', (done) => {
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.ediInput.set(validEdi);
      component.parseEDI();

      setTimeout(() => {
        const summary = component.ediSummary();
        expect(summary).not.toBeNull();

        // Verify JSON can be stringified
        expect(() => JSON.stringify(summary, null, 2)).not.toThrow();
        done();
      }, 400);
    });
  });

  describe('Integration', () => {
    it('should work with EdiGeneratorService', () => {
      const realService = TestBed.inject(EdiGeneratorService);
      expect(realService).toBeTruthy();
      
      const validation = realService.validate835(validEdi);
      expect(validation.isValid).toBe(true);
    });

    it('should handle generated EDI from EdiGeneratorService', () => {
      const formData = {
        transactionType: '835',
        delimiter: '*~',
        // ... minimal form data
      };

      const generatedEdi = service.generate835(formData);
      spyOn(service, 'validate835').and.callThrough();

      component.ediInput.set(generatedEdi);
      component.parseEDI();

      expect(service.validate835).toHaveBeenCalled();
    });
  });
});
