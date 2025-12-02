import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-demo",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./demo.component.html",
  styleUrls: ["./demo.component.css"],
})
export class DemoComponent {
  readonly demoProfile = {
    username: "demo-user",
    displayName: "Demo User",
    bio: "This is a demo profile showcasing LinkShare features. Click links to see how clicks are tracked.",
    avatar: "",
    links: [
      { title: "Portfolio", url: "https://example.com", clicks: 123 },
      { title: "YouTube", url: "https://youtube.com", clicks: 98 },
      { title: "Contact", url: "mailto:demo@example.com", clicks: 12 },
    ],
  };
}
