import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import {
  LinksService,
  UserProfile,
} from "../../../core/services/links.service";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"],
})
export class SettingsComponent implements OnInit {
  profile: Partial<UserProfile> = {};
  loading = false;
  saving = false;
  message = "";
  error = "";

  constructor(
    public authService: AuthService,
    private linksService: LinksService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.linksService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = {
          username: profile.username,
          displayName: profile.displayName || "",
          bio: profile.bio || "",
          avatarUrl: profile.avatarUrl || "",
          theme: profile.theme || "light",
        };
        this.loading = false;
      },
      error: (err) => {
        this.error = "Failed to load profile";
        this.loading = false;
      },
    });
  }

  saveProfile() {
    this.saving = true;
    this.message = "";
    this.error = "";

    this.linksService.updateMyProfile(this.profile).subscribe({
      next: () => {
        this.message = "Profile updated successfully!";
        this.saving = false;
        setTimeout(() => (this.message = ""), 3000);
      },
      error: (err) => {
        this.error = err.error?.message || "Failed to update profile";
        this.saving = false;
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/"]);
  }

  goBack() {
    this.router.navigate(["/dashboard"]);
  }
}
