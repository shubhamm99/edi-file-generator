import { Component, signal, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EdiGeneratorService } from '../../services/edi-generator.service';
import { MonacoEditorModule, EditorComponent } from 'ngx-monaco-editor-v2';

interface ParsedSegment {
  segmentId: string;
  elements: string[];
  description: string;
}

interface EdiSummary {
  checkNumber?: string;
  checkAmount?: string;
  checkDate?: string;
  payerName?: string;
  providerName?: string;
  claims: ClaimSummary[];
  providerAdjustments: ProviderAdjustment[];
}

interface ClaimSummary {
  claimNumber?: string;
  icn?: string;
  claimStatus?: string;
  chargedAmount?: string;
  paidAmount?: string;
  patientResponsibility?: string;
  serviceDate?: string;
  services: ServiceSummary[];
  adjustments: ClaimAdjustment[];
  remarkCodes: string[];
}

interface ServiceSummary {
  procedureCode?: string;
  chargedAmount?: string;
  paidAmount?: string;
  adjustments: ClaimAdjustment[];
}

interface ClaimAdjustment {
  groupCode?: string;
  reasonCode?: string;
  amount?: string;
  quantity?: string;
}

interface ProviderAdjustment {
  date?: string;
  reasonCode?: string;
  amount?: string;
  identifier?: string;
}

@Component({
  selector: 'app-edi-visualizer',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorModule],
  templateUrl: './edi-visualizer.component.html',
  styleUrl: './edi-visualizer.component.scss',
})
export class EdiVisualizerComponent {
  @ViewChild(EditorComponent, { static: false }) editorComponent?: EditorComponent;
  
  ediInput = signal<string>('');
  parsedSegments = signal<ParsedSegment[]>([]);
  ediSummary = signal<EdiSummary | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  validationErrors = signal<string[]>([]);
  showSegments = signal<boolean>(false);
  editorTheme = signal<string>('vs');
  useMonaco = signal<boolean>(false);

  editorOptions = signal({
    theme: 'vs',
    language: 'plaintext',
    minimap: { enabled: true },
    automaticLayout: true,
    fontSize: 13,
    wordWrap: 'on' as const,
    scrollBeyondLastLine: false
  });

  private parseTimeout: any;

  constructor(private ediGeneratorService: EdiGeneratorService) {
    // Auto-parse as user types (debounced)
    effect(() => {
      const input = this.ediInput();
      
      // Clear previous timeout
      if (this.parseTimeout) {
        clearTimeout(this.parseTimeout);
      }
      
      // Only parse if there's content
      if (input && input.trim()) {
        // Debounce parsing by 500ms - use setTimeout to defer signal writes
        this.parseTimeout = setTimeout(() => {
          this.parseEDI();
        }, 500);
      } else {
        // Defer signal writes to avoid writing inside effect
        setTimeout(() => {
          this.parsedSegments.set([]);
          this.ediSummary.set(null);
          this.errorMessage.set('');
          this.validationErrors.set([]);
        }, 0);
      }
    }, { allowSignalWrites: true });
  }

