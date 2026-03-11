import { Component } from '@angular/core';

type StepItem = {
  number: string;
  title: string;
  description: string;
};

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.scss',
})
export class HowItWorks {
  steps: StepItem[] = [
    {
      number: '01',
      title: 'Choose Your Service',
      description:
        'Select the cleaning service that matches your home, schedule, and specific needs.',
    },
    {
      number: '02',
      title: 'Book Your Appointment',
      description:
        'Pick a suitable date and time, and confirm your cleaning request in a few simple steps.',
    },
    {
      number: '03',
      title: 'Enjoy a Spotless Space',
      description:
        'Our team arrives on time, handles the cleaning professionally, and leaves your place fresh and clean.',
    },
  ];

  trackByStep(index: number, item: StepItem): string {
    return item.number;
  }
}
