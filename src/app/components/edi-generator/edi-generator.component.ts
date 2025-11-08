import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { EdiGeneratorService } from '../../services/edi-generator.service';

@Component({
  selector: 'app-edi-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edi-generator.component.html',
  styleUrl: './edi-generator.component.scss',
})
export class EdiGeneratorComponent implements OnInit, OnDestroy {
  isSubmitted = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  ediContent = signal<string>('');
  copySuccess = signal<boolean>(false);
  ediFormGroup: FormGroup;

  // Collapse/Expand state management
  sectionsExpanded: { [key: string]: boolean } = {
    transaction: true,
    payer: true,
    patient: true,
    provider: true,
  };
  claimsExpanded: { [key: number]: boolean } = {};
  serviceLinesExpanded: { [key: string]: boolean } = {};
  adjustmentsExpanded: { [key: string]: boolean } = {};

  constructor(
    private fb: FormBuilder,
    private ediGeneratorService: EdiGeneratorService
  ) {
    this.ediFormGroup = this.buildEdiForm();
    this.sectionsExpanded = {
      transaction: false,
    };
  }

  toggleSection(section: string): void {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
  }

  toggleClaim(claimIndex: number): void {
    this.claimsExpanded[claimIndex] = !this.claimsExpanded[claimIndex];
  }

  toggleServiceLine(claimIndex: number, serviceIndex: number): void {
    const key = `claim-${claimIndex}-service-${serviceIndex}`;
    this.serviceLinesExpanded[key] = !this.serviceLinesExpanded[key];
  }

  toggleAdjustments(claimIndex: number, serviceIndex: number): void {
    const key = `claim-${claimIndex}-service-${serviceIndex}-adj`;
    this.adjustmentsExpanded[key] = !this.adjustmentsExpanded[key];
  }

  isSectionExpanded(section: string): boolean {
    return this.sectionsExpanded[section] !== false;
  }

  isClaimExpanded(claimIndex: number): boolean {
    return this.claimsExpanded[claimIndex] !== false;
  }

  isServiceLineExpanded(claimIndex: number, serviceIndex: number): boolean {
    const key = `claim-${claimIndex}-service-${serviceIndex}`;
    return this.serviceLinesExpanded[key] !== false;
  }

  isAdjustmentsExpanded(claimIndex: number, serviceIndex: number): boolean {
    const key = `claim-${claimIndex}-service-${serviceIndex}-adj`;
    return this.adjustmentsExpanded[key] !== false;
  }

