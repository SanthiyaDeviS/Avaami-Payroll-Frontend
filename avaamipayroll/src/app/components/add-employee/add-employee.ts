import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee';
import { AuthService } from '../../../auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-employee.html',
  styleUrls: ['./add-employee.css']
})
export class AddEmployeeComponent implements OnInit {
  showSuccessPopup = false;
  employeeForm!: FormGroup; // Use ! to tell TS it will be initialized

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initializing the form with the payroll fields your mentor requested
    this.employeeForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      designation: ['', Validators.required],
      joining_date: ['', Validators.required],
      
      // --- PAYROLL CALCULATION FIELDS ---
      // These must match the formControlName in your HTML exactly
      basic_salary: [0, [Validators.required, Validators.min(1)]], // Min 1 to avoid 0 calculations
      special_allowance: [0, [Validators.min(0)]]
    });
  }

  async onSubmit() {
    if (this.employeeForm.valid) {
      try {
        // 1. Fetching the Firebase Token to authenticate with your Django backend
        const token = await this.authService.getIdToken();
        
        if (!token) {
          alert('Session expired. Please login again.');
          return;
        }

        // 2. Prepare the data payload
        const payload = this.employeeForm.value;
        console.log('Sending Employee Data:', payload);

        // 3. Sending the entire form value to the backend
        this.employeeService.addEmployee(payload, token).subscribe({
          next: (response) => {
            console.log('Backend response:', response);
            this.showSuccessPopup = true; 
            // Reset form but keep default numeric values
            this.employeeForm.reset({
              basic_salary: 0,
              special_allowance: 0
            });
          },
          error: (error) => {
            console.error('Error adding employee:', error);
            const errorMsg = error.error?.error || 'Failed to add employee. Please check your connection.';
            alert(errorMsg);
          }
        });
      } catch (err) {
        console.error('Authentication Error:', err);
        alert('Could not verify your identity. Please login again.');
      }
    } else {
      // Mark all fields as touched to show validation errors if the form is invalid
      this.employeeForm.markAllAsTouched();
    }
  }

  closePopup() {
    this.showSuccessPopup = false;
    // Navigating back to the list so the table refreshes with the new employee
    this.router.navigate(['/employees']); 
  }
}