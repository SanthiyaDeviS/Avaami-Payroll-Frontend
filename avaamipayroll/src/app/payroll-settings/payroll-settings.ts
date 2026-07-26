import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-payroll-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payroll-settings.html',
  styleUrl: './payroll-settings.css',
})
export class PayrollSettings implements OnInit {
  settingsForm!: FormGroup;
  isSaving = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      pf_employee_percent: [12, [Validators.required, Validators.min(0), Validators.max(100)]],
      pf_employer_percent: [12, [Validators.required, Validators.min(0), Validators.max(100)]],
      tax_percent: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
      hra_percent: [40, [Validators.required, Validators.min(0), Validators.max(100)]],
      special_allowance_default: [5000, [Validators.required, Validators.min(0)]]
    });
  }

  saveSettings() {
    if (this.settingsForm.valid) {
      this.isSaving = true;
      console.log('Saving Payroll Rules:', this.settingsForm.value);
      
      // TODO: Connect to your Django backend API here
      setTimeout(() => {
        this.isSaving = false;
        alert('Payroll configuration updated successfully!');
      }, 1000);
    }
  }
}