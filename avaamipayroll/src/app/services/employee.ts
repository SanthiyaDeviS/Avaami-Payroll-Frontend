import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://127.0.0.1:8000/api/employees/';
  private settingsUrl = 'http://127.0.0.1:8000/api/payroll-settings/'; // New URL

  constructor(private http: HttpClient) {}

  private getHeaders(token: string) {
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getEmployees(token: string): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders(token) });
  }

  addEmployee(employeeData: any, token: string): Observable<any> {
    return this.http.post(this.apiUrl, employeeData, { headers: this.getHeaders(token) });
  }

  // --- NEW: Payroll Settings Methods ---
  getPayrollSettings(token: string): Observable<any> {
    return this.http.get<any>(this.settingsUrl, { headers: this.getHeaders(token) });
  }

  updatePayrollSettings(settingsData: any, token: string): Observable<any> {
    return this.http.post(this.settingsUrl, settingsData, { headers: this.getHeaders(token) });
  }
}