import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  imports: [],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services {
  services = [
    {
      title: 'House Cleaning',
      description: 'Complete home cleaning for kitchens, bedrooms, bathrooms, and living areas.',
    },
    {
      title: 'Deep Cleaning',
      description:
        'Detailed cleaning for neglected spaces, seasonal resets, or move-in/move-out needs.',
    },
    {
      title: 'Office Cleaning',
      description:
        'Professional workspace cleaning to keep your office clean, safe, and presentable.',
    },
    {
      title: 'Bathroom Cleaning',
      description: 'Disinfection and deep scrubbing of sinks, toilets, tiles, mirrors, and floors.',
    },
    {
      title: 'Kitchen Cleaning',
      description:
        'Surface sanitizing, appliance exterior cleaning, counters, sinks, and cabinet wipe-down.',
    },
    {
      title: 'Custom Plans',
      description:
        'Flexible cleaning packages based on your schedule, property type, and service needs.',
    },
  ];
}
