import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-forgot",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./forgot.component.html",
  styleUrls: ["./forgot.component.css"],
})
export class ForgotComponent {
  email = "";
  message = "";
  loading = false;

  constructor(private auth: AuthService) {}

  async submit() {
    this.loading = true;
    this.message = "";
    try {
      await this.auth.forgotPassword(this.email);
      this.message = "If an account exists, a reset email has been sent.";
    } catch (err: any) {
      this.message = "Failed to send reset email.";
    } finally {
      this.loading = false;
    }
  }
}
