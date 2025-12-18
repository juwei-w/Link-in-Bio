import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { LinksService, UserProfile } from "../../core/services/links.service";
import { AuthService } from "../../core/services/auth.service";
import { ThemeService } from "../../core/services/theme.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  loading = true;
  error = "";
  isOwner = false;

  constructor(
    private route: ActivatedRoute,
    private linksService: LinksService,
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    const username = this.route.snapshot.paramMap.get("username");
    if (username) {
      this.loadProfile(username);
    } else {
      this.error = "Invalid profile URL";
      this.loading = false;
    }
  }

  loadProfile(username: string) {
    this.linksService.getPublicProfile(username).subscribe({
      next: (profile) => {
        this.profile = profile;
        const currentUser = this.authService.getCurrentUser();
        this.isOwner =
          !!currentUser && currentUser.username === profile.username;
        this.loading = false;

        // Load and apply the user's theme
        this.loadUserTheme(username);
      },
      error: (err) => {
        this.error = err.error?.message || "Profile not found";
        this.loading = false;
      },
    });
  }

  loadUserTheme(username: string) {
    this.themeService.getPublicTheme(username).subscribe({
      next: (theme) => {
        if (theme && theme.themeColors) {
          this.themeService.applyTheme(theme);
        }
      },
      error: (err) => {
        console.log('Failed to load user theme, using default');
      }
    });
  }

  trackClick(linkId: string) {
    // Track click in background
    this.linksService.trackClick(linkId).subscribe();
  }

  goEdit() {
    // navigate to dashboard (where profile settings are)
    this.router.navigate(['/dashboard']);
  }
}
