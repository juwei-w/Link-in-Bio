import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface Theme {
  theme: 'light' | 'dark';
  themeColors: ThemeColors;
  vibrancy?: 'subtle' | 'medium' | 'high';
  cardStyle?: 'glass' | 'solid' | 'retro';
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private apiUrl = environment.apiUrl + '/theme';

  private themeSubject = new BehaviorSubject<Theme>({
    theme: 'light',
    themeColors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      background: '#FFFFFF',
      text: '#000000',
    },
    vibrancy: 'subtle',
    cardStyle: 'glass'
  });

  theme$ = this.themeSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTheme();
  }

  loadTheme(): void {
    this.http.get<Theme>(`${this.apiUrl}`).subscribe({
      next: (theme) => {
        this.themeSubject.next(theme);
        this.applyTheme(theme);
      },
      error: () => {
        // Use defaults if not authenticated
        const savedTheme = localStorage.getItem('theme');
        const savedColors = localStorage.getItem('themeColors');
        if (savedTheme && savedColors) {
          const theme: Theme = {
            theme: savedTheme as 'light' | 'dark',
            themeColors: JSON.parse(savedColors)
          };
          this.themeSubject.next(theme);
          this.applyTheme(theme);
        }
      }
    });
  }

  getPublicTheme(username: string): Observable<Theme> {
    return this.http.get<Theme>(`${this.apiUrl}/public/${username}`);
  }

  updateTheme(theme: Partial<Theme>): Observable<any> {
    return this.http.put<Theme>(`${this.apiUrl}`, theme).pipe(
      tap((response) => {
        this.themeSubject.next(response);
        this.applyTheme(response);
        localStorage.setItem('theme', response.theme);
        localStorage.setItem('themeColors', JSON.stringify(response.themeColors));
      })
    );
  }

  applyTheme(theme: Theme): void {
    const root = document.documentElement;
    const colors = theme.themeColors;

    // Set CSS variables
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--bg-color', colors.background);
    root.style.setProperty('--text-color', colors.text);

    // Apply Vibrancy
    let vibrancyLevel = '5%'; // Default subtle
    if (theme.vibrancy === 'medium') vibrancyLevel = '15%';
    if (theme.vibrancy === 'high') vibrancyLevel = '30%';
    root.style.setProperty('--theme-intensity', vibrancyLevel);

    // Apply Card Style
    root.setAttribute('data-card-style', theme.cardStyle || 'glass');

    // Toggle Dark Mode Class
    if (theme.theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  get currentThemeValue(): Theme {
    return this.themeSubject.value;
  }

  toggleTheme(): void {
    const current = this.currentThemeValue;
    const newTheme = current.theme === 'dark' ? 'light' : 'dark';

    // 1. Optimistic Update: Update local state immediately
    const optimisticUpdate: Theme = {
      ...current,
      theme: newTheme
    };

    this.themeSubject.next(optimisticUpdate);
    this.applyTheme(optimisticUpdate);
    localStorage.setItem('theme', newTheme);
    
    // 2. Persist to backend (fire and forget / validation)
    // If this fails (e.g. 401 unauthenticated), the local change remains valid for the session.
    this.updateTheme({ theme: newTheme }).subscribe({
      next: (serverTheme) => {
        // Optional: Re-sync with server response if it returns different data (e.g. specific colors)
        // The updateTheme tap() already handles updating the subject/storage if successful.
      },
      error: (err) => {
        // Silently fail for auth errors, effectively allowing "guest" theme toggling
        console.debug('Theme save failed (likely guest/offline)', err);
      }
    });
  }
}
