import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { LinksService, Link } from "../../core/services/links.service";
import { ImageCropperComponent, ImageCroppedEvent } from "ngx-image-cropper";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageCropperComponent],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  links: Link[] = [];
  showAddForm = false;
  editingLink: Link | null = null;
  formData: Partial<Link> = {
    title: "",
    url: "",
    scheduledStart: undefined,
    scheduledEnd: undefined,
  };
  loading = false;
  profileLoading = false;
  currentUser: any;
  draggedIndex = -1;

  // Profile data
  displayName: string = "";
  bio: string = "";
  avatarPreview: string | null = null;

  // Image cropper data
  showCropperModal = false;
  imageChangedEvent: any = "";
  croppedImage: string = "";

  // Platform detection preview
  detectedPlatform: any = null;
  platformDetectionTimeout: any = null;

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
        this.displayName = user.displayName || "";
        this.bio = user.bio || "";
        this.avatarPreview = user.avatarUrl || null;
        this.currentUser = user;
      },
      error: (err) => console.error("Failed to fetch profile", err),
    });
  }

  loadLinks() {
    this.linksService.getMyLinks().subscribe({
      next: (links) => {
        this.links = links.sort((a, b) => a.order - b.order);
      },
      error: (err) => console.error("Failed to load links", err),
    });
  }

  saveLink() {
    // Validate required fields
    if (!this.formData.title || !this.formData.url) {
      alert("Please fill in both title and URL fields");
      return;
    }

    // Basic URL validation
    if (
      !this.formData.url.startsWith("http://") &&
      !this.formData.url.startsWith("https://")
    ) {
      alert("URL must start with http:// or https://");
      return;
    }

    // Validate scheduling dates
    if (this.formData.scheduledStart && this.formData.scheduledEnd) {
      const start = new Date(this.formData.scheduledStart);
      const end = new Date(this.formData.scheduledEnd);
      if (end <= start) {
        alert("End date must be after start date");
        return;
      }
    }

    // Convert datetime-local strings to ISO format (UTC) for backend
    const linkData = {
      ...this.formData,
      scheduledStart: this.formData.scheduledStart
        ? new Date(this.formData.scheduledStart).toISOString()
        : undefined,
      scheduledEnd: this.formData.scheduledEnd
        ? new Date(this.formData.scheduledEnd).toISOString()
        : undefined,
    };

    this.loading = true;

    if (this.editingLink) {
      // Update existing link
      this.linksService.updateLink(this.editingLink._id!, linkData).subscribe({
        next: () => {
          this.loadLinks();
          this.cancelEdit();
          this.loading = false;
        },
        error: (err) => {
          console.error("Failed to update link", err);
          this.loading = false;
          alert("Failed to update link. Please try again.");
        },
      });
    } else {
      // Create new link
      linkData.order = this.links.length;
      this.linksService.createLink(linkData).subscribe({
        next: () => {
          this.loadLinks();
          this.cancelEdit();
          this.loading = false;
        },
        error: (err) => {
          console.error("Failed to create link", err);
          this.loading = false;
          alert("Failed to create link. Please try again.");
        },
      });
    }
  }

  editLink(link: Link) {
    this.editingLink = link;
    this.formData = {
      title: link.title,
      url: link.url,
      scheduledStart: link.scheduledStart
        ? this.formatDateTimeLocal(link.scheduledStart.toString())
        : undefined,
      scheduledEnd: link.scheduledEnd
        ? this.formatDateTimeLocal(link.scheduledEnd.toString())
        : undefined,
    };
    this.showAddForm = false;

    // Scroll to edit section smoothly
    setTimeout(() => {
      const editSection = document.getElementById("link-form-card");
      if (editSection) {
        editSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }

  updateProfile() {
    this.profileLoading = true;

    const profileData: any = {
      displayName: this.displayName,
      bio: this.bio,
    };

    // If avatar preview exists, save it as avatarUrl
    if (this.avatarPreview) {
      profileData.avatarUrl = this.avatarPreview;
    }

    this.authService.updateProfile(profileData).subscribe({
      next: (user) => {
        this.profileLoading = false;
        alert("Profile updated successfully!");
        console.log("Profile updated:", user);
      },
      error: (err) => {
        this.profileLoading = false;
        console.error("Failed to update profile", err);
        alert("Failed to update profile. Please try again.");
      },
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
      this.croppedImage = "";
    }
  }

  imageLoaded() {
    // Image loaded successfully
  }

  cropperReady() {
    // Cropper ready
  }

  loadImageFailed() {
    alert("Failed to load image. Please try another file.");
    this.cancelCrop();
  }

  applyCrop() {
    if (this.croppedImage) {
      this.avatarPreview = this.croppedImage;

      // Upload to Cloudinary via backend
      this.profileLoading = true;
      this.authService
        .updateProfile({
          displayName: this.displayName,
          bio: this.bio,
          avatarUrl: this.croppedImage,
        })
        .subscribe({
          next: (user) => {
            this.profileLoading = false;
            this.currentUser = this.authService.getCurrentUser();
            // Update preview with Cloudinary URL
            this.avatarPreview = user.avatarUrl || null;
          },
          error: (err) => {
            this.profileLoading = false;
            console.error("Failed to update profile picture", err);
            alert("Failed to save profile picture. Please try again.");
          },
        });
    }
    this.showCropperModal = false;
    this.imageChangedEvent = "";
  }

  cancelCrop() {
    this.showCropperModal = false;
    this.imageChangedEvent = "";
  }

  removeAvatar() {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    this.avatarPreview = null;
    this.croppedImage = "";

    this.profileLoading = true;
    this.authService
      .updateProfile({
        displayName: this.displayName,
        bio: this.bio,
        avatarUrl: "",
      })
      .subscribe({
        next: (user) => {
          this.profileLoading = false;
          this.currentUser = this.authService.getCurrentUser();
        },
        error: (err) => {
          this.profileLoading = false;
          alert("Failed to remove profile picture. Please try again.");
        },
      });
  }

  deleteLink(id: string) {
    if (confirm("Are you sure you want to delete this link?")) {
      this.linksService.deleteLink(id).subscribe({
        next: () => this.loadLinks(),
        error: (err) => console.error("Failed to delete link", err),
      });
    }
  }

  cancelEdit() {
    this.showAddForm = false;
    this.editingLink = null;
    this.formData = {
      title: "",
      url: "",
      scheduledStart: undefined,
      scheduledEnd: undefined,
    };
  }

  // Helper to format Date to datetime-local input format
  formatDateTimeLocal(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Helper to check if a scheduled link is currently active
  isLinkScheduledActive(link: Link): boolean {
    const now = new Date();

    // If link has a scheduled start time
    if (link.scheduledStart && now < new Date(link.scheduledStart)) {
      return false; // Link hasn't started yet
    }

    // If link has a scheduled end time
    if (link.scheduledEnd && now > new Date(link.scheduledEnd)) {
      return false; // Link has ended
    }

    return true; // Link is currently active
  }

  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    event.dataTransfer!.effectAllowed = "move";
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
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
        error: (err) => console.error("Failed to reorder links", err),
      });
    }

    this.draggedIndex = -1;
  }

  getProfileUrl(): string {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${this.currentUser?.username}`;
    }
    return `/${this.currentUser?.username}`;
  }

  // Icon management methods
  fetchFaviconForLink(linkId: string, index: number) {
    this.linksService.fetchFaviconForLink(linkId).subscribe({
      next: (result) => {
        if (result.success && this.links[index]) {
          this.links[index].iconUrl = result.iconUrl;
          alert("Favicon fetched successfully!");
        }
      },
      error: (err) => {
        console.error("Failed to fetch favicon:", err);
        alert(
          "Could not fetch favicon for this URL. You can upload a custom icon instead."
        );
      },
    });
  }

  fetchFaviconsForAllLinks() {
    if (
      confirm(
        "This will attempt to auto-fetch favicons for all links without icons. Continue?"
      )
    ) {
      this.linksService.fetchFaviconsForAllLinks().subscribe({
        next: (result) => {
          const successful = result.results.filter(
            (r: any) => r.success
          ).length;
          alert(`Successfully fetched ${successful} favicons!`);
          this.loadLinks();
        },
        error: (err) => {
          console.error("Failed to fetch favicons:", err);
          alert("There was an error fetching favicons.");
        },
      });
    }
  }

  setCustomIcon(linkId: string, index: number) {
    const iconUrl = prompt(
      "Enter the direct image URL:\n\n" +
        "Examples:\n" +
        "- https://example.com/icon.png\n" +
        "- https://cdn.com/logo.jpg\n\n" +
        "Note: Use direct image URLs (.png, .jpg, .gif, etc.), not webpage links."
    );
    if (iconUrl) {
      this.linksService.setLinkIcon(linkId, iconUrl).subscribe({
        next: () => {
          if (this.links[index]) {
            this.links[index].iconUrl = iconUrl;
            alert("Icon set successfully!");
          }
        },
        error: (err) => {
          console.error("Failed to set icon:", err);
          alert(
            "❌ Failed to set icon.\n\n" +
              (err.error?.message ||
                "Make sure the URL is a direct image link (e.g., .jpg, .png, .gif), not a webpage URL.\n\n" +
                  "Try using the auto-fetch feature first!")
          );
        },
      });
    }
  }

  clearIcon(linkId: string, index: number) {
    if (confirm("Remove the icon for this link?")) {
      this.linksService.clearLinkIcon(linkId).subscribe({
        next: () => {
          if (this.links[index]) {
            this.links[index].iconUrl = undefined;
          }
        },
        error: (err) => {
          console.error("Failed to clear icon:", err);
          alert("Failed to remove icon.");
        },
      });
    }
  }

  // Detect video platform and suggest icon
  detectPlatformIcon(linkId: string, index: number) {
    this.linksService.detectPlatformIcon(linkId).subscribe({
      next: (result) => {
        if (result.success && result.platform) {
          const platform = result.platform;
          const confirmUse = confirm(
            `📺 Platform Detected: ${platform.name}\n\n` +
              `Would you like to use the ${platform.name} icon for this link?\n\n` +
              "Click OK to accept, Cancel to skip."
          );

          if (confirmUse) {
            this.linksService.setLinkIcon(linkId, platform.icon).subscribe({
              next: () => {
                if (this.links[index]) {
                  this.links[index].iconUrl = platform.icon;
                  alert(`✓ ${platform.name} icon applied!`);
                }
              },
              error: (err) => {
                console.error("Failed to set platform icon:", err);
                alert("Failed to apply platform icon.");
              },
            });
          }
        } else {
          alert(
            "No platform detected for this URL. Try using the auto-fetch feature instead."
          );
        }
      },
      error: (err) => {
        console.error("Failed to detect platform:", err);
        alert(
          "Could not detect platform. Try using the auto-fetch feature instead."
        );
      },
    });
  }

  // Handle URL input change for live platform detection preview
  onUrlInputChange() {
    // Clear existing timeout
    if (this.platformDetectionTimeout) {
      clearTimeout(this.platformDetectionTimeout);
    }

    // Clear previous detection
    this.detectedPlatform = null;

    // Only detect if URL is not empty
    if (!this.formData.url || this.formData.url.trim() === "") {
      return;
    }

    // Debounce the detection request (wait 800ms after user stops typing)
    this.platformDetectionTimeout = setTimeout(() => {
      this.linksService.detectPlatformPreview(this.formData.url!).subscribe({
        next: (result) => {
          if (result.success && result.platform) {
            this.detectedPlatform = result.platform;
          }
        },
        error: (err) => {
          console.error("Failed to detect platform:", err);
          // Silently fail - don't show error to user for preview
        },
      });
    }, 800);
  }

  // Apply detected platform icon to form (before saving link)
  applyDetectedPlatform() {
    if (this.detectedPlatform && this.editingLink) {
      // Store the detected icon to apply when saving
      this.formData.iconUrl = this.detectedPlatform.icon;
      alert(`✓ ${this.detectedPlatform.name} icon will be applied!`);
      this.dismissDetectedPlatform();
    }
  }

  // Dismiss the detected platform preview
  dismissDetectedPlatform() {
    this.detectedPlatform = null;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/"]);
  }
}
