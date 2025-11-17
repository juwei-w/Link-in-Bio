import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LinksService, Link } from '../../core/services/links.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  links: Link[] = [];
  showAddForm = false;
  editingLink: Link | null = null;
  formData: Partial<Link> = { title: '', url: '' };
  loading = false;
  currentUser: any;
  draggedIndex = -1;

  constructor(
    private authService: AuthService,
    private linksService: LinksService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.loadLinks();
  }

  loadLinks() {
    this.linksService.getMyLinks().subscribe({
      next: (links) => {
        this.links = links.sort((a, b) => a.order - b.order);
      },
      error: (err) => console.error('Failed to load links', err)
    });
  }

  saveLink() {
    this.loading = true;
    
    if (this.editingLink) {
      // Update existing link
      this.linksService.updateLink(this.editingLink._id!, this.formData).subscribe({
        next: () => {
          this.loadLinks();
          this.cancelEdit();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to update link', err);
          this.loading = false;
        }
      });
    } else {
      // Create new link
      this.formData.order = this.links.length;
      this.linksService.createLink(this.formData).subscribe({
        next: () => {
          this.loadLinks();
          this.cancelEdit();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to create link', err);
          this.loading = false;
        }
      });
    }
  }

  editLink(link: Link) {
    this.editingLink = link;
    this.formData = { title: link.title, url: link.url };
    this.showAddForm = false;
  }

  deleteLink(id: string) {
    if (confirm('Are you sure you want to delete this link?')) {
      this.linksService.deleteLink(id).subscribe({
        next: () => this.loadLinks(),
        error: (err) => console.error('Failed to delete link', err)
      });
    }
  }

  cancelEdit() {
    this.showAddForm = false;
    this.editingLink = null;
    this.formData = { title: '', url: '' };
  }

  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    
    if (this.draggedIndex !== dropIndex) {
      const draggedLink = this.links[this.draggedIndex];
      this.links.splice(this.draggedIndex, 1);
      this.links.splice(dropIndex, 0, draggedLink);
      
      // Update order
      this.linksService.reorderLinks(this.links).subscribe({
        next: () => this.loadLinks(),
        error: (err) => console.error('Failed to reorder links', err)
      });
    }
    
    this.draggedIndex = -1;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
