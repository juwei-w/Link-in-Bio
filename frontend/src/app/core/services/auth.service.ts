import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, fetchSignInMethodsForEmail, signInWithCredential, GoogleAuthProvider as GAP, GithubAuthProvider as GHAP, OAuthProvider } from 'firebase/auth';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
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
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.currentUserSubject.next(user);
    }
  }

  // Email/Password signup with local backend
  signup(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/signup`, { username, email, password })
      .pipe(tap(res => this.setAuth(res)));
  }

  // Email/Password login with local backend
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.setAuth(res)));
  }

  // Firebase email/password signup
  async firebaseSignup(email: string, password: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
    await this.exchangeFirebaseToken(userCredential.user);
  }

  // Firebase email/password login
  async firebaseLogin(email: string, password: string): Promise<void> {
    const userCredential = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
    await this.exchangeFirebaseToken(userCredential.user);
  }

  // OAuth login (Google)
  async googleLogin(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.firebaseAuth, provider);
      await this.exchangeFirebaseToken(result.user);
    } catch (error: any) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // OAuth login (GitHub)
  async githubLogin(): Promise<void> {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(this.firebaseAuth, provider);
      await this.exchangeFirebaseToken(result.user);
    } catch (error: any) {
      // Handle account-exists-with-different-credential error
      if (error.code === 'auth/account-exists-with-different-credential') {
        await this.handleAccountLinking(error);
        return;
      }
      console.error('GitHub login error:', error);
      alert('GitHub login failed. Please try again or use a different sign-in method.');
      throw error;
    }
  }

  // Handle account linking when same email exists with different provider
  private async handleAccountLinking(error: any): Promise<void> {
    try {
      const email = error.customData.email;
      const pendingCred = GithubAuthProvider.credentialFromError(error);
      
      if (!pendingCred) {
        throw new Error('Could not get credential from error');
      }

      // Fetch sign-in methods for the email
      const methods = await fetchSignInMethodsForEmail(this.firebaseAuth, email);
      
      if (methods.length === 0) {
        throw new Error('No existing sign-in methods found for this email');
      }

      // Ask user if they want to sign in with existing provider and link accounts
      const confirmLink = confirm(
        `An account already exists with ${email}.\n\n` +
        `Existing sign-in method: ${methods[0]}\n\n` +
        `Would you like to sign in with ${methods[0]} and link your GitHub account?`
      );

      if (!confirmLink) {
        throw new Error('User cancelled account linking');
      }

      // Sign in with the existing provider (Google)
      let userCredential;
      if (methods[0] === 'google.com') {
        const googleProvider = new GoogleAuthProvider();
        userCredential = await signInWithPopup(this.firebaseAuth, googleProvider);
      } else {
        throw new Error(`Unsupported provider: ${methods[0]}`);
      }

      // Link the pending credential (GitHub)
      // Note: Account linking is disabled by default in Firebase
      // User needs to enable it in Firebase Console
      alert(
        'To link multiple sign-in methods, please enable account linking:\n\n' +
        '1. Go to Firebase Console → Authentication → Settings\n' +
        '2. Enable "Allow creation of multiple accounts with the same email address"\n\n' +
        'For now, you have been signed in with Google. You can use Google to sign in anytime.'
      );

      // Exchange token with backend
      await this.exchangeFirebaseToken(userCredential.user);
      
    } catch (linkError: any) {
      console.error('Account linking error:', linkError);
      alert('Failed to link accounts. Please try signing in with your original provider (Google).');
      throw linkError;
    }
  }

  // Exchange Firebase ID token for backend JWT
  private async exchangeFirebaseToken(user: User): Promise<void> {
    const idToken = await user.getIdToken();
    const res = await this.http.post<AuthResponse>(`${this.apiUrl}/auth/firebase`, { idToken }).toPromise();
    if (res) {
      this.setAuth(res);
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    signOut(this.firebaseAuth);
  }

  // Helper to set auth data
  private setAuth(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Get current user
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
}
