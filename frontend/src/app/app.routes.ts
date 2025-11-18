import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SettingsComponent } from './features/dashboard/settings/settings.component';
import { ProfileComponent } from './features/profile/profile.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => HomeComponent
  },
  {
    path: 'login',
    loadComponent: () => LoginComponent
  },
  {
    path: 'signup',
    loadComponent: () => SignupComponent
  },
  {
    path: 'dashboard',
    loadComponent: () => DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard/settings',
    loadComponent: () => SettingsComponent,
    canActivate: [authGuard]
  },
  {
    path: ':username',
    loadComponent: () => ProfileComponent
  }
];
