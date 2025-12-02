import { Component } from "@angular/core";
import { ActivatedRoute, RouterLink, Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-reset",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./reset.component.html",
  styleUrls: ["./reset.component.css"],
})
export class ResetComponent {
  email = "";
  token = "";
  password = "";
  showPassword = false;
  message = "";
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {
    this.route.queryParams.subscribe((params) => {
      this.email = params["email"] || "";
      this.token = params["token"] || "";
    });
  }

  async submit() {
    this.loading = true;
    this.message = "";
    try {
      const res = await this.auth.resetPassword(
        this.email,
        this.token,
        this.password
      );
      // on success, do NOT auto-login — redirect user to the login page
      if (res) {
        this.message = "Password updated. Redirecting to login...";
        // clear sensitive fields
        this.password = "";
        // navigate to login page
        this.router.navigate(["/login"]);
      }
    } catch (err: any) {
      this.message = err.error?.message || "Reset failed";
    } finally {
      this.loading = false;
    }
  }
}
