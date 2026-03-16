import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Services } from './pages/services/services';
import { About } from './pages/about/about';
import { Contact } from './pages/contact/contact';
import { Booking } from './pages/booking/booking';
import { Login } from './pages/login/login';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Home',
  },
  {
    path: 'services',
    component: Services,
    title: 'Services',
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
    path: 'admin',
    component: Admin,
    title: 'Admin – Orders',
  },
  {
    path: '**',
    redirectTo: '',
  },
];