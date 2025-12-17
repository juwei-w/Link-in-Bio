import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { LinksService, UserProfile } from "../../core/services/links.service";
import { AuthService } from "../../core/services/auth.service";
import * as QRCode from "qrcode";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
})
export class ProfileComponent implements OnInit, AfterViewInit {
  profile: UserProfile | null = null;
  loading = true;
  error = "";
  isOwner = false;
  showShareModal = false;
  showQRModal = false;
  copySuccess = false;

  @ViewChild("qrCodeElement") qrCodeElement!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private linksService: LinksService,
    private router: Router,
    private authService: AuthService
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

  loadProfile(username: string) {
    this.linksService.getPublicProfile(username).subscribe({
      next: (profile) => {
        this.profile = profile;
        const currentUser = this.authService.getCurrentUser();
        this.isOwner =
          !!currentUser && currentUser.username === profile.username;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || "Profile not found";
        this.loading = false;
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
  }

  showQRCodeModal() {
    this.showQRModal = true;
    setTimeout(() => {
      if (this.qrCodeElement) {
        this.generateQRCode();
      }
    }, 0);
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
}
