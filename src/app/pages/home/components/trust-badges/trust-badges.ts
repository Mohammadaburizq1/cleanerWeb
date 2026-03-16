import { Component } from '@angular/core';
import { TrustBadgeItem } from '../../models/home.models';

@Component({
  selector: 'app-trust-badges',
  standalone: true,
  templateUrl: './trust-badges.html',
  styleUrl: './trust-badges.scss',
})
export class TrustBadges {
  items: TrustBadgeItem[] = [
    {
      title: 'Trusted Professionals',
      text: 'Experienced cleaners focused on quality, detail, and reliability.',
    },
    {
      title: 'Eco-Friendly Products',
      text: 'Safe cleaning products for families, children, and pets.',
    },
    {
      title: 'Flexible Scheduling',
      text: 'Book one-time, weekly, or custom cleaning visits.',
    },
    {
      title: 'Satisfaction Guarantee',
      text: 'If something is missed, we make it right quickly.',
    },
  ];

  trackByTitle(index: number, item: TrustBadgeItem): string {
    return item.title;
  }
}
