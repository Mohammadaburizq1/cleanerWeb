import { Component } from '@angular/core';
import { ServiceAreaItem } from '../../models/home.models';

@Component({
  selector: 'app-service-area',
  standalone: true,
  templateUrl: './service-area.html',
  styleUrl: './service-area.scss',
})
export class ServiceArea {
  areas: ServiceAreaItem[] = [
    {
      name: 'Louisville',
      description: 'Professional residential and commercial cleaning services across Louisville.',
    },
    {
      name: 'Jeffersontown',
      description: 'Reliable home and business cleaning services in Jeffersontown.',
    },
    {
      name: 'St. Matthews',
      description: 'Detail-focused cleaning for homes and offices in St. Matthews.',
    },
    {
      name: 'Shively',
      description: 'Trusted cleaning solutions for residential and commercial properties in Shively.',
    },
    {
      name: 'Middletown',
      description: 'High-quality cleaning services tailored to your schedule in Middletown.',
    },
    {
      name: 'Lyndon',
      description: 'Efficient and professional cleaning services for homes and offices in Lyndon.',
    },
    {
      name: 'Prospect',
      description: 'Premium cleaning services for modern homes and businesses in Prospect.',
    },
    {
      name: 'Shepherdsville',
      description: 'Flexible scheduling and reliable cleaning services in Shepherdsville.',
    },
    {
      name: 'Hillview',
      description: 'Fast and thorough cleaning services for homes and businesses in Hillview.',
    },
    {
      name: 'New Albany',
      description: 'Professional cleaning services available in New Albany and nearby areas.',
    },
  ];

  trackByName(index: number, item: ServiceAreaItem): string {
    return item.name;
  }
}
