import { Component } from '@angular/core';

type GalleryItem = {
  title: string;
  description: string;
  image: string;
};

@Component({
  selector: 'app-gallery',
  standalone: true,
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class Gallery {
  items: GalleryItem[] = [
    {
      title: 'Kitchen Deep Cleaning',
      description: 'Detailed cleaning for kitchen surfaces, cabinets, and appliances.',
      image: '/images/gallery-kitchen-cleaning.jpg',
    },
    {
      title: 'Bathroom Sanitizing',
      description: 'Full bathroom cleaning with attention to tiles, mirrors, and fixtures.',
      image: '/images/gallery-bathroom-cleaning.jpg',
    },
    {
      title: 'Living Room Refresh',
      description: 'Dusting, vacuuming, and surface cleaning for spotless living areas.',
      image: '/images/full-shot-man-cleaning-doorknob.jpg',
    },
    {
      title: 'Office Cleaning',
      description: 'Professional workspace cleaning for a polished and healthy environment.',
      image: '/images/professional-cleaning-service-person-using-vacuum-cleaner-office.jpg',
    },
  ];

  trackByTitle(index: number, item: GalleryItem): string {
    return item.title;
  }
}
