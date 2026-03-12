import { Component } from '@angular/core';

type ServiceAreaItem = {
  name: string;
  description: string;
};

@Component({
  selector: 'app-service-area',
  standalone: true,
  templateUrl: './service-area.html',
  styleUrl: './service-area.scss',
})
export class ServiceArea {
  areas: ServiceAreaItem[] = [
    {
      name: 'Amman',
      description: 'Professional residential and office cleaning services across Amman.',
    },
    {
      name: 'Khalda',
      description: 'Reliable home cleaning services for apartments and villas in Khalda.',
    },
    {
      name: 'Abdoun',
      description: 'Premium cleaning services for modern homes and offices in Abdoun.',
    },
    {
      name: 'Sweifieh',
      description: 'Trusted cleaning solutions for businesses and residential properties.',
    },
    {
      name: 'Dabouq',
      description: 'High-quality cleaning services tailored for large homes and villas.',
    },
    {
      name: 'Shmeisani',
      description: 'Efficient and professional cleaning services for offices and apartments.',
    },
  ];

  trackByName(index: number, item: ServiceAreaItem): string {
    return item.name;
  }
}