  parseEDI(): void {
    const input = this.ediInput();
    
    if (!input.trim()) {
      this.errorMessage.set('Please enter EDI content to visualize');
      this.clearEditorMarkers();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.validationErrors.set([]);

    setTimeout(() => {
      try {
        // Validate EDI first
        const validation = this.ediGeneratorService.validate835(input);
        
        if (!validation.isValid) {
          this.validationErrors.set(validation.errors);
          this.errorMessage.set('EDI validation failed. Please fix the errors below.');
          this.parsedSegments.set([]);
          this.ediSummary.set(null);
          this.isLoading.set(false);
          this.updateEditorMarkers(validation.errors);
          return;
        }
        
        // Clear markers if validation passes
        this.clearEditorMarkers();
        
        const segments = this.parseEdiContent(input);
        this.parsedSegments.set(segments);
        
        const summary = this.extractSummary(segments);
        this.ediSummary.set(summary);
        
        this.isLoading.set(false);
      } catch (error) {
        this.errorMessage.set('Error parsing EDI content. Please check the format.');
        this.isLoading.set(false);
      }
    }, 300);
  }

  private parseEdiContent(content: string): ParsedSegment[] {
    // Detect segment terminator (usually ~)
    const segmentTerminator = this.detectSegmentTerminator(content);
    
    // Split by segment terminator
    const segments = content.split(segmentTerminator).filter(s => s.trim());
    
    const parsed: ParsedSegment[] = [];

    segments.forEach(segment => {
      const trimmed = segment.trim();
      if (!trimmed) return;

      // Detect element delimiter (usually * or |)
      const delimiter = this.detectElementDelimiter(trimmed);
      const elements = trimmed.split(delimiter);
      const segmentId = elements[0];

      parsed.push({
        segmentId,
        elements: elements.slice(1),
        description: this.getSegmentDescription(segmentId)
      });
    });

    return parsed;
  }

  private detectSegmentTerminator(content: string): string {
    // Common terminators: ~, \n, or specific character after ISA segment
    if (content.includes('~')) return '~';
    if (content.match(/ISA.{105}(.)/)) {
      const match = content.match(/ISA.{105}(.)/);
      return match ? match[1] : '~';
    }
    return '~';
  }

  private detectElementDelimiter(segment: string): string {
    // Common delimiters: *, |, :
    if (segment.includes('*')) return '*';
    if (segment.includes('|')) return '|';
    if (segment.includes(':')) return ':';
    return '*';
  }

  private getSegmentDescription(segmentId: string): string {
    const descriptions: { [key: string]: string } = {
      'ISA': 'Interchange Control Header',
      'GS': 'Functional Group Header',
      'ST': 'Transaction Set Header',
      'BPR': 'Financial Information',
      'TRN': 'Trace Number',
      'REF': 'Reference Identification',
      'DTM': 'Date/Time Reference',
      'N1': 'Name',
      'N2': 'Additional Name Information',
      'N3': 'Address Information',
      'N4': 'Geographic Location',
      'PER': 'Administrative Communications Contact',
      'CLP': 'Claim Payment Information',
      'NM1': 'Individual or Organizational Name',
      'MIA': 'Inpatient Adjudication Information',
      'MOA': 'Outpatient Adjudication Information',
      'AMT': 'Monetary Amount Information',
      'QTY': 'Quantity Information',
      'SVC': 'Service Payment Information',
      'CAS': 'Claim Adjustment',
      'PLB': 'Provider Level Adjustment',
      'SE': 'Transaction Set Trailer',
      'GE': 'Functional Group Trailer',
      'IEA': 'Interchange Control Trailer',
      'CLM': 'Claim Information',
      'HI': 'Health Care Information Codes',
      'LX': 'Service Line Number',
      'SV1': 'Professional Service',
      'SV2': 'Institutional Service',
      'PWK': 'Paperwork',
      'CR1': 'Ambulance Transport Information',
      'CR2': 'Spinal Manipulation Service Information',
      'CRC': 'Conditions Indicator',
      'DTP': 'Date or Time or Period',
    };

    return descriptions[segmentId] || 'Unknown Segment';
  }

  private extractSummary(segments: ParsedSegment[]): EdiSummary {
    const summary: EdiSummary = {
      claims: [],
      providerAdjustments: []
    };

    let currentClaim: ClaimSummary | null = null;
    let currentService: ServiceSummary | null = null;

    segments.forEach(segment => {
      switch (segment.segmentId) {
        case 'BPR':
          // Financial Information - Check details
          summary.checkAmount = segment.elements[1];
          summary.checkDate = segment.elements[15];
          summary.checkNumber = segment.elements[6] || segment.elements[3];
          break;

        case 'N1':
          // Payer/Provider Name
          const entityCode = segment.elements[0];
          const entityName = segment.elements[1];
          if (entityCode === 'PR') {
            summary.payerName = entityName;
          } else if (entityCode === 'PE') {
            summary.providerName = entityName;
          }
          break;

        case 'CLP':
          // Save previous claim if exists
          if (currentClaim) {
            summary.claims.push(currentClaim);
          }
          // Start new claim
          currentClaim = {
            claimNumber: segment.elements[0],
            claimStatus: this.getClaimStatus(segment.elements[1]),
            chargedAmount: segment.elements[2],
            paidAmount: segment.elements[3],
            patientResponsibility: segment.elements[4],
            icn: segment.elements[6],
            services: [],
            adjustments: [],
            remarkCodes: []
          };
          currentService = null;
          break;

        case 'DTM':
          // Date - Service date
          if (currentClaim && segment.elements[0] === '232') {
            currentClaim.serviceDate = this.formatDate(segment.elements[1]);
          }
          break;

        case 'SVC':
          // Service line
          if (currentClaim) {
            currentService = {
              procedureCode: this.extractProcedureCode(segment.elements[0]),
              chargedAmount: segment.elements[1],
              paidAmount: segment.elements[2],
              adjustments: []
            };
            currentClaim.services.push(currentService);
          }
          break;

        case 'CAS':
          // Claim/Service Adjustment
          const adjustment: ClaimAdjustment = {
            groupCode: segment.elements[0],
            reasonCode: segment.elements[1],
            amount: segment.elements[2],
            quantity: segment.elements[3]
          };
          
          if (currentService) {
            currentService.adjustments.push(adjustment);
          } else if (currentClaim) {
            currentClaim.adjustments.push(adjustment);
          }
          break;

        case 'REF':
          // Remark codes
          if (currentClaim && segment.elements[0] === 'CAS') {
            currentClaim.remarkCodes.push(segment.elements[1]);
          }
          break;

        case 'PLB':
          // Provider Level Adjustment
          const plb: ProviderAdjustment = {
            date: this.formatDate(segment.elements[1]),
            reasonCode: segment.elements[2],
            amount: segment.elements[3],
            identifier: segment.elements[0]
          };
          summary.providerAdjustments.push(plb);
          break;
      }
    });

    // Add last claim if exists
    if (currentClaim) {
      summary.claims.push(currentClaim);
    }

    return summary;
  }

  private getClaimStatus(code: string): string {
    const statuses: { [key: string]: string } = {
      '1': 'Processed as Primary',
      '2': 'Processed as Secondary',
      '3': 'Processed as Tertiary',
      '4': 'Denied',
      '19': 'Processed as Primary, Forwarded to Additional Payer(s)',
      '20': 'Processed as Secondary, Forwarded to Additional Payer(s)',
      '21': 'Processed as Tertiary, Forwarded to Additional Payer(s)',
      '22': 'Reversal of Previous Payment',
      '23': 'Not Our Claim, Forwarded to Additional Payer(s)'
    };
    return statuses[code] || code;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${month}/${day}/${year}`;
  }

  private extractProcedureCode(composite: string): string {
    // Extract procedure code from composite (e.g., "HC:99213" -> "99213")
    if (composite.includes(':')) {
      return composite.split(':')[1];
    }
    return composite;
  }

  toggleSegments(): void {
    this.showSegments.set(!this.showSegments());
  }

  clearInput(): void {
    this.ediInput.set('');
    this.parsedSegments.set([]);
    this.ediSummary.set(null);
    this.errorMessage.set('');
    this.validationErrors.set([]);
    this.showSegments.set(false);
  }

  loadSampleEDI(): void {
    const sample = `ISA*00*          *00*          *ZZ*SUBMITTERID    *ZZ*RECEIVERID     *241108*1430*U*00401*000000001*0*P*:~
GS*HP*PAYERID*RECEIVERID*20241108*1430*1*X*005010X221A1~
ST*835*0001*005010X221A1~
BPR*I*1500.00*C*ACH*CCP*01*000000000*DA*0000000000*PAYERID***01*000000000*DA*0000000000*20241108~
TRN*1*123456789012*1234567890~
N1*PR*PAYER NAME*XX*PAYERID~
N3*123 MAIN ST~
N4*ANYTOWN*ST*12345~
N1*PE*PROVIDER NAME*XX*1234567890~
N3*123 MAIN ST~
N4*ANYTOWN*ST*12345~
CLP*CLM1731067437976*1*1500.00*1500.00*0.00*MB*1234567890*11*1~
NM1*QC*1*DOE*JOHN****MI*123456789~
NM1*IL*1*DOE*JOHN****MI*123456789~
NM1*74*2*PROVIDER GROUP*****XX*1234567890~
NM1*82*2*BILLING PROVIDER*****XX*9876543210~
SVC*HC:99213*1500.00*1500.00**1~
DTM*472*20241108~
PLB*1234567890*20241108~
SE*19*0001~
GE*1*1~
IEA*1*000000001~`;
    this.ediInput.set(sample);
    this.parseEDI();
  }

  downloadEDI(): void {
    const content = this.ediInput();
    if (!content) {
      return;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `EDI-835-Input-${timestamp}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  downloadParsedData(): void {
    const summary = this.ediSummary();
    if (!summary) {
      return;
    }

    const jsonContent = JSON.stringify(summary, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `EDI-835-Parsed-${timestamp}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  toggleTheme(): void {
    const currentTheme = this.editorTheme();
    const newTheme = currentTheme === 'vs' ? 'vs-dark' : 'vs';
    this.editorTheme.set(newTheme);
    this.editorOptions.set({
      ...this.editorOptions(),
      theme: newTheme
    });
  }

  private updateEditorMarkers(errors: string[]): void {
    if (!this.editorComponent || !this.useMonaco()) {
      return;
    }

    const editor = (this.editorComponent as any)._editor;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Create markers from validation errors
    const markers = errors.map((error, index) => {
      // Try to extract line number from error message if it contains one
      const lineMatch = error.match(/line (\d+)/i);
      const line = lineMatch ? parseInt(lineMatch[1]) : 1;
      
      // Try to find which segment has the error
      const segmentMatch = error.match(/segment (\w+)/i);
      const content = model.getValue();
      const lines = content.split('\n');
      let targetLine = line;
      
      if (segmentMatch && !lineMatch) {
        // Find the line containing this segment
        const segmentId = segmentMatch[1];
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith(segmentId)) {
            targetLine = i + 1;
            break;
          }
        }
      }

      return {
        severity: 8, // Error severity (monaco.MarkerSeverity.Error)
        startLineNumber: targetLine,
        startColumn: 1,
        endLineNumber: targetLine,
        endColumn: lines[targetLine - 1]?.length + 1 || 1000,
        message: error
      };
    });

    // Set markers on the model
    const monaco = (window as any).monaco;
    if (monaco) {
      monaco.editor.setModelMarkers(model, 'edi-validation', markers);
    }
  }

  private clearEditorMarkers(): void {
    if (!this.editorComponent || !this.useMonaco()) {
      return;
    }

    const editor = (this.editorComponent as any)._editor;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const monaco = (window as any).monaco;
    if (monaco) {
      monaco.editor.setModelMarkers(model, 'edi-validation', []);
    }
  }
}
