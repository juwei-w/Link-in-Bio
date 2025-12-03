import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LinksService, Link } from '../../core/services/links.service';
import { AuthService } from '../../core/services/auth.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface AnalyticsSummary {
  totalClicks: number;
  totalLinks: number;
  avgClicksPerLink: number;
  mostClickedLink: Link | null;
  ctrPercent: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  links: Link[] = [];
  loading = true;
  currentUser: any = null;
  username: string = '';
  summary: AnalyticsSummary = {
    totalClicks: 0,
    totalLinks: 0,
    avgClicksPerLink: 0,
    mostClickedLink: null,
    ctrPercent: 0
  };

  // Overview data
  overview: any = null;
  profileViewsTotal: number = 0;
  days = 30;
  dateRanges = [7, 14, 30, 60, 90];

  // Chart references
  @ViewChild('timeSeriesCanvas') timeSeriesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('devicesCanvas') devicesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('platformsCanvas') platformsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('hourlyCanvas') hourlyCanvas?: ElementRef<HTMLCanvasElement>;

  private timeSeriesChart?: Chart;
  private devicesChart?: Chart;
  private platformsChart?: Chart;
  private hourlyChart?: Chart;

  constructor(private linksService: LinksService, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.username = this.currentUser?.username || '';
    this.loadAnalytics();
  }

  ngAfterViewInit() {
    // Charts will be rendered after data loads
  }

  onDaysChange() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading = true;
    // Fetch links, overview, and profile
    this.linksService.getMyLinks().subscribe({
      next: (links) => {
        this.links = links.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        this.linksService.getAnalyticsOverview(this.days).subscribe({
          next: (ov) => {
            this.overview = ov;
            this.authService.getProfile().subscribe({
              next: (profile) => {
                this.profileViewsTotal = (profile as any).totalProfileViews || 0;
                this.calculateSummary();
                this.loading = false;
                setTimeout(() => this.renderCharts(), 100);
              },
              error: () => {
                this.calculateSummary();
                this.loading = false;
                setTimeout(() => this.renderCharts(), 100);
              }
            });
          },
          error: (err) => {
            console.error('Failed to load overview', err);
            this.calculateSummary();
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load analytics', err);
        this.loading = false;
      }
    });
  }

  calculateSummary() {
    this.summary.totalLinks = this.links.length;
    this.summary.totalClicks = this.links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    this.summary.avgClicksPerLink = this.summary.totalLinks > 0 
      ? Math.round(this.summary.totalClicks / this.summary.totalLinks) 
      : 0;
    this.summary.mostClickedLink = this.links.length > 0 ? this.links[0] : null;
    // CTR = total clicks / total profile views
    this.summary.ctrPercent = this.profileViewsTotal > 0
      ? Math.round((this.summary.totalClicks / this.profileViewsTotal) * 100)
      : 0;
  }

  getClickPercentage(clicks: number): number {
    if (this.summary.totalClicks === 0) return 0;
    return Math.round((clicks / this.summary.totalClicks) * 100);
  }

  getBarWidth(clicks: number): string {
    const percentage = this.getClickPercentage(clicks);
    return `${percentage}%`;
  }

  // Helpers for templates (avoid using global Math in template)
  clampPercent(value: number, max: number = 100): number {
    if (!value || value < 0) return 0;
    return value > max ? max : value;
  }

  scaledPercent(value: number, scale: number, max: number = 100): string {
    const pct = this.clampPercent(value * scale, max);
    // Ensure a minimal visible bar when zero
    return pct === 0 ? '2px' : pct + '%';
  }

  getUniqueVisitors(): number {
    if (!this.overview?.dailyUniqueVisitors) return 0;
    return this.overview.dailyUniqueVisitors.reduce((sum: number, day: any) => sum + (day.count || 0), 0);
  }

  getMobilePercentage(): number {
    if (!this.overview?.devices || this.overview.devices.length === 0) return 0;
    const total = this.overview.devices.reduce((sum: number, d: any) => sum + (d.count || 0), 0);
    if (total === 0) return 0;
    const mobile = this.overview.devices.find((d: any) => d.type === 'mobile');
    return Math.round((mobile?.count || 0) / total * 100);
  }

  getPeakHour(): string {
    if (!this.overview?.hourlyClicks || this.overview.hourlyClicks.length === 0) return 'N/A';
    const maxHour = this.overview.hourlyClicks.reduce((max: any, current: any) => 
      (current.count || 0) > (max.count || 0) ? current : max
    , { hour: 0, count: 0 });
    if (maxHour.count === 0) return 'N/A';
    return `${maxHour.hour}:00`;
  }

  renderCharts() {
    if (!this.overview) return;
    this.renderTimeSeriesChart();
    this.renderDevicesChart();
    this.renderPlatformsChart();
    this.renderHourlyChart();
  }

  renderTimeSeriesChart() {
    if (!this.timeSeriesCanvas || !this.overview?.timeSeries) return;
    
    if (this.timeSeriesChart) this.timeSeriesChart.destroy();

    const ctx = this.timeSeriesCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.overview.timeSeries;
    const labels = data.map((d: any) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const clicks = data.map((d: any) => d.clicks || 0);

    this.timeSeriesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Clicks',
          data: clicks,
          borderColor: 'rgb(252, 97, 88)',
          backgroundColor: 'rgba(252, 97, 88, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  renderDevicesChart() {
    if (!this.devicesCanvas || !this.overview?.devices?.length) return;
    
    if (this.devicesChart) this.devicesChart.destroy();

    const ctx = this.devicesCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.overview.devices.map((d: any) => d.type);
    const values = this.overview.devices.map((d: any) => d.count);

    this.devicesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            'rgba(252, 97, 88, 0.8)',
            'rgba(217, 70, 239, 0.8)',
            'rgba(59, 130, 246, 0.8)'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, font: { size: 12, weight: 600 } }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        }
      }
    });
  }

  renderPlatformsChart() {
    if (!this.platformsCanvas || !this.overview?.platforms?.length) return;
    
    if (this.platformsChart) this.platformsChart.destroy();

    const ctx = this.platformsCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const topPlatforms = this.overview.platforms.slice(0, 8);
    const labels = topPlatforms.map((p: any) => p.name);
    const values = topPlatforms.map((p: any) => p.count);

    this.platformsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Clicks',
          data: values,
          backgroundColor: 'rgba(252, 97, 88, 0.7)',
          borderRadius: 8,
          maxBarThickness: 60
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
  }

  renderHourlyChart() {
    if (!this.hourlyCanvas || !this.overview?.hourlyClicks?.length) return;
    
    if (this.hourlyChart) this.hourlyChart.destroy();

    const ctx = this.hourlyCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Ensure all 24 hours are present
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const found = this.overview.hourlyClicks.find((h: any) => h.hour === i);
      return found ? found.count : 0;
    });
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    this.hourlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Clicks',
          data: hourlyData,
          backgroundColor: 'rgba(217, 70, 239, 0.7)',
          borderRadius: 6,
          maxBarThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            grid: { display: false },
            ticks: { maxRotation: 45, minRotation: 45 }
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.timeSeriesChart) this.timeSeriesChart.destroy();
    if (this.devicesChart) this.devicesChart.destroy();
    if (this.platformsChart) this.platformsChart.destroy();
    if (this.hourlyChart) this.hourlyChart.destroy();
  }

  logout() {
    this.authService.logout();
  }
}
