import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../services/employee';
import { AuthService } from '../../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payroll.html',
  styleUrl: './payroll.css',
})
export class PayrollComponent implements OnInit {
  currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  employees: any[] = [];
  
  // These keys must match the keys returned by your Django PayrollConfigurationView.get()
  payrollConfig = {
    hra_percent: 40,
    pf_percent: 12,
    tax_percent: 5,
    special_allowance: 0
  };

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private http: HttpClient 
  ) {}

  ngOnInit(): void {
    this.loadPayrollData();
  }

  async loadPayrollData() {
    const token = await this.authService.getIdToken();
    if (!token) {
      console.error("No token found. Redirecting to login?");
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // 1. Fetch Global Settings for the logged-in Admin's company
    this.http.get<any>('http://localhost:8000/api/payroll-settings/', { headers })
      .subscribe({
        next: (settings) => {
          console.log("Settings loaded:", settings);
          // Standardize keys from backend
          this.payrollConfig = {
            hra_percent: Number(settings.hra_percent) || 40,
            pf_percent: Number(settings.pf_percent) || 12,
            tax_percent: Number(settings.tax_percent) || 5,
            special_allowance: Number(settings.special_allowance) || 0
          };
          this.fetchEmployees(token);
        },
        error: (err) => {
          console.warn('Backend settings failed, using defaults.', err);
          this.fetchEmployees(token); 
        }
      });
  }

  // Add this method to your PayrollComponent class
  async downloadPayslip(employeeId: number) {
    const token = await this.authService.getIdToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // We use 'blob' as the response type because a PDF is a file, not text/JSON
    this.http.get(`http://localhost:8000/api/download-payslip/${employeeId}/`, {
      headers,
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Payslip_Emp_${employeeId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => alert("Could not generate PDF. Please try again.")
    });
  }

  fetchEmployees(token: string) {
    this.employeeService.getEmployees(token).subscribe({
      next: (data) => {
        console.log("Raw Employee Data from Backend:", data);
        
        // 2. Map and calculate
        this.employees = data.map((emp: any) => {
          // Important: Ensure basic_salary exists on the emp object
          const basic = Number(emp.basic_salary) || 0;
          
          // Use values from this.payrollConfig (synced from Django)
          const hra = basic * (this.payrollConfig.hra_percent / 100);
          const pf = basic * (this.payrollConfig.pf_percent / 100);
          const tax = basic * (this.payrollConfig.tax_percent / 100);
          
          // Use individual allowance if it exists, otherwise use company default
          const special = Number(emp.special_allowance) || Number(this.payrollConfig.special_allowance) || 0;
          
          return {
            ...emp,
            // Re-mapping names to match your payroll.html expectations
            first_name: emp.first_name,
            last_name: emp.last_name,
            designation: emp.designation,
            calc_hra: hra,
            calc_pf: pf,
            calc_tax: tax,
            calc_net: (basic + hra + special) - (pf + tax)
          };
        });
      },
      error: (err) => console.error('Could not fetch payroll list:', err)
    });
  }
}