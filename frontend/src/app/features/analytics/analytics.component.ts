import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LinksService, Link } from '../../core/services/links.service';

interface AnalyticsSummary {
  totalClicks: number;
  totalLinks: number;
  avgClicksPerLink: number;
  mostClickedLink: Link | null;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  links: Link[] = [];
  loading = true;
  summary: AnalyticsSummary = {
    totalClicks: 0,
    totalLinks: 0,
    avgClicksPerLink: 0,
    mostClickedLink: null
  };

  constructor(private linksService: LinksService) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading = true;
    this.linksService.getMyLinks().subscribe({
      next: (links) => {
        this.links = links.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        this.calculateSummary();
        this.loading = false;
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
  }

  getClickPercentage(clicks: number): number {
    if (this.summary.totalClicks === 0) return 0;
    return Math.round((clicks / this.summary.totalClicks) * 100);
  }

  getBarWidth(clicks: number): string {
    const percentage = this.getClickPercentage(clicks);
    return `${percentage}%`;
  }
}
