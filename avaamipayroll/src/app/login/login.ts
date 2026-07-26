import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth, signInWithEmailAndPassword, updatePassword } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  errorMessage: string | null = null;
  showResetFields: boolean = false; // Controls which form is visible

  // Form 1: Standard Login
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Form 2: Password Reset (shown for first-time employees)
  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  // Custom validator to ensure passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword');
    const confirm = control.get('confirmPassword');
    return password && confirm && password.value !== confirm.value ? { mismatch: true } : null;
  }

  async onLogin() {
    if (this.loginForm.valid) {
      this.errorMessage = null;
      const email = this.loginForm.value.email!;
      const password = this.loginForm.value.password!;

      try {
        // Step 1: Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        console.log('Firebase login success:', userCredential.user.email);

        // Step 2: Get the Token
        const token = await this.authService.getIdToken();

        // Step 3: Get Role and Initial Login Status from Django
        this.authService.getUserProfile(token).subscribe({
          next: (profile) => {
            console.log('Django Profile Loaded:', profile);

            if (profile.is_initial_login) {
              // Stay on login page but switch to the reset form
              this.showResetFields = true;
            } else {
              // Direct routing based on role
              this.redirectUser(profile.role);
            }
          },
          error: (err) => {
            console.error('Django Profile Error:', err);
            this.errorMessage = 'Account authenticated but profile not found in system.';
          }
        });

      } catch (error: any) {
        console.error('Login Error:', error.code);
        this.handleAuthError(error.code);
      }
    }
  }

  async onResetPassword() {
    if (this.resetForm.invalid) return;

    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error("User session not found.");

      const newPassword = this.resetForm.value.newPassword!;

      // 1. Update Password in Firebase
      await updatePassword(user, newPassword);

      // 2. Sync with Django to flip 'is_initial_login' to False
      const token = await this.authService.getIdToken();
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      this.http.post('http://127.0.0.1:8000/api/reset-password/', 
        { password: newPassword }, 
        { headers }
      ).subscribe({
        next: () => {
          alert("Password secured! Redirecting to your dashboard...");
          this.router.navigate(['/employee-dashboard']);
        },
        error: (err) => {
          console.error("Django Reset Error:", err);
          this.errorMessage = "Failed to sync password update with database.";
        }
      });

    } catch (error: any) {
      this.errorMessage = error.message || "An error occurred during password reset.";
    }
  }

  private redirectUser(role: string) {
    if (role === 'admin') {
      this.router.navigate(['/employees']);
    } else {
      this.router.navigate(['/employee-dashboard']);
    }
  }

  private handleAuthError(code: string) {
    switch (code) {
      case 'auth/invalid-credential':
        this.errorMessage = 'Incorrect email or password.';
        break;
      case 'auth/user-not-found':
        this.errorMessage = 'No account exists with this email.';
        break;
      case 'auth/too-many-requests':
        this.errorMessage = 'Too many attempts. Try again later.';
        break;
      default:
        this.errorMessage = 'Login failed. Please try again.';
    }
  }
}