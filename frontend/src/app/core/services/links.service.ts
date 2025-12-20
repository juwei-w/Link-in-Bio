import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface Link {
  _id?: string;
  title: string;
  url: string;
  iconUrl?: string;
  order: number;
  clicks?: number;
  isActive?: boolean;
  createdAt?: Date;
  scheduledStart?: string | Date;
  scheduledEnd?: string | Date;
}

export interface UserProfile {
  username: string;
  email?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  avatarUrl?: string;
  theme?: "light" | "dark";
  links: Link[];
}

@Injectable({
  providedIn: "root",
})
export class LinksService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get current user profile
  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/users/me`);
  }

  // Update current user profile
  updateMyProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/users/me`, data);
  }

  // Get user's own links (authenticated)
  getMyLinks(): Observable<Link[]> {
    return this.http.get<Link[]>(`${this.apiUrl}/links`);
  }

  // Get public links for a user
  getUserLinks(userId: string): Observable<Link[]> {
    return this.http.get<Link[]>(`${this.apiUrl}/users/${userId}/links`);
  }

  // Get public profile by username
  getPublicProfile(username: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile/${username}`);
  }

  // Create a new link
  createLink(link: Partial<Link>): Observable<Link> {
    return this.http.post<Link>(`${this.apiUrl}/links`, link);
  }

  // Update a link
  updateLink(id: string, link: Partial<Link>): Observable<Link> {
    return this.http.put<Link>(`${this.apiUrl}/links/${id}`, link);
  }

  // Delete a link
  deleteLink(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/links/${id}`);
  }

  // Track click
  trackClick(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/links/${id}/click`, {});
  }

  // Analytics overview for current user
  getAnalyticsOverview(days: number = 30): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/links/analytics/overview?days=${days}`
    );
  }

  // Analytics for a specific link
  getLinkAnalytics(id: string, days: number = 30): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/links/${id}/analytics?days=${days}`
    );
  }

  // Reorder links
  reorderLinks(links: Link[]): Observable<void> {
    // Update order for each link
    const updates = links.map((link, index) =>
      this.updateLink(link._id!, { order: index }).toPromise()
    );
    return new Observable((observer) => {
      Promise.all(updates)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }

  // Auto-fetch favicon for a specific link
  fetchFaviconForLink(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/links/${id}/fetch-icon`, {});
  }

  // Auto-fetch favicons for all user's links
  fetchFaviconsForAllLinks(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/links/fetch-icons/all`, {});
  }

  // Set custom icon URL for a link
  setLinkIcon(id: string, iconUrl: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/links/${id}/set-icon`, {
      iconUrl,
    });
  }

  // Upload an icon image file for a link (multipart/form-data)
  uploadIcon(id: string, file: File): Observable<any> {
    const fd = new FormData();
    fd.append("icon", file);
    return this.http.post<any>(`${this.apiUrl}/links/${id}/upload-icon`, fd);
  }

  // Clear icon for a link
  clearLinkIcon(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/links/${id}/icon`);
  }

  // Platform detection removed; use uploadIcon or setLinkIcon instead
}
