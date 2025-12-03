import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  @ViewChild('featuresSection') featuresSection!: ElementRef;

  constructor(public authService: AuthService) {
    // Initialize dark mode from localStorage
    this.initDarkMode();
  }

  scrollToFeatures() {
    this.featuresSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  logout() {
    this.authService.logout();
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    // Save preference to localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
  }

  private initDarkMode() {
    // Check localStorage for saved preference
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
      document.body.classList.add('dark-mode');
    } else if (darkMode === null) {
      // If no preference, check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
      }
    }
  }
}
