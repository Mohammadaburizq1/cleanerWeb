import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type ServiceItem = {
  icon: string;
  title: string;
  description: string;
};

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services {
  services: ServiceItem[] = [
    {
      icon: '🏠',
      title: 'Residential Cleaning',
      description:
        'Regular home cleaning that keeps your space fresh, organized, and consistently spotless.',
    },
    {
      icon: '✨',
      title: 'Deep Cleaning',
      description:
        'A detailed top-to-bottom cleaning service for kitchens, bathrooms, floors, and neglected areas.',
    },
    {
      icon: '🚚',
      title: 'Move In / Move Out',
      description: 'Complete cleaning for relocations, property handovers, and new beginnings.',
    },
    {
      icon: '🧹',
      title: 'Office Cleaning',
      description:
        'Professional cleaning for workspaces that need a polished and reliable appearance.',
    },
  ];

  trackByTitle(index: number, item: ServiceItem): string {
    return item.title;
  }
}
