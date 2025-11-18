import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Link {
  _id?: string;
  title: string;
  url: string;
  order: number;
  clicks?: number;
  isActive?: boolean;
  createdAt?: Date;
}

export interface UserProfile {
  username: string;
  email?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  avatarUrl?: string;
  theme?: 'light' | 'dark';
  links: Link[];
}

@Injectable({
  providedIn: 'root'
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

  // Reorder links
  reorderLinks(links: Link[]): Observable<void> {
    // Update order for each link
    const updates = links.map((link, index) => 
      this.updateLink(link._id!, { order: index }).toPromise()
    );
    return new Observable(observer => {
      Promise.all(updates).then(() => {
        observer.next();
        observer.complete();
      }).catch(err => observer.error(err));
    });
  }
}
