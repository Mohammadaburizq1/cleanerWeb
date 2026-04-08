import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { siteOffersSummariesForPopup } from '../../core/site-offers.data';

/** Shown once per browser session until the visitor closes it */
const OFFERS_POPUP_SESSION_KEY = 'cleanhome-offers-popup-closed';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
export class Home implements OnInit, OnDestroy {
  readonly offersTitle = 'Current offers';
  readonly offersLead = 'Book a standard or deep clean this month and save on your first visit.';
  /** Matches the first items from /offers */
  readonly offersBullets = siteOffersSummariesForPopup(2);

  showOffersPopup = false;

  ngOnInit(): void {
    try {
      if (!sessionStorage.getItem(OFFERS_POPUP_SESSION_KEY)) {
        this.showOffersPopup = true;
        document.body.style.overflow = 'hidden';
      }
    } catch {
      this.showOffersPopup = true;
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showOffersPopup) {
      this.closeOffersPopup();
    }
  }

  closeOffersPopup(): void {
    this.showOffersPopup = false;
    document.body.style.overflow = '';
    try {
      sessionStorage.setItem(OFFERS_POPUP_SESSION_KEY, '1');
    } catch {
      /* private mode */
    }
  }
}
