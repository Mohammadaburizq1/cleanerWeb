import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, joinUrl } from '../../core/api-base-url';
import {
  FaqItem,
  GalleryItem,
  HomePayload,
  ServiceAreaItem,
  ServiceItem,
  TestimonialItem,
  TrustBadgeItem,
} from './models/home.models';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Recommended: backend returns everything needed for the home page in one call.
   * GET /api/home
   */
  getHome(): Observable<HomePayload> {
    return this.http.get<HomePayload>(joinUrl(this.baseUrl, '/api/home'));
  }

  /** GET /api/home/services */
  getServices(): Observable<ServiceItem[]> {
    return this.http.get<ServiceItem[]>(joinUrl(this.baseUrl, '/api/home/services'));
  }

  /** GET /api/home/testimonials */
  getTestimonials(): Observable<TestimonialItem[]> {
    return this.http.get<TestimonialItem[]>(joinUrl(this.baseUrl, '/api/home/testimonials'));
  }

  /** GET /api/home/trust-badges */
  getTrustBadges(): Observable<TrustBadgeItem[]> {
    return this.http.get<TrustBadgeItem[]>(joinUrl(this.baseUrl, '/api/home/trust-badges'));
  }

  /** GET /api/home/faqs */
  getFaqs(): Observable<FaqItem[]> {
    return this.http.get<FaqItem[]>(joinUrl(this.baseUrl, '/api/home/faqs'));
  }

  /** GET /api/home/service-areas */
  getServiceAreas(): Observable<ServiceAreaItem[]> {
    return this.http.get<ServiceAreaItem[]>(joinUrl(this.baseUrl, '/api/home/service-areas'));
  }

  /** GET /api/home/gallery */
  getGallery(): Observable<GalleryItem[]> {
    return this.http.get<GalleryItem[]>(joinUrl(this.baseUrl, '/api/home/gallery'));
  }
}

