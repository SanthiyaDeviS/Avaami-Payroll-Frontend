import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup';
import { LoginComponent } from './login/login';
import { LayoutComponent } from './layout/layout';
import { HomeComponent } from './home/home';
import {EmployeesComponent } from './employee/employee';
import {PayrollComponent} from './payroll/payroll';
import { AddEmployeeComponent } from './components/add-employee/add-employee';
import { PayrollSettings } from './payroll-settings/payroll-settings';

export const routes: Routes = [
  // 1. Auth Routes (Full screen, no sidebar)
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },

  // 2. Dashboard Routes (Inside the Layout with Sidebar)
  { 
    path: '', 
    component: LayoutComponent, 
    children: [
      { path: '**', redirectTo: 'login' },
      { path: 'home', component: HomeComponent },
      { path: 'employees', component: EmployeesComponent },
      { path: 'payroll', component: PayrollComponent},
      { path: 'add-employee', component: AddEmployeeComponent},
      { path: 'payroll-settings', component: PayrollSettings },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];