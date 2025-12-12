import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-verify-email",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./verify-email.component.html",
  styleUrls: ["./verify-email.component.css"],
})
export class VerifyEmailComponent implements OnInit {
  loading = false;
  message = "";
  error = "";
  success = false;
  emailFromError = ""; // Track email for error message

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verifyEmail();
  }

  verifyEmail(): void {
    this.loading = true;
    this.message = "Verifying your email...";

    this.route.queryParams.subscribe((params) => {
      const token = params["token"];
      const email = params["email"];

      if (!token || !email) {
        this.error = "Invalid verification link";
        this.emailFromError = email || "";
        this.loading = false;
        return;
      }

      this.emailFromError = email;

      this.authService.verifyEmail(email, token).subscribe(
        (response) => {
          this.loading = false;
          this.success = true;
          this.message = "Email verified successfully!";
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            this.router.navigate(["/dashboard"]);
          }, 2000);
        },
        (error) => {
          this.loading = false;
          this.error =
            error.error?.message || "Failed to verify email. Please try again.";
          this.emailFromError = email;
        }
      );
    });
  }

  resendEmail(): void {
    this.route.queryParams.subscribe((params) => {
      const email = params["email"];
      if (!email) return;

      this.loading = true;
      this.authService.resendVerificationEmail(email).subscribe(
        (response) => {
          this.loading = false;
          this.message = response.message;
          this.error = "";
        },
        (error) => {
          this.loading = false;
          this.error = error.error?.message || "Failed to resend email";
        }
      );
    });
  }
}
