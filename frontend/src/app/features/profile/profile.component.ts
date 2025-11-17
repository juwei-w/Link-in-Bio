import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LinksService, UserProfile } from '../../core/services/links.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private linksService: LinksService
  ) { }

  ngOnInit() {
    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.loadProfile(username);
    } else {
      this.error = 'Invalid profile URL';
      this.loading = false;
    }
  }

  loadProfile(username: string) {
    this.linksService.getPublicProfile(username).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Profile not found';
        this.loading = false;
      }
    });
  }

  trackClick(linkId: string) {
    // Track click in background
    this.linksService.trackClick(linkId).subscribe();
  }
}
