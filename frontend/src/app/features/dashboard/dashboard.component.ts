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
  username: string = "";
  displayName: string = "";
  bio: string = "";
  avatarPreview: string | null = null;
  usernameError: string = "";
  usernameAvailable: boolean | null = null;
  checkingUsername = false;
  usernameCheckTimeout: any = null;

  // Image cropper data
  showCropperModal = false;
  imageChangedEvent: any = "";
  croppedImage: string = "";

  // Icon upload helpers
  iconUploadLinkId: string | null = null;
  iconUploadIndex: number | null = null;
  // Custom icon modal state
  showCustomModal = false;
  customModalLinkId: string | null = null;
  customModalIndex: number | null = null;
  customModalUrl: string = "";
  modalSelectedFile: File | null = null;
  modalSelectedFileName: string | null = null;
  modalPreviewUrl: string | null = null;

  // Ref-trigger helper
  triggerImageSelect(input: HTMLInputElement) {
    input.click();
  }

  // Note: inline 'Upload' button removed; use Custom modal to upload images.

  // Open custom-icon modal for a link (Upload or URL)
  openCustomModal(linkId: string, index: number) {
    this.customModalLinkId = linkId;
    this.customModalIndex = index;
    // Also pre-set upload target so upload button from modal works
    this.iconUploadLinkId = linkId;
    this.iconUploadIndex = index;
    this.customModalUrl = "";
    this.showCustomModal = true;
  }

  closeCustomModal() {
    this.showCustomModal = false;
    this.customModalLinkId = null;
    this.customModalIndex = null;
    this.customModalUrl = "";
    // clear any modal-selected file state
    this.modalSelectedFile = null;
    this.modalSelectedFileName = null;
    if (this.modalPreviewUrl) {
      try {
        URL.revokeObjectURL(this.modalPreviewUrl);
      } catch (e) {}
      this.modalPreviewUrl = null;
    }
  }

  // Apply custom URL entered in modal
  applyCustomUrl() {
    const url = (this.customModalUrl || "").trim();
    if (!url) {
      alert("Please enter a valid image URL.");
      return;
    }

    if (!this.customModalLinkId || this.customModalIndex === null) {
      alert("No link selected");
      return;
    }

    this.linksService.setLinkIcon(this.customModalLinkId, url).subscribe({
      next: () => {
        // Update local list and cache-bust
        if (this.links[this.customModalIndex!]) {
          this.links[this.customModalIndex!].iconUrl = this.cacheBustUrl(url);
        }
        this.closeCustomModal();
        alert("Icon set successfully!");
      },
      error: (err) => {
        console.error("Failed to set custom icon from modal:", err);
        const serverMsg =
          err?.error?.message || err?.error?.details || err?.message || null;
        alert(
          "Failed to set icon. " +
            (serverMsg ? `Server: ${serverMsg}` : "Please try again.")
        );
      },
    });
  }

  // Handle selected icon file for a link
  onIconFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!this.iconUploadLinkId) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file for the icon.");
      return;
    }

    // If the custom modal is open, store the selected file and show name/preview
    if (this.showCustomModal) {
      this.modalSelectedFile = file;
      this.modalSelectedFileName = file.name;
      try {
        this.modalPreviewUrl = URL.createObjectURL(file);
      } catch (e) {
        this.modalPreviewUrl = null;
      }
      // Leave iconUploadLinkId/index set so confirmUpload has the target
      // Do not upload immediately from modal; wait for user to confirm
      // Reset the input so same file can be re-selected later if removed
      input.value = "";
      return;
    }

    // Regular immediate upload flow (when not using modal)
    this.linksService.uploadIcon(this.iconUploadLinkId, file).subscribe({
      next: (res) => {
        if (res && res.success) {
          // Refresh links from server to get persisted state, then cache-bust the updated icon URL
          this.linksService.getMyLinks().subscribe({
            next: (links) => {
              this.links = links.sort((a, b) => a.order - b.order);
              if (
                this.iconUploadIndex !== null &&
                this.links[this.iconUploadIndex]
              ) {
                this.links[this.iconUploadIndex].iconUrl = this.cacheBustUrl(
                  res.iconUrl
                );
              }
              alert("Icon uploaded successfully!");
            },
            error: (err) => {
              console.error("Failed to refresh links after upload", err);
              // Fallback: update local list entry if available
              if (
                this.iconUploadIndex !== null &&
                this.links[this.iconUploadIndex]
              ) {
                this.links[this.iconUploadIndex].iconUrl = this.cacheBustUrl(
                  res.iconUrl
                );
              }
              alert("Icon uploaded successfully (couldn't refresh list).");
            },
          });
        }
      },
      error: (err) => {
        console.error("Failed to upload icon:", err);
        const serverMsg =
          err?.error?.message || err?.error?.details || err?.message || null;
        alert(
          "Failed to upload icon. " +
            (serverMsg ? `Server: ${serverMsg}` : "Please try again.")
        );
      },
      complete: () => {
        // Reset
        input.value = "";
        this.iconUploadLinkId = null;
        this.iconUploadIndex = null;
      },
    });
  }

  // Confirm upload from custom modal (called when user presses Confirm)
  confirmUpload() {
    if (!this.modalSelectedFile) {
      alert("No file selected to upload.");
      return;
    }
    if (!this.iconUploadLinkId) {
      alert("No link selected to attach the icon to.");
      return;
    }

    this.linksService
      .uploadIcon(this.iconUploadLinkId, this.modalSelectedFile)
      .subscribe({
        next: (res) => {
          if (res && res.success) {
            // Refresh links and cache-bust
            this.linksService.getMyLinks().subscribe({
              next: (links) => {
                this.links = links.sort((a, b) => a.order - b.order);
                if (
                  this.customModalIndex !== null &&
                  this.links[this.customModalIndex]
                ) {
                  this.links[this.customModalIndex].iconUrl = this.cacheBustUrl(
                    res.iconUrl
                  );
                }
                alert("Icon uploaded successfully!");
                this.closeCustomModal();
              },
              error: (err) => {
                console.error("Failed to refresh links after upload", err);
                if (
                  this.customModalIndex !== null &&
                  this.links[this.customModalIndex]
                ) {
                  this.links[this.customModalIndex].iconUrl = this.cacheBustUrl(
                    res.iconUrl
                  );
                }
                alert("Icon uploaded successfully (could not refresh list).");
                this.closeCustomModal();
              },
            });
          }
        },
        error: (err) => {
          console.error("Failed to upload icon from modal:", err);
          const serverMsg =
            err?.error?.message || err?.error?.details || err?.message || null;
          alert(
            "Failed to upload icon. " +
              (serverMsg ? `Server: ${serverMsg}` : "Please try again.")
          );
        },
      });
  }

  removeModalSelectedFile() {
    this.modalSelectedFile = null;
    this.modalSelectedFileName = null;
    if (this.modalPreviewUrl) {
      try {
        URL.revokeObjectURL(this.modalPreviewUrl);
      } catch (e) {}
      this.modalPreviewUrl = null;
    }
  }

  // Append a timestamp query param to bust browser cache when replacing icons
  cacheBustUrl(url: string): string {
    if (!url) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}_ts=${Date.now()}`;
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
        this.username = user.username || "";
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
    // Validate username if changed
    if (this.username !== this.currentUser?.username) {
      if (!this.isValidUsername(this.username)) {
        alert(
          "Invalid username. Use 3-16 characters (letters, numbers, - and _ only)"
        );
        return;
      }
      // If availability check returned false -> block
      if (this.usernameAvailable === false) {
        alert("Username is not available");
        return;
      }
      // If availability could not be verified (null), ask user to confirm
      if (this.usernameAvailable === null) {
        const proceed = confirm(
          "Could not verify username availability due to a network error. Do you want to try saving anyway? It may fail if the username is taken."
        );
        if (!proceed) return;
      }
    }

    this.profileLoading = true;

    const profileData: any = {
      username: this.username,
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

        // If username changed, redirect to new URL
        if (user.username !== this.currentUser?.username) {
          alert(
            "Username updated successfully! Redirecting to your new profile..."
          );
          // Update localStorage and redirect
          localStorage.setItem("username", user.username);
          window.location.href = `/${user.username}`;
        } else {
          alert("Profile updated successfully!");
          console.log("Profile updated:", user);
          this.currentUser = user;
          this.loadUserProfile();
        }
      },
      error: (err) => {
        this.profileLoading = false;
        console.error("Failed to update profile", err);
        const errorMsg =
          err.error?.message || "Failed to update profile. Please try again.";
        alert(errorMsg);
        // Reset username on error
        this.username = this.currentUser?.username || "";
        this.usernameError = "";
        this.usernameAvailable = null;
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
      return `${window.location.origin}/${
        this.username || this.currentUser?.username
      }`;
    }
    return `/${this.username || this.currentUser?.username}`;
  }

  // Username validation
  isValidUsername(username: string): boolean {
    const USERNAME_REGEX = /^[a-z0-9_-]{3,16}$/i;
    return USERNAME_REGEX.test(username);
  }

  // Check username availability with debounce
  onUsernameChange() {
    this.usernameError = "";
    this.usernameAvailable = null;

    if (!this.username || this.username === this.currentUser?.username) {
      this.usernameAvailable = true;
      return;
    }

    // Validate format
    if (!this.isValidUsername(this.username)) {
      this.usernameError = "3-16 characters (letters, numbers, - and _ only)";
      this.usernameAvailable = false;
      return;
    }

    // Clear previous timeout
    if (this.usernameCheckTimeout) {
      clearTimeout(this.usernameCheckTimeout);
    }

    // Debounce the availability check (wait 500ms after user stops typing)
    this.checkingUsername = true;
    this.usernameCheckTimeout = setTimeout(() => {
      this.authService.checkUsernameAvailability(this.username).subscribe({
        next: (result) => {
          this.usernameAvailable = result.available;
          if (!result.available) {
            this.usernameError = "Username already taken";
          }
          this.checkingUsername = false;
        },
        error: (err) => {
          console.error("Error checking username:", err);
          this.usernameAvailable = null;
          this.usernameError = "Error checking availability";
          this.checkingUsername = false;
        },
      });
    }, 500);
  }

  // Icon management methods
  fetchFaviconForLink(linkId: string, index: number) {
    this.linksService.fetchFaviconForLink(linkId).subscribe({
      next: (result) => {
        if (result.success && this.links[index]) {
          this.links[index].iconUrl = this.cacheBustUrl(result.iconUrl);
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
            this.links[index].iconUrl = this.cacheBustUrl(iconUrl);
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

  // Platform detection removed — use auto-fetch, custom URL, or upload

  logout() {
    this.authService.logout();
    this.router.navigate(["/"]);
  }
}
