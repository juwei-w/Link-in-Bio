import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private firebaseAuth;

  constructor(private http: HttpClient) {
    // Initialize Firebase
    const app = initializeApp(environment.firebase);
    this.firebaseAuth = getAuth(app);

    // Check for stored token
    const token = localStorage.getItem("token");
    if (token) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      this.currentUserSubject.next(user);
    }
  }

  // Email/Password signup with local backend
  signup(
    username: string,
    email: string,
    password: string
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/signup`, {
        username,
        email,
        password,
      })
      .pipe(tap((res) => this.setAuth(res)));
  }

  // Email/Password login with local backend
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.setAuth(res)));
  }

  // Firebase email/password signup
  async firebaseSignup(email: string, password: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    );
    await this.exchangeFirebaseToken(userCredential.user);
  }

  // Firebase email/password login
  async firebaseLogin(email: string, password: string): Promise<void> {
    const userCredential = await signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    );
    await this.exchangeFirebaseToken(userCredential.user);
  }

  // OAuth login (Google)
  async googleLogin(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.firebaseAuth, provider);
      await this.exchangeFirebaseToken(result.user);
    } catch (error: any) {
      console.error("Google login error:", error);
      throw error;
    }
  }

  // Request a password reset email (backend triggers email to user via MailHog)
  forgotPassword(email: string): Promise<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot`, { email }).toPromise();
  }

  // Reset password using token from email
  resetPassword(email: string, token: string, password: string): Promise<any> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/reset`, {
        email,
        token,
        password,
      })
      .toPromise();
  }

  // Exchange Firebase ID token for backend JWT
  private async exchangeFirebaseToken(user: User): Promise<void> {
    const idToken = await user.getIdToken();
    const res = await this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/firebase`, { idToken })
      .toPromise();
    if (res) {
      this.setAuth(res);
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.currentUserSubject.next(null);
    signOut(this.firebaseAuth);
  }

  // Helper to set auth data
  private setAuth(res: AuthResponse): void {
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem("token");
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Get current user
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  // Fetch complete user profile from backend
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`).pipe(
      tap((user) => {
        // Update stored user data with complete profile
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  // Update user profile
  updateProfile(profileData: { displayName?: string; bio?: string; avatarUrl?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/me`, profileData).pipe(
      tap((user) => {
        // Update stored user data
        const currentUser = this.getCurrentUser();
        const updatedUser = { ...currentUser, ...user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      })
    );
  }
}
