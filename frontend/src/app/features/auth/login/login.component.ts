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

  // Real-time validation feedback
  usernameError = "";
  usernameAvailable: boolean | null = null;
  emailError = "";
  emailAvailable: boolean | null = null;
  checkingUsername = false;
  checkingEmail = false;
  private usernameCheckTimeout: any = null;
  private emailCheckTimeout: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  // Check username availability (with debounce)
  onUsernameChange() {
    this.usernameError = "";
    this.usernameAvailable = null;

    if (this.usernameCheckTimeout) {
      clearTimeout(this.usernameCheckTimeout);
    }

    const username = this.username.trim();
    if (!username) return;

    this.checkingUsername = true;
    this.usernameCheckTimeout = setTimeout(() => {
      this.authService.checkUsernameAvailability(username).subscribe({
        next: (res) => {
          this.usernameAvailable = res.available;
          this.usernameError = res.available ? "" : res.message;
          this.checkingUsername = false;
        },
        error: (err) => {
          this.usernameError = "Could not check username availability";
          this.checkingUsername = false;
        },
      });
    }, 500); // 500ms debounce
  }

  // Check email availability (with debounce)
  onEmailChange() {
    this.emailError = "";
    this.emailAvailable = null;

    if (this.emailCheckTimeout) {
      clearTimeout(this.emailCheckTimeout);
    }

    const email = this.email.trim();
    if (!email) return;

    this.checkingEmail = true;
    this.emailCheckTimeout = setTimeout(() => {
      this.authService.checkEmailAvailability(email).subscribe({
        next: (res) => {
          this.emailAvailable = res.available;
          this.emailError = res.available ? "" : res.message;
          this.checkingEmail = false;
        },
        error: (err) => {
          this.emailError = "Could not check email availability";
          this.checkingEmail = false;
        },
      });
    }, 500); // 500ms debounce
  }

  async onSubmit() {
    this.loading = true;
    this.error = "";
    this.successMessage = "";
    this.emailNotVerifiedEmail = "";

    try {
      if (this.isSignUp) {
        // Validate username and email availability before signup
        if (!this.usernameAvailable) {
          this.error = this.usernameError || "Username is not available";
          this.loading = false;
          return;
        }
        if (!this.emailAvailable) {
          this.error = this.emailError || "Email is not available";
          this.loading = false;
          return;
        }

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
              this.usernameAvailable = null;
              this.emailAvailable = null;
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
