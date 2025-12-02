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
  email = "";
  password = "";
  showPassword = false;
  loading = false;
  error = "";

  constructor(private authService: AuthService, private router: Router) {}

  async onSubmit() {
    this.loading = true;
    this.error = "";

    try {
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          this.router.navigate(["/dashboard"]);
        },
        error: (err) => {
          this.error = err.error?.message || "Login failed";
          this.loading = false;
        },
      });
    } catch (err: any) {
      this.error = err.message || "Login failed";
      this.loading = false;
    }
  }

  async googleLogin() {
    try {
      await this.authService.googleLogin();
      this.router.navigate(["/dashboard"]);
    } catch (err: any) {
      this.error = err.message || "Google login failed";
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
