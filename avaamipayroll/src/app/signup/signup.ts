import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedRole: 'admin' | 'user' = 'admin';
  currentStep = 1;

  signupForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    companyName: [''],
    phone: [''],
    address: [''],
    city: [''],
    state: [''],
    companyCode: ['']
  });

  selectRole(role: 'admin' | 'user') {
    this.selectedRole = role;
    this.currentStep = 1;
    
    if (role === 'admin') {
      this.signupForm.get('companyName')?.setValidators([Validators.required]);
      this.signupForm.get('address')?.setValidators([Validators.required]);
      this.signupForm.get('companyCode')?.clearValidators();
    } else {
      this.signupForm.get('companyCode')?.setValidators([Validators.required]);
      this.signupForm.get('companyName')?.clearValidators();
      this.signupForm.get('address')?.clearValidators();
    }
    this.signupForm.get('companyName')?.updateValueAndValidity();
    this.signupForm.get('companyCode')?.updateValueAndValidity();
    this.signupForm.get('address')?.updateValueAndValidity();
  }

  onRoleChange(event: any) {
    this.selectRole(event.target.value);
  }

  nextStep() { if (this.currentStep < 4) this.currentStep++; }
  prevStep() { if (this.currentStep > 1) this.currentStep--; }

  isStep1Invalid() {
    const f = this.signupForm;
    const basicInfoValid = f.get('username')?.valid && f.get('email')?.valid && f.get('password')?.valid;
    return this.selectedRole === 'user' ? !(basicInfoValid && f.get('companyCode')?.valid) : !basicInfoValid;
  }

// Inside your SignupComponent class
showNoInvitePopup = false; // Controls the dialog

  onSubmit() {
      if (this.signupForm.valid) {
        const val = this.signupForm.value;
        const extraData = {
          role: this.selectedRole,
          companyName: val.companyName || null,
          phone: val.phone || null,
          address: val.address || null,
          city: val.city || null,
          state: val.state || null,
        };

        this.authService.signUp(val.email!, val.password!, val.username!, this.selectedRole, extraData)
          .subscribe({
            next: () => {
              alert('Registration Successful!');
              this.router.navigate(['/home']);
            },
            error: (err: any) => {
              // ONLY trigger the popup if the user is a 'user' (Employee)
              // Admins should see the actual error (e.g., "Company name exists")
              if (err.status === 403 && this.selectedRole === 'user') {
                this.showNoInvitePopup = true;
              } else {
                // Extract the error message from the backend properly
                const errorMessage = err.error?.error || err.message || 'An unknown error occurred';
                alert('Signup Failed: ' + errorMessage);
                console.error('Full Error Object:', err);
              }
            }
          });
      }
    }

  closePopup() {
    this.showNoInvitePopup = false;
  }
}