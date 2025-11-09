import { TestBed } from '@angular/core/testing';
import { EdiGeneratorService } from './edi-generator.service';

describe('EdiGeneratorService', () => {
  let service: EdiGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EdiGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generate835', () => {
    it('should generate valid EDI 835 with minimal data', () => {
      const formData = {
        delimiter: '*~',
        insurance: { payerId: 'TEST001', planName: 'Test Insurance' },
        provider: { npi: '1234567890', name: 'Test Provider' },
        patient: { firstName: 'John', lastName: 'Doe' },
        claims: [{
          claimNumber: 'CLAIM001',
          totalCharge: '1000.00',
          payment: '1000.00',
          adjustment: '0.00',
          serviceLines: []
        }]
      };

      const result = service.generate835(formData);

      expect(result).toContain('ISA');
      expect(result).toContain('GS');
      expect(result).toContain('ST*835');
      expect(result).toContain('BPR');
      expect(result).toContain('CLP*CLAIM001');
      expect(result).toContain('SE');
      expect(result).toContain('GE');
      expect(result).toContain('IEA');
    });

    it('should include all required segments', () => {
      const formData = {
        delimiter: '*~',
        insurance: { payerId: 'TEST001' },
        provider: { npi: '1234567890' },
        patient: {},
        claims: [{ claimNumber: 'CLAIM001' }]
      };

      const result = service.generate835(formData);
      const segments = result.split('~').filter(s => s.trim());

      const requiredSegments = ['ISA', 'GS', 'ST', 'BPR', 'SE', 'GE', 'IEA'];
      requiredSegments.forEach(segment => {
        const found = segments.some(s => s.trim().startsWith(segment));
        expect(found).toBe(true, `Expected to find ${segment} segment`);
      });
    });

    it('should generate multiple claims correctly', () => {
      const formData = {
        delimiter: '*~',
        claims: [
          { claimNumber: 'CLAIM001', payment: '100.00' },
          { claimNumber: 'CLAIM002', payment: '200.00' },
          { claimNumber: 'CLAIM003', payment: '300.00' }
        ]
      };

      const result = service.generate835(formData);

      expect(result).toContain('CLP*CLAIM001');
      expect(result).toContain('CLP*CLAIM002');
      expect(result).toContain('CLP*CLAIM003');
    });

    it('should calculate total payment in BPR segment', () => {
      const formData = {
        delimiter: '*~',
        claims: [
          { payment: '100.00' },
          { payment: '200.00' },
          { payment: '300.00' }
        ]
      };

      const result = service.generate835(formData);
      
      // BPR segment should contain total of 600.00
      expect(result).toContain('BPR*I*600.00*C');
    });

    it('should handle service lines within claims', () => {
      const formData = {
        delimiter: '*~',
        claims: [{
          claimNumber: 'CLAIM001',
          serviceLines: [
            { procedureCode: '99213', chargeAmount: '100.00', paidAmount: '100.00' },
            { procedureCode: '99214', chargeAmount: '200.00', paidAmount: '200.00' }
          ]
        }]
      };

      const result = service.generate835(formData);

      expect(result).toContain('SVC*HC:99213');
      expect(result).toContain('SVC*HC:99214');
    });

    it('should include CAS segments for adjustments', () => {
      const formData = {
        delimiter: '*~',
        claims: [{
          serviceLines: [{
            claimAdjustments: [
              { adjustmentCode: 'CO-45', adjustmentAmount: '50.00' }
            ]
          }]
        }]
      };

      const result = service.generate835(formData);

      expect(result).toContain('CAS*CO*45*50.00');
    });

    it('should include PLB segment when adjustments exist', () => {
      const formData = {
        delimiter: '*~',
        provider: { npi: '1234567890' },
        plb: {
          adjustments: [
            { adjustmentCode: 'WO', adjustmentId: 'ADJ001', adjustmentAmount: '100.00' }
          ]
        },
        claims: []
      };

      const result = service.generate835(formData);

      expect(result).toContain('PLB*1234567890');
      expect(result).toContain('WO:ADJ001');
    });

    it('should use line breaks to separate segments', () => {
      const formData = {
        delimiter: '*~',
        claims: [{ claimNumber: 'TEST' }]
      };

      const result = service.generate835(formData);

      expect(result).toContain('\n');
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(5);
    });
  });

  describe('validate835', () => {
    it('should validate correct EDI structure', () => {
      const validEdi = 'ISA*00*          *00*          *ZZ*SUBMITTERID    *ZZ*RECEIVERID     *241109*1200*U*00401*000000001*0*P*:~\n' +
        'GS*HP*PAYERID*RECEIVERID*20241109*1200*1*X*005010X221A1~\n' +
        'ST*835*0001*005010X221A1~\n' +
        'BPR*I*1000.00*C*ACH*CCP*01*000000000*DA*0000000000*PAYERID***01*000000000*DA*0000000000*20241109~\n' +
        'TRN*1*123456789012*1234567890~\n' +
        'SE*5*0001~\n' +
        'GE*1*1~\n' +
        'IEA*1*000000001~';

      const result = service.validate835(validEdi);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing ISA segment', () => {
      const invalidEdi = 'GS*HP*PAYERID*RECEIVERID~ST*835*0001~';

      const result = service.validate835(invalidEdi);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content does not appear to be EDI format - missing ISA segment');
    });

    it('should detect missing segment terminator', () => {
      const invalidEdi = 'ISA*00*test';

      const result = service.validate835(invalidEdi);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('segment terminator'))).toBe(true);
    });

    it('should detect missing required segments', () => {
      const incompleteEdi = 'ISA*00*test~GS*HP*test~';

      const result = service.validate835(incompleteEdi);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing required segment'))).toBe(true);
    });

    it('should validate segment count', () => {
      const tooFewSegments = 'ISA*test~GS*test~';

      const result = service.validate835(tooFewSegments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must have at least 7 segments'))).toBe(true);
    });

    it('should validate segment identifiers', () => {
      const invalidSegmentId = 'ISA*test~XYZ123*invalid~ST*835~BPR*test~SE*1~GE*1~IEA*1~';

      const result = service.validate835(invalidSegmentId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid segment identifier'))).toBe(true);
    });

    it('should accept alphanumeric segment IDs', () => {
      const validEdi = 'ISA*test~GS*test~ST*835~BPR*test~N1*test~NM1*test~SE*6~GE*1~IEA*1~';

      const result = service.validate835(validEdi);

      // Should not complain about N1 or NM1
      expect(result.errors.some(e => e.includes('N1') && e.includes('Invalid'))).toBe(false);
      expect(result.errors.some(e => e.includes('NM1') && e.includes('Invalid'))).toBe(false);
    });

    it('should validate first segment is ISA', () => {
      const wrongOrder = 'GS*test~ISA*test~ST*835~BPR*test~SE*4~GE*1~IEA*1~';

      const result = service.validate835(wrongOrder);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('First segment must be ISA'))).toBe(true);
    });

    it('should validate last segment is IEA', () => {
      const wrongOrder = 'ISA*test~GS*test~ST*835~BPR*test~SE*4~GE*1~';

      const result = service.validate835(wrongOrder);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Last segment must be IEA'))).toBe(true);
    });

    it('should reject empty content', () => {
      const result = service.validate835('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('EDI content is empty');
    });

    it('should reject random text', () => {
      const result = service.validate835('asdfghjkl12345');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate transaction type 835', () => {
      const wrong837 = 'ISA*test~GS*test~ST*837*0001~BPR*test~SE*4~GE*1~IEA*1~';

      const result = service.validate835(wrong837);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Expected transaction type 835'))).toBe(true);
    });
  });
});
