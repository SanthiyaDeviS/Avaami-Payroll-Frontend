import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../services/employee';
import { AuthService } from '../../auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class EmployeesComponent implements OnInit {
  employees: any[] = [];
  companyName: string = '';

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 1. Get company name from local storage for the UI header
    this.companyName = localStorage.getItem('company_name') || 'Your Company';
    
    // 2. Fetch the latest list from the backend
    this.loadEmployees();
  }

  loadEmployees() {
    this.authService.getIdToken().then(token => {
      if (!token) return;

      this.employeeService.getEmployees(token).subscribe({
        next: (data) => {
          // Map backend data to UI format
          this.employees = data.map(emp => ({
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            role: emp.designation,
            email: emp.email,
            salary: emp.basic_salary,
            status: 'Active'
          }));
        },
        error: (err) => console.error('Error fetching employees:', err)
      });
    });
  }
}