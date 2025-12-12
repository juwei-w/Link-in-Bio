import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent {
  isSignUp = false; // Toggle between sign in and sign up
  username = "";
  email = "";
  password = "";
  showPassword = false;
  loading = false;
  error = "";
  successMessage = ""; // New: show success message after signup
  emailNotVerifiedEmail = ""; // Track email that needs verification

  constructor(private authService: AuthService, private router: Router) {}

  async onSubmit() {
    this.loading = true;
    this.error = "";
    this.successMessage = "";
    this.emailNotVerifiedEmail = "";

    try {
      if (this.isSignUp) {
        // Sign up
        this.authService
          .signup(this.username, this.email, this.password)
          .subscribe({
            next: (response) => {
              // Don't auto-login; show message to verify email
              this.successMessage =
                "Signup successful! We've sent a verification email. Please verify your email to continue.";
              // Store email for verification prompt
              this.emailNotVerifiedEmail = this.email;
              // Clear form
              this.username = "";
              this.email = "";
              this.password = "";
              this.loading = false;
            },
            error: (err) => {
              this.error = err.error?.message || "Sign up failed";
              this.loading = false;
            },
          });
      } else {
        // Sign in
        this.authService.login(this.email, this.password).subscribe({
          next: () => {
            this.router.navigate(["/dashboard"]);
          },
          error: (err) => {
            // Check if error is due to unverified email
            if (err.error?.code === "EMAIL_NOT_VERIFIED") {
              this.error = "";
              this.emailNotVerifiedEmail = this.email;
            } else {
              this.error = err.error?.message || "Login failed";
            }
            this.loading = false;
          },
        });
      }
    } catch (err: any) {
      this.error =
        err.message || (this.isSignUp ? "Sign up failed" : "Login failed");
      this.loading = false;
    }
  }

  async googleLogin() {
    try {
      this.loading = true;
      this.error = "";
      this.successMessage = "";
      this.emailNotVerifiedEmail = "";
      const response = await this.authService.googleLogin();

      // If new user, show verification prompt instead of auto-login
      if (response?.isNewUser) {
        this.successMessage =
          "Google signup successful! We've sent a verification email. Please verify your email to log in.";
        this.emailNotVerifiedEmail = response?.user?.email || "";
        this.loading = false;
      } else {
        // Existing user - auto-redirect to dashboard
        this.router.navigate(["/dashboard"]);
      }
    } catch (err: any) {
      this.error = err.message || "Google login failed";
      this.loading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  resendVerificationEmail(): void {
    if (!this.emailNotVerifiedEmail) return;
    this.loading = true;
    this.authService
      .resendVerificationEmail(this.emailNotVerifiedEmail)
      .subscribe(
        (response) => {
          this.loading = false;
          this.error = "Verification email resent! Check your inbox.";
          this.emailNotVerifiedEmail = "";
        },
        (error) => {
          this.loading = false;
          this.error =
            error.error?.message || "Failed to resend verification email";
        }
      );
  }
}
