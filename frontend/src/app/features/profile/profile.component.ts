import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { LinksService, UserProfile } from "../../core/services/links.service";
import { AuthService } from "../../core/services/auth.service";
import { ThemeService } from "../../core/services/theme.service";
import * as QRCode from "qrcode";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  profile: UserProfile | null = null;
  loading = true;
  error = "";
  isOwner = false;
  showShareModal = false;
  showQRModal = false;
  copySuccess = false;

  @ViewChild("qrCodeElement") qrCodeElement!: ElementRef;
  @ViewChild("shareOverlay") shareOverlay!: ElementRef;
  @ViewChild("qrOverlay") qrOverlay!: ElementRef;
  private _overlayAppended = false;
  private _qrOverlayAppended = false;

  constructor(
    private route: ActivatedRoute,
    private linksService: LinksService,
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    const username = this.route.snapshot.paramMap.get("username");
    if (username) {
      this.loadProfile(username);
    } else {
      this.error = "Invalid profile URL";
      this.loading = false;
    }
  }

  ngAfterViewInit() {
    if (this.showQRModal && this.qrCodeElement) {
      this.generateQRCode();
    }
  }

  ngOnDestroy() {
    // ensure overlays are removed from body if component is destroyed
    try {
      if (
        this.shareOverlay &&
        this.shareOverlay.nativeElement?.parentElement === document.body
      ) {
        document.body.removeChild(this.shareOverlay.nativeElement);
      }
    } catch (e) {
      // ignore
    }

    try {
      if (
        this.qrOverlay &&
        this.qrOverlay.nativeElement?.parentElement === document.body
      ) {
        document.body.removeChild(this.qrOverlay.nativeElement);
      }
    } catch (e) {
      // ignore
    }
  }

  loadProfile(username: string) {
    this.linksService.getPublicProfile(username, true).subscribe({
      next: (profile) => {
        this.profile = profile;
        const currentUser = this.authService.getCurrentUser();
        this.isOwner =
          !!currentUser && currentUser.username === profile.username;
        this.loading = false;

        // Load and apply the user's theme
        this.loadUserTheme(username);
      },
      error: (err) => {
        this.error = err.error?.message || "Profile not found";
        this.loading = false;
      },
    });
  }

  loadUserTheme(username: string) {
    this.themeService.getPublicTheme(username).subscribe({
      next: (theme) => {
        if (theme && theme.themeColors) {
          this.themeService.applyTheme(theme);
        }
      },
      error: (err) => {
        console.log("Failed to load user theme, using default");
      },
    });
  }

  trackClick(linkId: string) {
    // Track click in background
    this.linksService.trackClick(linkId).subscribe();
  }

  goEdit() {
    // navigate to dashboard (where profile settings are)
    this.router.navigate(["/dashboard"]);
  }

  shareOnTwitter() {
    const text = `Check out my Link-in-Bio: ${
      this.profile?.displayName || "@" + this.profile?.username
    }`;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  }

  shareOnFacebook() {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`;
    window.open(facebookUrl, "_blank", "width=550,height=420");
  }

  shareOnLinkedIn() {
    const url = window.location.href;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`;
    window.open(linkedInUrl, "_blank", "width=550,height=420");
  }

  shareOnInstagram() {
    // Instagram doesn't have a direct share URL, so we copy to clipboard
    this.copyToClipboard();
    alert("Link copied! Open Instagram and paste in your story or message.");
  }

  shareOnReddit() {
    const text = `Check out my Link-in-Bio: ${
      this.profile?.displayName || "@" + this.profile?.username
    }`;
    const url = window.location.href;
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(
      url
    )}&title=${encodeURIComponent(text)}`;
    window.open(redditUrl, "_blank", "width=550,height=700");
  }

  shareOnWhatsApp() {
    const text = `Check out my Link-in-Bio: ${
      this.profile?.displayName || "@" + this.profile?.username
    }`;
    const url = window.location.href;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      text + " " + url
    )}`;
    window.open(whatsappUrl, "_blank", "width=550,height=420");
  }

  toggleShareModal() {
    this.showShareModal = !this.showShareModal;
    this.copySuccess = false;

    // When opening, move the overlay element to document.body so it's not clipped
    if (this.showShareModal) {
      // wait for DOM to render the overlay
      setTimeout(() => {
        try {
          const el = this.shareOverlay?.nativeElement;
          if (el && el.parentElement !== document.body) {
            document.body.appendChild(el);
            this._overlayAppended = true;
          }
        } catch (e) {
          // ignore safe-fail
        }
      }, 0);
    } else {
      // closing: let Angular remove the node; just reset flag
      this._overlayAppended = false;
    }
  }

  @HostListener("document:keydown.escape")
  onEscapeKey() {
    this.showShareModal = false;
    this.showQRModal = false;
  }

  showQRCodeModal() {
    this.showQRModal = true;
    // wait for DOM to render overlay and qr element
    setTimeout(() => {
      // append qr overlay to body so it sits above the share modal
      try {
        const el = this.qrOverlay?.nativeElement;
        if (el && el.parentElement !== document.body) {
          document.body.appendChild(el);
          this._qrOverlayAppended = true;
        }
      } catch (e) {
        // ignore
      }

      if (this.qrCodeElement) {
        this.generateQRCode();
      }
    }, 0);
  }

  closeQRModal() {
    this.showQRModal = false;
    // remove overlay from body if we appended it
    try {
      const el = this.qrOverlay?.nativeElement;
      if (el && this._qrOverlayAppended && el.parentElement === document.body) {
        document.body.removeChild(el);
      }
    } catch (e) {
      // ignore
    }
    this._qrOverlayAppended = false;
  }

  copyToClipboard() {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.copySuccess = true;
        setTimeout(() => {
          this.copySuccess = false;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  }

  generateQRCode() {
    if (!this.qrCodeElement) return;

    const url = window.location.href;
    const element = this.qrCodeElement.nativeElement;
    element.innerHTML = ""; // Clear previous QR code

    const canvas = document.createElement("canvas");
    QRCode.toCanvas(
      canvas,
      url,
      {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      },
      (err: any) => {
        if (err) {
          console.error("QR Code generation error:", err);
          return;
        }
        element.appendChild(canvas);
      }
    );
  }

  downloadQRCode() {
    const url = window.location.href;
    QRCode.toDataURL(
      url,
      {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      },
      (err: any, dataUrl: string) => {
        if (err) {
          console.error("QR Code generation error:", err);
          return;
        }

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `profile-qr-${this.profile?.username || "code"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    );
  }

  onIconLoadError(event: any) {
    // Handle broken icon images by hiding them
    event.target.style.display = "none";
    event.target.parentElement?.classList.add("icon-load-failed");
  }

  // Return the URL to use for the link icon in the UI.
  // Swap Reddit favicons to the app's main icon so they match the app branding.
  getIconUrl(link: any): string | undefined {
    try {
      const url = (link && link.url) || "";
      const icon = (link && link.iconUrl) || "";

      // If the target URL is reddit (any subdomain), force the app icon.
      try {
        const hostname = new URL(url).hostname || "";
        if (/\breddit\./i.test(hostname) || /(^|\.)reddit$/i.test(hostname)) {
          return "assets/favicon.svg";
        }
      } catch (e) {
        // ignore parse errors
      }

      // If the explicit icon is present and doesn't look like a reddit-supplied favicon, use it.
      if (icon && !/reddit\./i.test(icon)) return icon;

      // If icon exists but comes from a generic provider (google/clearbit) and we couldn't detect reddit by hostname,
      // prefer the icon (fallback) — otherwise return undefined.
      return icon || undefined;
    } catch (e) {
      return undefined;
    }
  }
}
