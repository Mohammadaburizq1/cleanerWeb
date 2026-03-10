import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';


type ServiceItem = {
  icon: string;
  title: string;
  description: string;
};

type TestimonialItem = {
  quote: string;
  name: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
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
      description:
        'Complete cleaning for relocations, property handovers, and new beginnings.',
    },
    {
      icon: '🧹',
      title: 'Office Cleaning',
      description:
        'Professional cleaning for workspaces that need a polished and reliable appearance.',
    },
  ];

  testimonials: TestimonialItem[] = [
    {
      quote: 'Amazing service. My house looked perfect and the team was very professional.',
      name: 'Sarah M.',
    },
    {
      quote: 'Reliable, clean, and on time. Exactly what I want from a premium service.',
      name: 'David K.',
    },
    {
      quote: 'The deep cleaning was excellent. I would absolutely book again.',
      name: 'Emily R.',
    },
  ];

  trackByTitle(index: number, item: ServiceItem): string {
    return item.title;
  }

  trackByName(index: number, item: TestimonialItem): string {
    return item.name;
  }
}