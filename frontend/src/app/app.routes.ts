import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { HomeComponent } from "./features/home/home.component";
import { LoginComponent } from "./features/auth/login/login.component";
import { ForgotComponent } from "./features/auth/forgot/forgot.component";
import { ResetComponent } from "./features/auth/reset/reset.component";
import { DashboardComponent } from "./features/dashboard/dashboard.component";
import { SettingsComponent } from "./features/dashboard/settings/settings.component";
import { AnalyticsComponent } from "./features/analytics/analytics.component";
import { ProfileComponent } from "./features/profile/profile.component";
import { DemoComponent } from "./features/demo/demo.component";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/home",
    pathMatch: "full",
  },
  {
    path: "home",
    loadComponent: () => HomeComponent,
  },
  {
    path: "login",
    loadComponent: () => LoginComponent,
  },
  {
    path: "signup",
    redirectTo: "/login",
    pathMatch: "full",
  },
  {
    path: "forgot",
    loadComponent: () => ForgotComponent,
  },
  {
    path: "reset-password",
    loadComponent: () => ResetComponent,
  },
  {
    path: "dashboard",
    loadComponent: () => DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: "dashboard/settings",
    loadComponent: () => SettingsComponent,
    canActivate: [authGuard],
  },
  {
    path: "analytics",
    loadComponent: () => AnalyticsComponent,
    canActivate: [authGuard],
  },
  {
    path: "demo",
    loadComponent: () => DemoComponent,
  },
  {
    path: ":username",
    loadComponent: () => ProfileComponent,
  },
];
