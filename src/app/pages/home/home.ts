import { Component } from '@angular/core';
import { Hero } from './components/hero/hero';
import { Services } from './components/services/services';
import { WhyUs } from './components/why-us/why-us';
import { HowItWorks } from './components/how-it-works/how-it-works';
import { Testimonials } from './components/testimonials/testimonials';
import { Cta } from './components/cta/cta';
import { TrustBadges } from './components/trust-badges/trust-badges';
import { BookingForm } from './components/booking-form/booking-form';
import { ServiceArea } from './components/service-area/service-area';
import { Faq } from './components/faq/faq';
import { Gallery } from './components/gallery/gallery';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Services,
    WhyUs,
    HowItWorks,
    Testimonials,
    Hero,
    Cta,
    TrustBadges,
    BookingForm,
    Faq,
    ServiceArea,
    Gallery,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
