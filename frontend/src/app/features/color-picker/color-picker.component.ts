import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, Theme, ThemeColors } from '../../core/services/theme.service';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css']
})
export class ColorPickerComponent implements OnInit {
  @Output() closeEditor = new EventEmitter<void>();

  currentTheme: Theme = {
    theme: 'light',
    themeColors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      background: '#FFFFFF',
      text: '#000000',
    },
    vibrancy: 'subtle',
    cardStyle: 'glass'
  };

  initialColors: ThemeColors = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    background: '#FFFFFF',
    text: '#000000',
  };
  vibrancy: 'subtle' | 'medium' | 'high' = 'subtle';
  cardStyle: 'glass' | 'solid' | 'gradient' = 'glass';

  presets: { name: string; colors: ThemeColors; theme: 'light' | 'dark' }[] = [
    {
      name: 'Sunset Blaze',
      colors: { primary: '#FF5F45', secondary: '#FF59A1', background: '#FFF5F5', text: '#2D3436' },
      theme: 'light'
    },
    {
      name: 'Coral Breeze',
      colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#333333' },
      theme: 'light'
    },
    {
      name: 'Ocean Vibes',
      colors: { primary: '#2E86AB', secondary: '#A23B72', background: '#F8F9F9', text: '#1A202C' },
      theme: 'light'
    },
    {
      name: 'Forest Green',
      colors: { primary: '#2D6A4F', secondary: '#52B788', background: '#F1FAEE', text: '#1B4332' },
      theme: 'light'
    },
    {
      name: 'Sunset Gold',
      colors: { primary: '#F77F00', secondary: '#FCBF49', background: '#FFFBF0', text: '#423F34' },
      theme: 'light'
    },
    {
      name: 'Purple Dream',
      colors: { primary: '#7209B7', secondary: '#C72BFF', background: '#F8F7FF', text: '#240046' },
      theme: 'light'
    },
    {
      name: 'Midnight Neo',
      colors: { primary: '#6C5CE7', secondary: '#A29BFE', background: '#2D3436', text: '#DFE6E9' },
      theme: 'dark'
    },
    {
      name: 'Cherry Blossom',
      colors: { primary: '#FF7675', secondary: '#E84393', background: '#FFF5F5', text: '#2D3436' },
      theme: 'light'
    },
    {
      name: 'Cyber Lime',
      colors: { primary: '#00B894', secondary: '#55EFC4', background: '#1E272E', text: '#F1F2F6' },
      theme: 'dark'
    },
    {
      name: 'Slate Minimal',
      colors: { primary: '#607D8B', secondary: '#90A4AE', background: '#ECEFF1', text: '#263238' },
      theme: 'light'
    },
    {
      name: 'Mint Breeze',
      colors: { primary: '#00B894', secondary: '#81ECEC', background: '#F0FFF4', text: '#2D3436' },
      theme: 'light'
    },
    {
      name: 'Royal Velvet',
      colors: { primary: '#FFD700', secondary: '#FFA500', background: '#2C003E', text: '#F8F9FA' },
      theme: 'dark'
    },
  ];

  saving = false;
  saveMessage = '';

  constructor(private themeService: ThemeService) { }

  ngOnInit() {
    this.themeService.theme$.subscribe(theme => {
      this.currentTheme = { ...theme };
      this.initialColors = { ...theme.themeColors };
      this.vibrancy = theme.vibrancy || 'subtle';
      this.cardStyle = theme.cardStyle || 'glass';
    });
  }

  applyPreset(preset: any) {
    this.currentTheme.themeColors = { ...preset.colors };
    this.currentTheme.theme = preset.theme; // Apply theme mode (light/dark)
    this.themeService.applyTheme(this.currentTheme);
  }

  updateColor(key: keyof ThemeColors, event: Event) {
    const input = event.target as HTMLInputElement;
    this.currentTheme.themeColors[key] = input.value;
    this.themeService.applyTheme(this.currentTheme);
  }

  updateVibrancy(level: 'subtle' | 'medium' | 'high') {
    this.vibrancy = level;
    this.currentTheme.vibrancy = level;
    this.themeService.applyTheme(this.currentTheme);
  }

  updateCardStyle(style: 'glass' | 'solid' | 'gradient') {
    this.cardStyle = style;
    this.currentTheme.cardStyle = style;
    this.themeService.applyTheme(this.currentTheme);
  }

  saveTheme() {
    this.saving = true;
    this.saveMessage = '';

    this.themeService.updateTheme(this.currentTheme).subscribe({
      next: () => {
        this.saving = false;
        this.saveMessage = 'Theme saved successfully!';
        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.saving = false;
        this.saveMessage = 'Failed to save theme. Please try again.';
        console.error('Theme save error:', err);
      }
    });
  }

  resetTheme() {
    this.currentTheme = {
      theme: 'light',
      themeColors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        background: '#FFFFFF',
        text: '#000000',
      }
    };
    this.themeService.applyTheme(this.currentTheme);
    this.saveMessage = '';
  }

  close() {
    this.closeEditor.emit();
  }
}
