import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LinksService, Link } from '../../core/services/links.service';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageCropperComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  links: Link[] = [];
  showAddForm = false;
  editingLink: Link | null = null;
  formData: Partial<Link> = { title: '', url: '' };
  loading = false;
  profileLoading = false;
  currentUser: any;
  draggedIndex = -1;
  
  // Profile data
  displayName: string = '';
  bio: string = '';
  avatarPreview: string | null = null;
  
  // Image cropper data
  showCropperModal = false;
  imageChangedEvent: any = '';
  croppedImage: string = '';
  
  // Ref-trigger helper
  triggerImageSelect(input: HTMLInputElement) {
    input.click();
  }

  constructor(
    private authService: AuthService,
    private linksService: LinksService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.loadLinks();
    this.loadUserProfile();
  }

  loadUserProfile() {
    // Fetch complete user profile from backend
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.displayName = user.displayName || '';
        this.bio = user.bio || '';
        this.avatarPreview = user.avatarUrl || null;
        this.currentUser = user;
      },
      error: (err) => console.error('Failed to fetch profile', err)
    });
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
    // Validate required fields
    if (!this.formData.title || !this.formData.url) {
      alert('Please fill in both title and URL fields');
      return;
    }
    
    // Basic URL validation
    if (!this.formData.url.startsWith('http://') && !this.formData.url.startsWith('https://')) {
      alert('URL must start with http:// or https://');
      return;
    }
    
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
          alert('Failed to update link. Please try again.');
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
          alert('Failed to create link. Please try again.');
        }
      });
    }
  }

  editLink(link: Link) {
    this.editingLink = link;
    this.formData = { title: link.title, url: link.url };
    this.showAddForm = false;
    
    // Scroll to edit section smoothly
    setTimeout(() => {
      const editSection = document.getElementById('link-form-card');
      if (editSection) {
        editSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
  
  updateProfile() {
    this.profileLoading = true;
    
    const profileData: any = {
      displayName: this.displayName,
      bio: this.bio
    };
    
    // If avatar preview exists, save it as avatarUrl
    if (this.avatarPreview) {
      profileData.avatarUrl = this.avatarPreview;
    }
    
    this.authService.updateProfile(profileData).subscribe({
      next: (user) => {
        this.profileLoading = false;
        alert('Profile updated successfully!');
        console.log('Profile updated:', user);
      },
      error: (err) => {
        this.profileLoading = false;
        console.error('Failed to update profile', err);
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  onFileSelected(event: Event) {
    this.imageChangedEvent = event;
    this.showCropperModal = true;
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      this.croppedImage = event.base64;
    } else if (event.blob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.croppedImage = reader.result as string;
      };
      reader.readAsDataURL(event.blob);
    } else {
      this.croppedImage = '';
    }
  }

  imageLoaded() {
    // Image loaded successfully
  }

  cropperReady() {
    // Cropper ready
  }

  loadImageFailed() {
    alert('Failed to load image. Please try another file.');
    this.cancelCrop();
  }

  applyCrop() {
    if (this.croppedImage) {
      this.avatarPreview = this.croppedImage;
      
      // Upload to Cloudinary via backend
      this.profileLoading = true;
      this.authService.updateProfile({
        displayName: this.displayName,
        bio: this.bio,
        avatarUrl: this.croppedImage
      }).subscribe({
        next: (user) => {
          this.profileLoading = false;
          this.currentUser = this.authService.getCurrentUser();
          // Update preview with Cloudinary URL
          this.avatarPreview = user.avatarUrl || null;
        },
        error: (err) => {
          this.profileLoading = false;
          console.error('Failed to update profile picture', err);
          alert('Failed to save profile picture. Please try again.');
        }
      });
    }
    this.showCropperModal = false;
    this.imageChangedEvent = '';
  }

  cancelCrop() {
    this.showCropperModal = false;
    this.imageChangedEvent = '';
  }

  removeAvatar() {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }
    
    this.avatarPreview = null;
    this.croppedImage = '';
    
    this.profileLoading = true;
    this.authService.updateProfile({
      displayName: this.displayName,
      bio: this.bio,
      avatarUrl: ''
    }).subscribe({
      next: (user) => {
        this.profileLoading = false;
        this.currentUser = this.authService.getCurrentUser();
      },
      error: (err) => {
        this.profileLoading = false;
        alert('Failed to remove profile picture. Please try again.');
      }
    });
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

  getProfileUrl(): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${this.currentUser?.username}`;
    }
    return `/${this.currentUser?.username}`;
  }
}
