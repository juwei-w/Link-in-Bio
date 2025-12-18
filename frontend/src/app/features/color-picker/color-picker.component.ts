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
    }
  };

  presetThemes = [
    {
      name: 'Coral Breeze',
      colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#333333' }
    },
    {
      name: 'Ocean Vibes',
      colors: { primary: '#2E86AB', secondary: '#A23B72', background: '#F8F9F9', text: '#1A202C' }
    },
    {
      name: 'Forest Green',
      colors: { primary: '#2D6A4F', secondary: '#52B788', background: '#F1FAEE', text: '#1B4332' }
    },
    {
      name: 'Sunset Gold',
      colors: { primary: '#F77F00', secondary: '#FCBF49', background: '#FFFBF0', text: '#423F34' }
    },
    {
      name: 'Purple Dream',
      colors: { primary: '#7209B7', secondary: '#C72BFF', background: '#F8F7FF', text: '#240046' }
    },
    {
      name: 'Dark Mode',
      colors: { primary: '#00D9FF', secondary: '#00FFA3', background: '#0A0E27', text: '#FFFFFF' }
    },
  ];

  saving = false;
  saveMessage = '';

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.themeService.theme$.subscribe((theme) => {
      this.currentTheme = theme;
    });
  }

  applyPreset(preset: any) {
    this.currentTheme.themeColors = { ...preset.colors };
    this.themeService.applyTheme(this.currentTheme);
  }

  updateColor(key: keyof ThemeColors, value: string) {
    this.currentTheme.themeColors[key] = value;
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
