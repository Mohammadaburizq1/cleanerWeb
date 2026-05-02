import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Checklist } from './pages/checklist/checklist';
import { About } from './pages/about/about';
import { Contact } from './pages/contact/contact';
import { Booking } from './pages/booking/booking';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { Admin } from './pages/admin/admin';
import { AdminOffers } from './pages/admin-offers/admin-offers';
import { Offers } from './pages/offers/offers';
import { OrderHistoryComponent } from './pages/order-history/order-history';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Home',
  },
  {
    path: 'services',
    redirectTo: 'booking',
    pathMatch: 'full',
  },
  {
    path: 'checklist',
    component: Checklist,
    title: 'Checklist',
  },
  {
    path: 'offers',
    component: Offers,
    title: 'Offers',
  },
  {
    path: 'about',
    component: About,
    title: 'About',
  },
  {
    path: 'contact',
    component: Contact,
    title: 'Contact',
  },
  {
    path: 'booking',
    component: Booking,
    title: 'Booking',
  },
  {
    path: 'login',
    component: Login,
    title: 'Sign in',
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
    title: 'Forgot password',
  },
  {
    path: 'reset-password',
    component: ResetPassword,
    title: 'Reset password',
  },
  {
    path: 'signup',
    component: Signup,
    title: 'Create account',
  },
  {
    path: 'order-history',
    component: OrderHistoryComponent,
    title: 'Order history',
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: Admin,
    title: 'Admin – Bookings',
  },
  {
    path: 'admin/offers',
    component: AdminOffers,
    title: 'Admin – Offers',
  },
  {
    path: '**',
    redirectTo: '',
  },
];