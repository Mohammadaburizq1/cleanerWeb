import { Component } from '@angular/core';

type TestimonialItem = {
  quote: string;
  name: string;
};

@Component({
  selector: 'app-testimonials',
  standalone: true,
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss',
})
export class Testimonials {
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

  trackByName(index: number, item: TestimonialItem): string {
    return item.name;
  }
}
