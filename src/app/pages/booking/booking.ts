import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';
import { PaymentsService } from '../../core/payments.service';
import { BookingService } from '../../core/booking.service';
import { CleaningCatalogService } from '../../core/cleaning-catalog.service';
import { SelectedTasksService } from '../../core/selected-tasks.service';
import { homeSqFtTierById, legacySqFtToTierId } from '../../core/services-quote';
import type { ServiceDto } from '../../core/booking.dto';
import { OfferService } from '../../core/offer.service';
import type { OfferDto } from '../../core/offer.dto';
import { loadStripe, type Stripe, type StripeCardElement, type StripeElements } from '@stripe/stripe-js';
import * as L from 'leaflet';
import flatpickr from 'flatpickr';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';

/** Tasks selected on the Services checklist and passed via router state */
export type SelectedTask = { sectionTitle: string; task: string };

/** Shown in the post-booking feedback dialog (snapshot before form reset). */
export type BookingFeedbackPropertySnapshot = {
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string;
  isHourly: boolean;
  cleaners: number | null;
  hours: number | null;
  hasPets: boolean;
  homeSizeLabel: string | null;
};

/** Nominatim reverse JSON (subset). https://nominatim.org/release-docs/develop/api/Reverse/ */
interface NominatimReverseAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: NominatimReverseAddress;
}

