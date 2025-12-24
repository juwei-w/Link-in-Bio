import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  @ViewChild('featuresSection') featuresSection!: ElementRef;

  constructor(public authService: AuthService) { }

  scrollToFeatures() {
    this.featuresSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  logout() {
    this.authService.logout();
  }
}
