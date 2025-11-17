import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    this.loading = true;
    this.error = '';

    try {
      this.authService.signup(this.username, this.email, this.password).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Signup failed';
          this.loading = false;
        }
      });
    } catch (err: any) {
      this.error = err.message || 'Signup failed';
      this.loading = false;
    }
  }

  async googleSignup() {
    try {
      await this.authService.googleLogin();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error = err.message || 'Google signup failed';
    }
  }

  async githubSignup() {
    try {
      await this.authService.githubLogin();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error = err.message || 'GitHub signup failed';
    }
  }
}