/** Text address or a pin on the map (lat/lng) — at least one required. */
function bookingLocationValidator(group: AbstractControl): ValidationErrors | null {
  const addr = (group.get('address')?.value ?? '').toString().trim();
  const lat = (group.get('mapLat')?.value ?? '').toString().trim();
  const lng = (group.get('mapLng')?.value ?? '').toString().trim();
  if (addr.length >= 3 || (lat.length > 0 && lng.length > 0)) return null;
  return { locationRequired: true };
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class Booking implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private offerService = inject(OfferService);
  private selectedTasksService = inject(SelectedTasksService);
  private paymentsService = inject(PaymentsService);
  private bookingService = inject(BookingService);
  private catalogService = inject(CleaningCatalogService);
  private ngZone = inject(NgZone);

  // NOTE: Put your Stripe publishable key here (pk_...). Never put the secret key in the frontend.
  private readonly stripePublishableKey = 'pk_test_51TK1xVRykzBb9Zc11JSb6OI928pjU6S6MGEbL0XTA2VRDrlXYs7kR4t5rEVv8SSdLHQuv3l2cpCkP9isqlQku4dp00UhF9fQxg';

  @ViewChild('stripeCardMount', { static: false })
  private stripeCardMount?: ElementRef<HTMLDivElement>;

  @ViewChild('mapContainer', { static: false })
  private mapContainer?: ElementRef<HTMLDivElement>;

  @ViewChild('fpDateTime', { static: false })
  private fpDateTime?: ElementRef<HTMLInputElement>;

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  cardElementError: string | null = null;
  stripeReady = false;
  cardComplete = false;

  /** Leaflet + OpenStreetMap (no API key). Coordinates go to the form only after «Confirm location». */
  mapReady = false;
  mapError: string | null = null;
  geoLoading = false;
  geoError: string | null = null;
  reverseGeocodeLoading = false;
  geocodeError: string | null = null;
  /** True after user taps Confirm; reset when marker moves. */
  locationConfirmed = false;
  /** When true, `address` was filled from Nominatim — clear it if the pin moves. */
  private addressFromGeocode = false;
  private leafletMap: L.Map | null = null;
  private leafletMarker: L.Marker | null = null;

  /**
   * Count of non-cancelled bookings per calendar day (local YYYY-MM-DD).
   * Days with this many or more are disabled in the picker.
   */
  private readonly bookingsCountByDay = new Map<string, number>();
  readonly maxBookingsPerDay = 4;
  /** True when GET /api/Booking failed (e.g. auth); calendar cannot show capacity. */
  takenDatesUnavailable = false;
  private fpInstance: FlatpickrInstance | null = null;
  private takenDatesLoadPromise: Promise<void> = Promise.resolve();

  /** Tasks chosen on the Services page (from "Book Now" with checkboxes) */
  selectedTasks: SelectedTask[] = [];
  /** Number of rooms from Services page */
  numberOfRooms: number | null = null;
  /** Number of bedrooms from Services page */
  numberOfBedrooms: number | null = null;
  /** Number of bathrooms from Services page */
  numberOfBathrooms: number | null = null;
  /** Number of cleaners (hourly service) */
  numberOfCleaners: number | null = null;
  /** Duration in hours (hourly service) */
  hourlyDurationHours: number | null = null;
  /** Pets in the home (from Services Step 1) */
  hasPets = false;
  /** Home size tier id (from Services Step 1) */
  homeSqFtTierId: string | null = null;
  /** Estimated cost from Services page (from selected sections + rooms or hourly) */
  estimatedCost: number | null = null;
  currency = 'JD';
  /** Currency code for backend/payment (ISO 3 letters). */
  private readonly paymentCurrency = 'usd';
  /** Cost breakdown / receipt lines (from Services page) */
  selectedSectionsWithPrices: { title: string; taskCount?: number; pricePerTask?: number; amount: number }[] = [];

  /** Active offers from GET /api/Offer — optional promo on this booking */
  availableOffers: OfferDto[] = [];
  /** Selected offer id, or null for no promo */
  selectedOfferId: string | null = null;

  /** Sales tax rate (e.g. 0.06 = 6%). Set to 0 if no tax. */
  readonly salesTaxRate = 0.06;

  bookingForm = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.email]],
      propertyType: ['', Validators.required],
      address: [''],
      mapLat: [''],
      mapLng: [''],
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required],
      cardHolder: ['', [Validators.required, Validators.minLength(2)]],
      notes: [''],
    },
    { validators: bookingLocationValidator },
  );

  submitted = false;
  sending = false;
  errorMessage = '';

  showBookingFeedbackDialog = false;
  bookingFeedbackPercent: number | null = null;
  bookingFeedbackSubmitted = false;
  bookingFeedbackCardInfo: { holder: string; maskedNumber: string; expiry: string } | null = null;

  /** Snapshot of selected services shown inside the feedback dialog */
  bookingFeedbackSelectedSectionsWithPrices: { title: string; taskCount?: number; pricePerTask?: number; amount: number }[] =
    [];

  /** Snapshot of home / property details for the feedback dialog */
  bookingFeedbackProperty: BookingFeedbackPropertySnapshot | null = null;

  ngOnInit(): void {
    const state = history.state as {
      selectedTasks?: SelectedTask[];
      numberOfRooms?: number | null;
      numberOfBedrooms?: number | null;
      numberOfBathrooms?: number | null;
      numberOfCleaners?: number | null;
      hourlyDurationHours?: number | null;
      hasPets?: boolean;
      homeSqFtTierId?: string | null;
      homeAreaSqFt?: number | null;
      estimatedCost?: number | null;
      currency?: string;
      selectedSectionsWithPrices?: { title: string; taskCount?: number; pricePerTask?: number; amount: number }[];
    } | undefined;
    const nav = history.state as typeof state | undefined;
    const fromRouter = nav != null && typeof nav === 'object' && ('estimatedCost' in nav || 'selectedTasks' in nav);

    this.selectedTasks =
      fromRouter && Array.isArray(nav.selectedTasks)
        ? nav.selectedTasks
        : this.selectedTasksService.getSelectedTasks();
    this.numberOfRooms =
      fromRouter && nav.numberOfRooms !== undefined ? nav.numberOfRooms : this.selectedTasksService.getNumberOfRooms();
    this.numberOfBedrooms =
      fromRouter && nav.numberOfBedrooms !== undefined && nav.numberOfBedrooms !== null
        ? nav.numberOfBedrooms
        : this.selectedTasksService.getNumberOfBedrooms();
    this.numberOfBathrooms =
      fromRouter && nav.numberOfBathrooms !== undefined && nav.numberOfBathrooms !== null
        ? nav.numberOfBathrooms
        : this.selectedTasksService.getNumberOfBathrooms();
    this.numberOfCleaners =
      fromRouter && nav.numberOfCleaners !== undefined && nav.numberOfCleaners !== null
        ? nav.numberOfCleaners
        : this.selectedTasksService.getNumberOfCleaners();
    this.hourlyDurationHours =
      fromRouter && nav.hourlyDurationHours !== undefined && nav.hourlyDurationHours !== null
        ? nav.hourlyDurationHours
        : this.selectedTasksService.getHourlyDurationHours();
    if (fromRouter && nav.hasPets !== undefined) {
      this.hasPets = nav.hasPets === true;
    } else {
      this.hasPets = this.selectedTasksService.getHasPets();
    }
    if (fromRouter && nav.homeSqFtTierId !== undefined) {
      const id = nav.homeSqFtTierId;
      this.homeSqFtTierId = typeof id === 'string' && id.length > 0 ? id : null;
    } else if (fromRouter && nav.homeAreaSqFt !== undefined) {
      this.homeSqFtTierId =
        typeof nav.homeAreaSqFt === 'number' && nav.homeAreaSqFt >= 0
          ? legacySqFtToTierId(Math.floor(nav.homeAreaSqFt))
          : null;
    } else {
      this.homeSqFtTierId = this.selectedTasksService.getHomeSqFtTierId();
    }
    this.estimatedCost =
      fromRouter && typeof nav.estimatedCost === 'number'
        ? nav.estimatedCost
        : this.selectedTasksService.getEstimatedCost();
    this.currency = fromRouter && nav.currency ? nav.currency : 'JD';
    this.selectedSectionsWithPrices =
      fromRouter && Array.isArray(nav.selectedSectionsWithPrices)
        ? nav.selectedSectionsWithPrices
        : this.selectedTasksService.getSelectedSectionsWithPrices();
    this.takenDatesLoadPromise = this.loadTakenBookingDates();

    this.offerService
      .listPublicOffers()
      .pipe(catchError(() => of([])))
      .subscribe((rows) => {
        this.availableOffers = rows;
        const q = this.route.snapshot.queryParamMap.get('offer');
        if (q && rows.some((r) => r.id === q)) {
          this.selectedOfferId = q;
        }
      });
  }

  /** Currently selected promotional offer (if any). */
  get selectedOffer(): OfferDto | null {
    if (!this.selectedOfferId) return null;
    return this.availableOffers.find((o) => o.id === this.selectedOfferId) ?? null;
  }

  /** Discount rate 0–100 from selected offer. */
  get offerDiscountPercent(): number {
    const o = this.selectedOffer;
    const p = o?.discountPercent;
    if (p == null || p <= 0) return 0;
    return Math.min(100, p);
  }

  /** Discount amount applied to sub-total (before tax). */
  get discountAmount(): number {
    if (this.offerDiscountPercent <= 0) return 0;
    const raw = this.subTotal * (this.offerDiscountPercent / 100);
    return Math.round(raw * 100) / 100;
  }

  /** Sub-total after promo discount (before tax). */
  get subTotalAfterDiscount(): number {
    return Math.max(0, Math.round((this.subTotal - this.discountAmount) * 100) / 100);
  }

  onOfferSelectChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.selectedOfferId = v ? v : null;
  }

  /** Total row label — shows DiscountPercent when a promo applies. */
  get totalLineLabel(): string {
    if (this.offerDiscountPercent <= 0) return 'TOTAL';
    return `TOTAL (includes ${this.offerDiscountPercent}% DiscountPercent)`;
  }

  /** Selected offer full description (`detail`) for the booking summary. */
  get selectedOfferDescription(): string {
    const d = this.selectedOffer?.detail?.trim();
    return d ?? '';
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initStripe();
    await this.takenDatesLoadPromise;
    queueMicrotask(() => this.initLeafletMap());
    this.initFlatpickr();
  }

  /** Loads existing bookings so calendar days at capacity are not selectable. */
  private loadTakenBookingDates(): Promise<void> {
    return firstValueFrom(this.bookingService.listBookings())
      .then((list) => {
        this.bookingsCountByDay.clear();
        for (const b of list) {
          if (this.isBookingCancelled(b.status)) continue;
          const key = this.isoToLocalDateKey(b.date);
          if (key) this.bookingsCountByDay.set(key, (this.bookingsCountByDay.get(key) ?? 0) + 1);
        }
        this.takenDatesUnavailable = false;
      })
      .catch(() => {
        this.takenDatesUnavailable = true;
      });
  }

  private bookingCountForDay(ymd: string): number {
    return this.bookingsCountByDay.get(ymd) ?? 0;
  }

  private isDayFullyBooked(ymd: string): boolean {
    return this.bookingCountForDay(ymd) >= this.maxBookingsPerDay;
  }

  private isBookingCancelled(status: string): boolean {
    return /cancel/i.test((status ?? '').trim());
  }

  private isoToLocalDateKey(iso: string): string | null {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return this.dateToYmd(d);
  }

  private dateToYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private initFlatpickr(): void {
    const el = this.fpDateTime?.nativeElement;
    if (!el) return;

    this.fpInstance?.destroy();

    const fullyBookedTooltip = 'Fully booked today';

    this.fpInstance = flatpickr(el, {
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      time_24hr: true,
      minDate: 'today',
      disable: [(d: Date) => this.isDayFullyBooked(this.dateToYmd(d))],
      onDayCreate: (_dates, _dateStr, _instance, dayElem) => {
        if (!dayElem) return;
        const elSpan = dayElem as HTMLSpanElement & { dateObj?: Date };
        const dateObj = elSpan.dateObj;
        if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return;
        const key = this.dateToYmd(dateObj);
        if (!this.isDayFullyBooked(key)) return;
        elSpan.setAttribute('title', fullyBookedTooltip);
        const a11y = elSpan.getAttribute('aria-label') ?? '';
        if (!/\bfully booked\b/i.test(a11y)) {
          elSpan.setAttribute('aria-label', `${a11y}. ${fullyBookedTooltip}`);
        }
      },
      onChange: (selectedDates) => {
        if (!selectedDates.length) {
          this.ngZone.run(() => {
            this.bookingForm.patchValue({ preferredDate: '', preferredTime: '' });
          });
          return;
        }
        const d = selectedDates[0];
        const datePart = this.dateToYmd(d);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const timePart = `${hh}:${mm}`;
        this.ngZone.run(() => {
          this.bookingForm.patchValue({ preferredDate: datePart, preferredTime: timePart });
        });
      },
    });

    const pd = (this.bookingForm.get('preferredDate')?.value ?? '').toString().trim();
    const pt = (this.bookingForm.get('preferredTime')?.value ?? '').toString().trim();
    if (pd && pt) {
      const tNorm = pt.length === 5 ? `${pt}:00` : pt;
      const combined = new Date(`${pd}T${tNorm}`);
      if (!isNaN(combined.getTime())) {
        this.fpInstance.setDate(combined, false);
      }
    }
  }

  private async initStripe(): Promise<void> {
    if (!this.stripePublishableKey) return;
    if (!this.stripeCardMount) return;

    const stripe = await loadStripe(this.stripePublishableKey);
    if (!stripe) {
      this.cardElementError = 'Stripe failed to load. Check your publishable key.';
      return;
    }

    this.stripe = stripe;
    this.elements = stripe.elements();

    const card = this.elements.create('card', {
      hidePostalCode: true,
    });

    card.mount(this.stripeCardMount.nativeElement);

    card.on('change', (event) => {
      this.cardElementError = event.error?.message ?? null;
      this.cardComplete = event.complete;
    });

    this.cardElement = card;
    this.stripeReady = true;
  }

  private initLeafletMap(): void {
    const el = this.mapContainer?.nativeElement;
    if (!el) return;

    this.mapError = null;

    L.Icon.Default.mergeOptions({
      iconUrl: '/leaflet-images/marker-icon.png',
      iconRetinaUrl: '/leaflet-images/marker-icon-2x.png',
      shadowUrl: '/leaflet-images/marker-shadow.png',
    });

    const defaultCenter = L.latLng(38.2527, -85.7585);
    const map = L.map(el, { scrollWheelZoom: true }).setView(defaultCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(defaultCenter, { draggable: true }).addTo(map);

    this.leafletMap = map;
    this.leafletMarker = marker;

    const onMarkerMoved = () => {
      this.ngZone.run(() => {
        this.locationConfirmed = false;
        this.geocodeError = null;
        const patch: { mapLat: string; mapLng: string; address?: string } = {
          mapLat: '',
          mapLng: '',
        };
        if (this.addressFromGeocode) {
          patch.address = '';
          this.addressFromGeocode = false;
        }
        this.bookingForm.patchValue(patch);
      });
    };

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      map.panTo(e.latlng);
      onMarkerMoved();
    });

    marker.on('dragend', () => onMarkerMoved());

    this.mapReady = true;
    queueMicrotask(() => map.invalidateSize());
  }

  /** Move pin to the same default as init; clear confirmation flags (after successful booking). */
  private resetMapToDefaultState(): void {
    this.locationConfirmed = false;
    this.addressFromGeocode = false;
    const defaultCenter = L.latLng(38.2527, -85.7585);
    this.leafletMarker?.setLatLng(defaultCenter);
    this.leafletMap?.setView(defaultCenter, 13);
    queueMicrotask(() => this.leafletMap?.invalidateSize());
  }

  useMyLocation(): void {
    this.geoError = null;
    if (!this.leafletMap || !this.leafletMarker) return;
    if (!navigator.geolocation) {
      this.geoError = 'Geolocation is not supported in this browser.';
      return;
    }
    this.geoLoading = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        this.ngZone.run(() => {
          this.geoLoading = false;
          this.leafletMap?.flyTo(latlng, 16);
          this.leafletMarker?.setLatLng(latlng);
          this.locationConfirmed = false;
          this.geocodeError = null;
          const geoPatch: { mapLat: string; mapLng: string; address?: string } = {
            mapLat: '',
            mapLng: '',
          };
          if (this.addressFromGeocode) {
            geoPatch.address = '';
            this.addressFromGeocode = false;
          }
          this.bookingForm.patchValue(geoPatch);
        });
      },
      (err: GeolocationPositionError) => {
        this.ngZone.run(() => {
          this.geoLoading = false;
          this.geoError =
            err.code === 1
              ? 'Location permission denied. Allow location access or place the pin manually.'
              : 'Could not get your position. Move the map and pin manually.';
        });
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  async confirmLocation(): Promise<void> {
    if (!this.leafletMarker) return;
    const ll = this.leafletMarker.getLatLng();
    const latN = ll.lat;
    const lngN = ll.lng;
    const lat = latN.toFixed(6);
    const lng = lngN.toFixed(6);

    this.reverseGeocodeLoading = true;
    this.geocodeError = null;

    const patch: { mapLat: string; mapLng: string; address?: string } = {
      mapLat: lat,
      mapLng: lng,
    };

    try {
      const street = await this.reverseGeocodeStreetEnglish(latN, lngN);
      if (street) {
        patch.address = street;
        this.addressFromGeocode = true;
      }
    } catch {
      this.geocodeError = 'Street lookup failed. Coordinates are saved — add details in the address field if needed.';
    }

    this.ngZone.run(() => {
      this.bookingForm.patchValue(patch);
      this.locationConfirmed = true;
      this.reverseGeocodeLoading = false;
      this.bookingForm.updateValueAndValidity();
    });
  }

  /**
   * OpenStreetMap Nominatim (free). Use only for low traffic; see usage policy.
   * English preferred via accept-language.
   */
  private async reverseGeocodeStreetEnglish(lat: number, lon: number): Promise<string | null> {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'jsonv2',
      'accept-language': 'en',
    });
    const url = `https://nominatim.openstreetmap.org/reverse?${params}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimReverseResponse;
    const line = this.formatNominatimAddressLine(data);
    return line.length >= 3 ? line : null;
  }

  private formatNominatimAddressLine(data: NominatimReverseResponse): string {
    const a = data.address;
    if (!a) return (data.display_name ?? '').trim();

    const streetParts: string[] = [];
    if (a.house_number && a.road) streetParts.push(`${a.house_number} ${a.road}`);
    else if (a.road) streetParts.push(a.road);
    else if (a.pedestrian) streetParts.push(a.pedestrian);
    else if (a.footway) streetParts.push(a.footway);
    else if (a.path) streetParts.push(a.path);

    const streetLine = streetParts.join(' ');

    const locality = a.suburb ?? a.neighbourhood ?? a.village ?? a.town ?? a.city ?? '';
    const tailParts = [locality, a.state, a.postcode].filter(Boolean);

    const primary = [streetLine, tailParts.join(', ')].filter((x) => x.length > 0).join(', ');
    if (primary.length >= 5) return primary;
    return (data.display_name ?? primary).trim();
  }

  /** Current pin (preview); may differ from confirmed until user taps Confirm. */
  get pinPreviewLabel(): string {
    if (!this.leafletMarker) return '';
    const ll = this.leafletMarker.getLatLng();
    return `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;
  }

  /** Confirmed coordinates (sent to backend). */
  get mapPinLabel(): string {
    const lat = (this.bookingForm.get('mapLat')?.value ?? '').toString().trim();
    const lng = (this.bookingForm.get('mapLng')?.value ?? '').toString().trim();
    if (!lat || !lng) return '';
    return `${lat}, ${lng}`;
  }

  ngOnDestroy(): void {
    try {
      this.cardElement?.unmount();
    } catch {
      // ignore
    }
    this.fpInstance?.destroy();
    this.fpInstance = null;
    this.leafletMap?.remove();
    this.leafletMap = null;
    this.leafletMarker = null;
  }

  private async createPaymentMethod(): Promise<{
    paymentMethodId: string;
    last4: string;
    expiryMMYY: string;
  }> {
    if (!this.stripe || !this.cardElement) {
      throw new Error('Stripe is not ready yet.');
    }

    const cardHolder = (this.bookingForm.get('cardHolder')?.value ?? '').trim();

    const result = await this.stripe.createPaymentMethod({
      type: 'card',
      card: this.cardElement,
      billing_details: {
        name: cardHolder,
      },
    });

    if (result.error) {
      throw new Error(result.error.message ?? 'Failed to create payment method.');
    }

    const paymentMethodId = result.paymentMethod?.id;
    const last4 = result.paymentMethod?.card?.last4;
    const expMonth = result.paymentMethod?.card?.exp_month;
    const expYear = result.paymentMethod?.card?.exp_year;

    if (!paymentMethodId || !last4 || !expMonth || !expYear) {
      throw new Error('Stripe did not return card details.');
    }

    const expiryMMYY = `${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}`;

    return { paymentMethodId, last4, expiryMMYY };
  }

  async submit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';
    this.showBookingFeedbackDialog = false;
    this.bookingFeedbackPercent = null;
    this.bookingFeedbackSubmitted = false;
    this.bookingFeedbackSelectedSectionsWithPrices = [];
    this.bookingFeedbackCardInfo = null;
    this.bookingFeedbackProperty = null;

    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.scrollToFirstFormError();
      return;
    }

    if (this.total <= 0) {
      void this.router.navigate(['/services'], {
        state: {
          bookingRedirectReason:
            'Your booking total must be greater than zero. Build a quote on Services (Step 1 and any add-ons), then tap Book again.',
        },
      });
      return;
    }

    if (!this.cardComplete) {
      this.setSubmitError(
        this.cardElementError ??
          'Please complete the card (including expiry). Card details must show as complete before submit.',
      );
      return;
    }

    this.sending = true;

    let phase = 'Loading services';

    try {
      const payload = this.bookingForm.getRawValue() as {
        fullName: string;
        phone: string;
        email: string;
        propertyType: string;
        address: string;
        mapLat: string;
        mapLng: string;
        preferredDate: string;
        preferredTime: string;
        cardHolder: string;
        notes: string;
      };

      const sectionsSnapshot = this.selectedSectionsWithPrices.map((s) => ({ ...s }));

      const services = await firstValueFrom(this.catalogService.getServices());
      const serviceId = this.defaultServiceId(services);
      const bookingDateIso = this.toBookingDateIso(payload.preferredDate ?? '', payload.preferredTime ?? '');
      const bookingNotes = this.buildBookingNotes(payload);
      const addressLine = this.resolveServiceAddress(payload);

      phase = 'Creating booking';
      const createdBooking = await firstValueFrom(
        this.bookingService.createBooking({
          serviceId,
          date: bookingDateIso,
          address: addressLine,
          notes: bookingNotes,
        }),
      );
      if (!createdBooking.id) {
        throw new Error('Server returned no booking id after POST /api/Booking.');
      }
      console.log('[Booking] created booking id:', createdBooking.id);

      // 1) Create pm_... on frontend using Stripe Elements
      const pm = await this.createPaymentMethod();

      phase = 'Creating payment';
      // 2) Create a Stripe payment intent on backend (OpenAPI CreatePaymentRequest)
      const createPaymentBody = {
        provider: 'stripe',
        currency: this.paymentCurrency,
        amount: this.total,
        paymentMethodToken: pm.paymentMethodId,
        bookingId: createdBooking.id,
      };

      const createPaymentResp = await firstValueFrom(
        this.paymentsService.createPayment(createPaymentBody),
      );

      const providerPaymentId = createPaymentResp.providerPaymentId;
      if (!providerPaymentId) throw new Error('Backend did not return providerPaymentId for Stripe.');

      // 3) Confirm payment on backend using pm_...
      console.log('[PaymentsService.confirmStripePayment] providerPaymentId:', providerPaymentId);
      console.log('[PaymentsService.confirmStripePayment] paymentMethodId:', pm.paymentMethodId);
      await firstValueFrom(this.paymentsService.confirmStripePayment(providerPaymentId, pm.paymentMethodId));

      const bookedDay = (payload.preferredDate ?? '').trim();

      const tier = homeSqFtTierById(this.homeSqFtTierId);
      const bedsSnap = this.numberOfBedrooms;
      const feedbackPropertySnapshot: BookingFeedbackPropertySnapshot = {
        bedrooms: bedsSnap,
        bathrooms: this.numberOfBathrooms,
        propertyType: (payload.propertyType ?? '').trim(),
        isHourly: (bedsSnap ?? 0) <= 0,
        cleaners: this.numberOfCleaners,
        hours: this.hourlyDurationHours,
        hasPets: this.hasPets,
        homeSizeLabel: tier?.label ?? null,
      };

      // Stripe / HTTP callbacks can run outside NgZone — run UI updates inside the zone so the feedback dialog renders.
      this.ngZone.run(() => {
        this.bookingForm.reset();
        this.bookingForm.updateValueAndValidity({ emitEvent: false });
        if (bookedDay) {
          this.bookingsCountByDay.set(bookedDay, (this.bookingsCountByDay.get(bookedDay) ?? 0) + 1);
        }
        this.fpInstance?.clear();
        this.fpInstance?.destroy();
        this.fpInstance = null;
        this.initFlatpickr();
        this.submitted = false;
        this.selectedTasksService.clearAll();
        this.selectedTasks = [];
        this.numberOfRooms = null;
        this.numberOfBedrooms = null;
        this.numberOfBathrooms = null;
        this.numberOfCleaners = null;
        this.hourlyDurationHours = null;
        this.hasPets = false;
        this.homeSqFtTierId = null;
        this.estimatedCost = null;
        this.selectedSectionsWithPrices = [];

        try {
          this.cardElement?.clear();
        } catch {
          /* ignore */
        }
        this.cardComplete = false;
        this.cardElementError = null;
        this.geoLoading = false;
        this.geoError = null;
        this.reverseGeocodeLoading = false;
        this.geocodeError = null;
        this.mapError = null;
        this.resetMapToDefaultState();

        this.bookingFeedbackSelectedSectionsWithPrices = sectionsSnapshot;
        this.bookingFeedbackProperty = feedbackPropertySnapshot;
        this.bookingFeedbackCardInfo = {
          holder: (payload.cardHolder ?? '').trim(),
          maskedNumber: `**** **** **** ${pm.last4}`,
          expiry: pm.expiryMMYY,
        };

        this.showBookingFeedbackDialog = true;
        this.bookingFeedbackPercent = 100;
        this.bookingFeedbackSubmitted = false;
      });
    } catch (err) {
      console.log('[Booking.submit] phase:', phase, 'error:', err);
      let detail = this.httpErrorDetail(err);
      let message = `${phase}: ${detail}`;
      if (phase === 'Creating payment' || phase === 'Confirming payment') {
        message +=
          ' If payment failed, your booking may still exist — check Admin “GET /api/Booking” or Swagger.';
      }
      this.setSubmitError(message);
    } finally {
      this.sending = false;
    }
  }

  get f() {
    return this.bookingForm.controls;
  }

  private setSubmitError(message: string): void {
    this.errorMessage = message;
    queueMicrotask(() => {
      document
        .querySelector('.booking-page .alert-error')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private scrollToFirstFormError(): void {
    queueMicrotask(() => {
      document
        .querySelector('.booking-page .booking-card .error')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private httpErrorDetail(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object' && body !== null && 'errors' in body) {
        return JSON.stringify((body as { errors: unknown }).errors);
      }
      if (typeof body === 'string' && body.length > 0) {
        return body;
      }
      if (body && typeof body === 'object') {
        return JSON.stringify(body);
      }
      return `${err.status} ${err.statusText || ''}`.trim();
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Request failed.';
  }

  /** Sub-total from selected services (before tax) */
  get subTotal(): number {
    return this.estimatedCost ?? 0;
  }

  /** Sales tax on discounted sub-total */
  get salesTax(): number {
    return Math.round(this.subTotalAfterDiscount * this.salesTaxRate * 100) / 100;
  }

  /** Total after discount and tax */
  get total(): number {
    return Math.round((this.subTotalAfterDiscount + this.salesTax) * 100) / 100;
  }

  /** Label for property/rooms (e.g. "2 Bedrooms, 1 Bathroom") */
  get propertyLabel(): string {
    const beds = this.numberOfBedrooms ?? 0;
    let base: string;
    if (beds <= 0) {
      const cleaners = this.numberOfCleaners ?? 1;
      const hours = this.hourlyDurationHours ?? 0;
      base =
        hours <= 0
          ? 'Hourly Service'
          : `Hourly Service · ${cleaners} Cleaner${cleaners === 1 ? '' : 's'} · ${hours} Hours`;
    } else {
      const baths = this.numberOfBathrooms ?? 0;
      const parts: string[] = [];
      if (beds > 0) parts.push(`${beds} Bedroom${beds === 1 ? '' : 's'}`);
      if (baths > 0) parts.push(`${baths} Bathroom${baths === 1 ? '' : 's'}`);
      base = parts.join(', ') || 'Choose property...';
    }
    const extra: string[] = [];
    const tier = homeSqFtTierById(this.homeSqFtTierId);
    if (tier) extra.push(tier.label);
    if (this.hasPets) extra.push('Pets in home');
    return extra.length ? `${base} · ${extra.join(' · ')}` : base;
  }

  setBookingFeedbackPercent(value: number): void {
    this.bookingFeedbackPercent = Math.max(0, Math.min(100, value));
  }

  confirmBookingFeedback(): void {
    this.bookingFeedbackSubmitted = true;
  }

  closeBookingFeedbackDialog(): void {
    this.showBookingFeedbackDialog = false;
    this.bookingFeedbackProperty = null;
  }

  /** Close the success dialog and open the Services page (e.g. book again). */
  goToServicesFromFeedback(): void {
    this.showBookingFeedbackDialog = false;
    this.bookingFeedbackProperty = null;
    void this.router.navigate(['/services']);
  }

  /** Backend booking uses one catalog row; default to first service from GET /api/Service. */
  private defaultServiceId(services: ServiceDto[]): string {
    if (!services.length) {
      throw new Error('No services from GET /api/Service. Seed services in the backend.');
    }
    return services[0].id;
  }

  private toBookingDateIso(date: string, time: string): string {
    let t = (time ?? '').trim();
    if (!t) t = '09:00';
    if (t.length === 5 && t.includes(':')) t = `${t}:00`;
    const d = new Date(`${date}T${t}`);
    if (isNaN(d.getTime())) throw new Error('Invalid preferred date or time.');
    return d.toISOString();
  }

  /** Street text if present; otherwise coordinates from the map pin. */
  private resolveServiceAddress(payload: {
    address: string;
    mapLat: string;
    mapLng: string;
  }): string {
    const addr = (payload.address ?? '').trim();
    if (addr.length >= 3) return addr;
    const lat = (payload.mapLat ?? '').trim();
    const lng = (payload.mapLng ?? '').trim();
    if (lat && lng) return `Map location: ${lat}, ${lng}`;
    return '';
  }

  private buildBookingNotes(payload: {
    fullName: string;
    phone: string;
    email: string;
    propertyType: string;
    notes: string;
    mapLat?: string;
    mapLng?: string;
  }): string | null {
    const lines: string[] = [
      `Guest / full name: ${(payload.fullName ?? '').trim()}`,
      `Phone: ${(payload.phone ?? '').trim()}`,
      (payload.email ?? '').trim() ? `Email: ${(payload.email ?? '').trim()}` : '',
      `Property type: ${payload.propertyType ?? ''}`,
    ];
    const lat = (payload.mapLat ?? '').trim();
    const lng = (payload.mapLng ?? '').trim();
    if (lat && lng) lines.push(`Map pin (lat, lng): ${lat}, ${lng}`);
    if (this.selectedTasks.length) {
      lines.push(
        `Selected tasks: ${this.selectedTasks.map((x) => `${x.sectionTitle}: ${x.task}`).join('; ')}`,
      );
    }
    const tierNote = homeSqFtTierById(this.homeSqFtTierId);
    if (tierNote) {
      lines.push(`Home size (sq ft range): ${tierNote.label}`);
    }
    if (this.hasPets) {
      lines.push('Pets in home: yes');
    }
    const offer = this.selectedOffer;
    if (offer && this.offerDiscountPercent > 0) {
      lines.push(`DiscountPercent: ${this.offerDiscountPercent}`);
      lines.push(`Promotional offer: ${offer.title} (offerId=${offer.id})`);
      lines.push(
        `Discount amount on sub-total: -${this.discountAmount.toFixed(2)} ${this.currency}; sub-total after discount: ${this.subTotalAfterDiscount.toFixed(2)} ${this.currency}`,
      );
      lines.push(`Total due (incl. tax): ${this.total.toFixed(2)} ${this.currency}`);
      const desc = offer.detail?.trim();
      if (desc) {
        lines.push(`Offer description: ${desc}`);
      }
    }
    const extra = (payload.notes ?? '').trim();
    if (extra) lines.push(`Notes: ${extra}`);
    const text = lines.filter(Boolean).join('\n');
    return text || null;
  }

  get bookingFeedbackHeadline(): string {
    const p = this.bookingFeedbackPercent ?? 100;
    return p >= 50 ? `${p}% Happy` : `${100 - p}% Sad`;
  }

  get bookingFeedbackEmoji(): string {
    const p = this.bookingFeedbackPercent ?? 100;
    if (p >= 90) return '😄';
    if (p >= 70) return '🙂';
    if (p >= 50) return '😊';
    if (p >= 30) return '😐';
    if (p >= 10) return '🙁';
    return '😢';
  }

  /** Service date for summary (formatted or placeholder) */
  get serviceDateLabel(): string {
    const dStr = this.bookingForm.get('preferredDate')?.value;
    const tStr = this.bookingForm.get('preferredTime')?.value;
    if (!dStr) return 'Choose service date & time...';
    const tNorm = tStr && String(tStr).length === 5 ? `${tStr}:00` : tStr;
    const combined = tNorm ? `${dStr}T${tNorm}` : dStr;
    const date = new Date(combined);
    if (isNaN(date.getTime())) return 'Choose service date & time...';
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