  generateEDI(): void {
    this.isSubmitted.set(true);
    if (this.ediFormGroup.invalid) {
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      const formData = this.ediFormGroup.value;
      const ediOutput = this.ediGeneratorService.generate835(formData);
      this.ediContent.set(ediOutput);
      this.isLoading.set(false);
    }, 500);
  }

  copyToClipboard(): void {
    const content = this.ediContent();
    if (content) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          this.copySuccess.set(true);
          setTimeout(() => {
            this.copySuccess.set(false);
          }, 2000);
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
        });
    }
  }

  clearPreview(): void {
    this.ediContent.set('');
    this.copySuccess.set(false);
  }

  resetForm(): void {
    this.ediFormGroup.reset({
      transactionType: '837',
      delimiter: '*~',
    });

    const claimsArray = this.claims;
    while (claimsArray.length > 0) {
      claimsArray.removeAt(0);
    }
    claimsArray.push(this.buildClaim());

    const plbAdjustments = this.plbAdjustments;
    while (plbAdjustments.length > 0) {
      plbAdjustments.removeAt(0);
    }
    plbAdjustments.push(this.buildAdjustment());

    this.isSubmitted.set(false);
    this.ediContent.set('');
    this.copySuccess.set(false);

    this.claimsExpanded = {};
    this.serviceLinesExpanded = {};
    this.adjustmentsExpanded = {};
  }

  generateEdiPreview(): void {
    console.log(this.ediFormGroup.value);
  }

  private buildEdiForm(): FormGroup {
    return this.fb.group({
      transactionType: this.fb.control('835'),
      delimiter: this.fb.control('*~'),

      insurance: this.buildInsurance(),
      provider: this.buildProvider(),
      patient: this.buildPatient(),

      claims: this.fb.array([this.buildClaim()]),
      plb: this.buildPlb(),
    });
  }

  private buildInsurance() {
    return this.fb.group({
      payerId: [''],
      planName: [''],
    });
  }

  private buildProvider() {
    return this.fb.group({
      npi: [''],
      name: [''],
      address: [''],
      city: [''],
      state: [''],
      zip: [''],
    });
  }

  private buildPatient() {
    return this.fb.group({
      firstName: [''],
      lastName: [''],
      middleName: [''],
      dob: [''],
    });
  }

  private buildClaim() {
    return this.fb.group({
      claimNumber: [''],
      totalCharge: [''],
      payment: [0],
      adjustment: [0],
      serviceDate: [''],
      claimStatus: ['1'],
      serviceLines: this.fb.array([this.buildServiceLine()]),
    });
  }

  private buildPlb() {
    return this.fb.group({
      providerId: [''],
      adjustments: this.fb.array([this.buildAdjustment()]),
    });
  }

  private buildServiceLine() {
    return this.fb.group({
      procedureCode: [''],
      diagnosisCode: [''],
      chargeAmount: [''],
      units: ['1'],
      paidAmount: [0],
      adjustmentAmount: [0],
      serviceDate: [''],
      claimAdjustments: this.fb.array([this.buildAdjustment()]),
    });
  }

  private buildAdjustment() {
    return this.fb.group({
      adjustmentCode: [''],
      adjustmentAmount: [0],
    });
  }

  get claims(): FormArray {
    return this.ediFormGroup.get('claims') as FormArray;
  }

  get plbAdjustments(): FormArray {
    return this.ediFormGroup.get('plb.adjustments') as FormArray;
  }

  getServiceLines(claimIndex: number): FormArray {
    return this.claims.at(claimIndex).get('serviceLines') as FormArray;
  }

  getAdjustments(claimIndex: number, serviceIndex: number): FormArray {
    const serviceLines = this.getServiceLines(claimIndex);
    return serviceLines.at(serviceIndex).get('claimAdjustments') as FormArray;
  }

  addClaim(): void {
    this.claims.push(this.buildClaim());
  }

  removeClaim(index: number): void {
    if (this.claims.length > 1) {
      this.claims.removeAt(index);
    }
  }

  duplicateClaim(index: number): void {
    const claimToDuplicate = this.claims.at(index);
    const duplicatedClaim = this.fb.group({
      claimNumber: [claimToDuplicate.get('claimNumber')?.value],
      totalCharge: [claimToDuplicate.get('totalCharge')?.value],
      payment: [claimToDuplicate.get('payment')?.value],
      adjustment: [claimToDuplicate.get('adjustment')?.value],
      serviceDate: [claimToDuplicate.get('serviceDate')?.value],
      claimStatus: [claimToDuplicate.get('claimStatus')?.value],
      serviceLines: this.fb.array([]),
    });

    const originalServiceLines = claimToDuplicate.get(
      'serviceLines'
    ) as FormArray;
    const newServiceLines = duplicatedClaim.get('serviceLines') as FormArray;
    originalServiceLines.controls.forEach((serviceLine) => {
      const duplicatedServiceLine = this.fb.group({
        procedureCode: [serviceLine.get('procedureCode')?.value],
        diagnosisCode: [serviceLine.get('diagnosisCode')?.value],
        chargeAmount: [serviceLine.get('chargeAmount')?.value],
        units: [serviceLine.get('units')?.value],
        paidAmount: [serviceLine.get('paidAmount')?.value],
        adjustmentAmount: [serviceLine.get('adjustmentAmount')?.value],
        serviceDate: [serviceLine.get('serviceDate')?.value],
        claimAdjustments: this.fb.array([]),
      });

      const originalAdjustments = serviceLine.get(
        'claimAdjustments'
      ) as FormArray;
      const newAdjustments = duplicatedServiceLine.get(
        'claimAdjustments'
      ) as FormArray;
      originalAdjustments.controls.forEach((adj) => {
        newAdjustments.push(
          this.fb.group({
            adjustmentCode: [adj.get('adjustmentCode')?.value],
            adjustmentAmount: [adj.get('adjustmentAmount')?.value],
          })
        );
      });

      newServiceLines.push(duplicatedServiceLine);
    });

    this.claims.insert(index + 1, duplicatedClaim);
  }

  addServiceLine(claimIndex: number): void {
    const serviceLines = this.getServiceLines(claimIndex);
    serviceLines.push(this.buildServiceLine());
  }

  removeServiceLine(claimIndex: number, serviceIndex: number): void {
    const serviceLines = this.getServiceLines(claimIndex);
    serviceLines.removeAt(serviceIndex);
  }

  duplicateServiceLine(claimIndex: number, serviceIndex: number): void {
    const serviceLines = this.getServiceLines(claimIndex);
    const serviceLineToDuplicate = serviceLines.at(serviceIndex);

    const duplicatedServiceLine = this.fb.group({
      procedureCode: [serviceLineToDuplicate.get('procedureCode')?.value],
      diagnosisCode: [serviceLineToDuplicate.get('diagnosisCode')?.value],
      chargeAmount: [serviceLineToDuplicate.get('chargeAmount')?.value],
      units: [serviceLineToDuplicate.get('units')?.value],
      paidAmount: [serviceLineToDuplicate.get('paidAmount')?.value],
      adjustmentAmount: [serviceLineToDuplicate.get('adjustmentAmount')?.value],
      serviceDate: [serviceLineToDuplicate.get('serviceDate')?.value],
      claimAdjustments: this.fb.array([]),
    });

    const originalAdjustments = serviceLineToDuplicate.get(
      'claimAdjustments'
    ) as FormArray;
    const newAdjustments = duplicatedServiceLine.get(
      'claimAdjustments'
    ) as FormArray;
    originalAdjustments.controls.forEach((adj) => {
      newAdjustments.push(
        this.fb.group({
          adjustmentCode: [adj.get('adjustmentCode')?.value],
          adjustmentAmount: [adj.get('adjustmentAmount')?.value],
        })
      );
    });

    serviceLines.insert(serviceIndex + 1, duplicatedServiceLine);
  }

  addAdjustment(claimIndex: number, serviceIndex: number): void {
    const adjArray = this.getAdjustments(claimIndex, serviceIndex);
    adjArray.push(this.buildAdjustment());
  }

  removeAdjustment(
    claimIndex: number,
    serviceIndex: number,
    adjIndex: number
  ): void {
    const adjArray = this.getAdjustments(claimIndex, serviceIndex);
    adjArray.removeAt(adjIndex);
  }

  duplicateAdjustment(
    claimIndex: number,
    serviceIndex: number,
    adjIndex: number
  ): void {
    const adjArray = this.getAdjustments(claimIndex, serviceIndex);
    const adjustmentToDuplicate = adjArray.at(adjIndex);

    const duplicatedAdjustment = this.fb.group({
      adjustmentCode: [adjustmentToDuplicate.get('adjustmentCode')?.value],
      adjustmentAmount: [adjustmentToDuplicate.get('adjustmentAmount')?.value],
    });

    adjArray.insert(adjIndex + 1, duplicatedAdjustment);
  }

  addPlbAdjustment(): void {
    this.plbAdjustments.push(this.buildAdjustment());
  }

  removePlbAdjustment(index: number): void {
    this.plbAdjustments.removeAt(index);
  }

  ngOnInit() {}

  ngOnDestroy() {}
}
