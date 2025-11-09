import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { EdiGeneratorComponent } from './edi-generator.component';
import { EdiGeneratorService } from '../../services/edi-generator.service';

describe('EdiGeneratorComponent', () => {
  let component: EdiGeneratorComponent;
  let fixture: ComponentFixture<EdiGeneratorComponent>;
  let service: EdiGeneratorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdiGeneratorComponent, ReactiveFormsModule],
      providers: [EdiGeneratorService]
    }).compileComponents();

    fixture = TestBed.createComponent(EdiGeneratorComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(EdiGeneratorService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with default form values', () => {
      expect(component.ediFormGroup).toBeDefined();
      expect(component.ediFormGroup.get('transactionType')?.value).toBe('835');
      expect(component.ediFormGroup.get('delimiter')?.value).toBe('*~');
    });

    it('should have one claim by default', () => {
      const claims = component.claims;
      expect(claims.length).toBe(1);
    });

    it('should have insurance, provider, and patient groups', () => {
      expect(component.ediFormGroup.get('insurance')).toBeDefined();
      expect(component.ediFormGroup.get('provider')).toBeDefined();
      expect(component.ediFormGroup.get('patient')).toBeDefined();
    });
  });

  describe('Section Expansion', () => {
    it('should toggle section expansion', () => {
      const initialState = component.isSectionExpanded('transaction');
      component.toggleSection('transaction');
      expect(component.isSectionExpanded('transaction')).toBe(!initialState);
    });

    it('should expand and collapse claims', () => {
      component.toggleClaim(0);
      expect(component.isClaimExpanded(0)).toBe(true);
      component.toggleClaim(0);
      expect(component.isClaimExpanded(0)).toBe(false);
    });
  });

  describe('Claims Management', () => {
    it('should add a new claim', () => {
      const initialCount = component.claims.length;
      component.addClaim();
      expect(component.claims.length).toBe(initialCount + 1);
    });

    it('should remove a claim', () => {
      component.addClaim();
      const initialCount = component.claims.length;
      component.removeClaim(0);
      expect(component.claims.length).toBe(initialCount - 1);
    });

    it('should duplicate a claim', () => {
      component.claims.at(0).patchValue({
        claimNumber: 'CLAIM001',
        totalCharge: '1000.00',
        payment: '900.00'
      });

      component.duplicateClaim(0);
      expect(component.claims.length).toBe(2);
      expect(component.claims.at(1).get('totalCharge')?.value).toBe('1000.00');
    });

    it('should not remove the last claim', () => {
      while (component.claims.length > 1) {
        component.removeClaim(0);
      }
      component.removeClaim(0);
      expect(component.claims.length).toBe(1);
    });
  });

  describe('Service Lines Management', () => {
    it('should add service line to claim', () => {
      const claimIndex = 0;
      const initialCount = component.getServiceLines(claimIndex).length;
      component.addServiceLine(claimIndex);
      expect(component.getServiceLines(claimIndex).length).toBe(initialCount + 1);
    });

    it('should remove service line from claim', () => {
      const claimIndex = 0;
      component.addServiceLine(claimIndex);
      const initialCount = component.getServiceLines(claimIndex).length;
      component.removeServiceLine(claimIndex, 0);
      expect(component.getServiceLines(claimIndex).length).toBe(initialCount - 1);
    });

    it('should duplicate service line', () => {
      const claimIndex = 0;
      component.getServiceLines(claimIndex).at(0).patchValue({
        procedureCode: '99213',
        chargeAmount: '100.00',
        paidAmount: '100.00'
      });

      component.duplicateServiceLine(claimIndex, 0);
      expect(component.getServiceLines(claimIndex).length).toBe(2);
      expect(component.getServiceLines(claimIndex).at(1).get('procedureCode')?.value).toBe('99213');
    });
  });

  describe('Adjustments Management', () => {
    it('should add adjustment to service line', () => {
      const claimIndex = 0;
      const serviceIndex = 0;
      const initialCount = component.getAdjustments(claimIndex, serviceIndex).length;
      component.addAdjustment(claimIndex, serviceIndex);
      expect(component.getAdjustments(claimIndex, serviceIndex).length).toBe(initialCount + 1);
    });

    it('should remove adjustment from service line', () => {
      const claimIndex = 0;
      const serviceIndex = 0;
      component.addAdjustment(claimIndex, serviceIndex);
      const initialCount = component.getAdjustments(claimIndex, serviceIndex).length;
      component.removeAdjustment(claimIndex, serviceIndex, 0);
      expect(component.getAdjustments(claimIndex, serviceIndex).length).toBe(initialCount - 1);
    });

    it('should duplicate adjustment', () => {
      const claimIndex = 0;
      const serviceIndex = 0;
      component.getAdjustments(claimIndex, serviceIndex).at(0).patchValue({
        adjustmentCode: 'CO-45',
        adjustmentAmount: '50.00'
      });

      component.duplicateAdjustment(claimIndex, serviceIndex, 0);
      expect(component.getAdjustments(claimIndex, serviceIndex).length).toBe(2);
      expect(component.getAdjustments(claimIndex, serviceIndex).at(1).get('adjustmentCode')?.value).toBe('CO-45');
    });
  });

  describe('PLB Adjustments', () => {
    it('should add PLB adjustment', () => {
      const initialCount = component.plbAdjustments.length;
      component.addPlbAdjustment();
      expect(component.plbAdjustments.length).toBe(initialCount + 1);
    });

    it('should remove PLB adjustment', () => {
      component.addPlbAdjustment();
      const initialCount = component.plbAdjustments.length;
      component.removePlbAdjustment(0);
      expect(component.plbAdjustments.length).toBe(initialCount - 1);
    });
  });

  describe('EDI Generation', () => {
    it('should generate EDI when form is valid', () => {
      spyOn(service, 'generate835').and.returnValue('ISA*test~');
      
      component.generateEDI();
      
      expect(component.isLoading()).toBe(true);
      
      setTimeout(() => {
        expect(service.generate835).toHaveBeenCalled();
        expect(component.ediContent()).toBeTruthy();
        expect(component.isLoading()).toBe(false);
      }, 600);
    });

    it('should validate generated EDI', (done) => {
      spyOn(service, 'generate835').and.returnValue('ISA*test~GS*test~ST*835~BPR*test~SE*4~GE*1~IEA*1~');
      spyOn(service, 'validate835').and.returnValue({ isValid: true, errors: [] });

      component.generateEDI();

      setTimeout(() => {
        expect(service.validate835).toHaveBeenCalled();
        expect(component.isValidEdi()).toBe(true);
        done();
      }, 600);
    });

    it('should set validation errors when EDI is invalid', (done) => {
      spyOn(service, 'generate835').and.returnValue('invalid');
      spyOn(service, 'validate835').and.returnValue({ 
        isValid: false, 
        errors: ['Error 1', 'Error 2'] 
      });

      component.generateEDI();

      setTimeout(() => {
        expect(component.isValidEdi()).toBe(false);
        expect(component.validationErrors().length).toBe(2);
        done();
      }, 600);
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy EDI content to clipboard', (done) => {
      component.ediContent.set('Test EDI Content');
      
      // Mock clipboard API
      const clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      component.copyToClipboard();

      setTimeout(() => {
        expect(clipboardSpy).toHaveBeenCalledWith('Test EDI Content');
        expect(component.copySuccess()).toBe(true);
        done();
      }, 100);
    });

    it('should handle clipboard error gracefully', (done) => {
      component.ediContent.set('Test EDI Content');
      
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject('Error'));
      spyOn(console, 'error');

      component.copyToClipboard();

      setTimeout(() => {
        expect(console.error).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Download EDI', () => {
    it('should download EDI content as text file', () => {
      component.ediContent.set('ISA*test~GS*test~ST*835~');

      // Mock DOM methods
      const createElementSpy = spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click'),
      } as any);
      const createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      const revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL');
      const appendChildSpy = spyOn(document.body, 'appendChild');
      const removeChildSpy = spyOn(document.body, 'removeChild');

      component.downloadEDI();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url');
    });

    it('should not download if no EDI content exists', () => {
      component.ediContent.set('');
      const createElementSpy = spyOn(document, 'createElement');

      component.downloadEDI();

      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('should set correct filename with timestamp', () => {
      component.ediContent.set('ISA*test~');
      
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

      expect(mockLink.download).toContain('EDI-835-');
      expect(mockLink.download).toContain('.txt');
    });
  });

  describe('Reset Form', () => {
    it('should reset form to initial state', () => {
      // Modify form
      component.addClaim();
      component.ediContent.set('Some content');
      component.copySuccess.set(true);

      // Reset
      component.resetForm();

      expect(component.claims.length).toBe(1);
      expect(component.ediContent()).toBe('');
      expect(component.copySuccess()).toBe(false);
      expect(component.validationErrors().length).toBe(0);
    });
  });

  describe('Clear Preview', () => {
    it('should clear EDI preview content', () => {
      component.ediContent.set('Test content');
      component.copySuccess.set(true);

      component.clearPreview();

      expect(component.ediContent()).toBe('');
      expect(component.copySuccess()).toBe(false);
    });
  });

  describe('Signals', () => {
    it('should update signals correctly', () => {
      expect(component.isLoading()).toBe(false);
      component.isLoading.set(true);
      expect(component.isLoading()).toBe(true);

      expect(component.ediContent()).toBe('');
      component.ediContent.set('New content');
      expect(component.ediContent()).toBe('New content');
    });
  });
});
