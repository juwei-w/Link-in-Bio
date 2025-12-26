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
  dateRanges = [7, 14, 30, 60, 90, 0];

  // Chart references
  @ViewChild('timeSeriesCanvas') timeSeriesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('platformsCanvas') platformsCanvas?: ElementRef<HTMLCanvasElement>; // For Referrers
  @ViewChild('devicesCanvas') devicesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('locationsCanvas') locationsCanvas?: ElementRef<HTMLCanvasElement>;

  private timeSeriesChart?: Chart;
  private devicesChart?: Chart;
  private referrersChart?: Chart;
  private locationsChart?: Chart;
  private hourlyChart?: Chart;

  // Drill down state
  expandedLinkId: string | null = null;
  linkAnalytics: any = null;
  loadingLinkAnalytics = false;

  // Computed insights
  peakTimeDisplay: string = 'N/A';
  peakTimeDayParts: string = ''; // e.g., "Afternoon"
  topCountry: string = '-';
  topCity: string = '-';

  constructor(private linksService: LinksService, private authService: AuthService) { }

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
      next: (initialLinks) => {
        // We will update these links with filtered data from overview
        this.linksService.getAnalyticsOverview(this.days).subscribe({
          next: (ov) => {
            this.overview = ov;

            // Map filtered clicks to links
            const statsMap = new Map(ov.linkStats?.map((s: any) => [s.id, s.clicks]) || []);
            this.links = initialLinks.map(link => ({
              ...link,
              clicks: (statsMap.get(link._id!) as number) || 0 // Override with filtered count
            }));

            // Sort by new click counts
            this.links.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

            this.processInsights(); // Calculate peak time, etc.

            this.authService.getProfile().subscribe({
              next: (profile) => {
                this.profileViewsTotal = (profile as any).totalProfileViews || 0;
                this.calculateSummary(); // Recalculate summary with new data
                this.loading = false;
                setTimeout(() => this.renderCharts(), 300);
              },
              error: () => {
                this.calculateSummary();
                this.loading = false;
                setTimeout(() => this.renderCharts(), 300);
              }
            });
          },
          error: (err) => {
            console.error('Failed to load overview', err);
            this.links = initialLinks; // Fallback
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
    // Use the filtered total from overview if available, else sum the (now filtered) links
    this.summary.totalClicks = this.overview?.totalClicks !== undefined
      ? this.overview.totalClicks
      : this.links.reduce((sum, link) => sum + (link.clicks || 0), 0);

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

  getLinkCtr(clicks: number = 0): number {
    if (this.profileViewsTotal === 0) return 0;
    // Cap at 100% just in case clicks > views (possible due to bots or multiple clicks per session)
    const ctr = (clicks / this.profileViewsTotal) * 100;
    return Math.round(Math.min(ctr, 100));
  }

  processInsights() {
    // 1. Peak Time
    if (this.overview?.hourlyClicks?.length) {
      const maxHour = this.overview.hourlyClicks.reduce((max: any, current: any) =>
        (current.count || 0) > (max.count || 0) ? current : max
        , { hour: 0, count: 0 });

      if (maxHour.count > 0) {
        const h = maxHour.hour;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12; // Convert 0 to 12
        this.peakTimeDisplay = `${displayH}:00 ${ampm}`;

        if (h >= 5 && h < 12) this.peakTimeDayParts = 'Morning';
        else if (h >= 12 && h < 17) this.peakTimeDayParts = 'Afternoon';
        else if (h >= 17 && h < 21) this.peakTimeDayParts = 'Evening';
        else this.peakTimeDayParts = 'Night';
      } else {
        this.peakTimeDisplay = 'N/A';
        this.peakTimeDayParts = '';
      }
    }

    // 2. Top Location
    if (this.overview?.topCountries?.length) {
      this.topCountry = this.overview.topCountries[0].country || '-';
    }
    if (this.overview?.topCities?.length) {
      this.topCity = this.overview.topCities[0].city || '-';
    }
  }

  toggleLinkDetails(linkId: string) {
    if (this.expandedLinkId === linkId) {
      this.expandedLinkId = null;
      this.linkAnalytics = null;
    } else {
      this.expandedLinkId = linkId;
      this.loadLinkDetails(linkId);
    }
  }

  loadLinkDetails(linkId: string) {
    this.loadingLinkAnalytics = true;
    this.linkAnalytics = null;

    this.linksService.getLinkAnalytics(linkId, this.days).subscribe({
      next: (data) => {
        this.linkAnalytics = data;
        this.loadingLinkAnalytics = false;
      },
      error: (err) => {
        console.error("Failed link details", err);
        this.loadingLinkAnalytics = false;
      }
    });
  }

  renderCharts() {
    console.log('Metrics: renderCharts triggered. Overview present:', !!this.overview);
    if (!this.overview) return;

    this.renderTimeSeriesChart();
    this.renderReferrersChart();
    this.renderLocationsChart();
    this.renderDevicesChart();
  }

  renderLocationsChart() {
    // Fallback ID: locationsCanvas
    let canvasEl: HTMLCanvasElement | undefined = this.locationsCanvas?.nativeElement;
    if (!canvasEl) {
      const el = document.getElementById('locationsCanvas');
      if (el) canvasEl = el as HTMLCanvasElement;
    }

    if (!canvasEl || !this.overview?.topCountries?.length) return;

    if (this.locationsChart) this.locationsChart.destroy();

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const data = this.overview.topCountries.slice(0, 5);
    const labels = data.map((c: any) => c.country || 'Unknown');
    const values = data.map((c: any) => c.count);

    this.locationsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Clicks',
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 8
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { precision: 0 }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
  }

  renderTimeSeriesChart() {
    // Try to get element from ViewChild, or fallback to native ID
    let canvasEl: HTMLCanvasElement | undefined = this.timeSeriesCanvas?.nativeElement;
    if (!canvasEl) {
      console.warn('Metrics: ViewChild TS Canvas missing, trying getElementById');
      const el = document.getElementById('timeSeriesCanvas');
      if (el) canvasEl = el as HTMLCanvasElement;
    }

    if (!canvasEl || !this.overview?.timeSeries) {
      console.warn('Metrics: Missing TS Canvas or Data even after fallback');
      return;
    }

    if (this.timeSeriesChart) this.timeSeriesChart.destroy();

    const ctx = canvasEl.getContext('2d');
    if (!ctx) {
      console.error('Metrics: Failed to get 2d context for TS chart');
      return;
    }

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
    // Fallback ID: devicesCanvas
    let canvasEl: HTMLCanvasElement | undefined = this.devicesCanvas?.nativeElement;
    if (!canvasEl) {
      const el = document.getElementById('devicesCanvas');
      if (el) canvasEl = el as HTMLCanvasElement;
    }

    if (!canvasEl || !this.overview?.devices?.length) return;

    if (this.devicesChart) this.devicesChart.destroy();

    const ctx = canvasEl.getContext('2d');
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

  renderReferrersChart() {
    // Try to get element from ViewChild, or fallback to native ID
    let canvasEl: HTMLCanvasElement | undefined = this.platformsCanvas?.nativeElement;
    if (!canvasEl) {
      // fallback
      const el = document.getElementById('referrersCanvas');
      if (el) canvasEl = el as HTMLCanvasElement;
    }

    if (!canvasEl || !this.overview?.topReferrers?.length) return;

    if (this.referrersChart) this.referrersChart.destroy();

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const topRefs = this.overview.topReferrers.slice(0, 5);
    const labels = topRefs.map((p: any) => p.source === 'direct' ? 'Direct / Unknown' : p.source);
    const values = topRefs.map((p: any) => p.count);

    this.referrersChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)', // Blue
            'rgba(16, 185, 129, 0.8)', // Emerald
            'rgba(245, 158, 11, 0.8)', // Amber
            'rgba(239, 68, 68, 0.8)',  // Red
            'rgba(107, 114, 128, 0.8)' // Gray
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { usePointStyle: true, boxWidth: 8 }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        cutout: '65%' // Thinner doughnut
      }
    });
  }

  ngOnDestroy() {
    if (this.timeSeriesChart) this.timeSeriesChart.destroy();
    if (this.referrersChart) this.referrersChart.destroy();
    if (this.locationsChart) this.locationsChart.destroy();
    if (this.devicesChart) this.devicesChart.destroy();
  }

  logout() {
    this.authService.logout();
  }
}
