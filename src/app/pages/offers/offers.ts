import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { OfferService } from '../../core/offer.service';
import { OfferDto } from '../../core/offer.dto';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './offers.html',
  styleUrl: './offers.scss',
})
export class Offers implements OnInit {
  private readonly offerService = inject(OfferService);

  /** Active offers from `GET /api/Offer`. */
  offers: OfferDto[] = [];

  loading = true;
  /** Set when the request fails (network, CORS, etc.). */
  loadError: string | null = null;

  ngOnInit(): void {
    this.loading = true;
    this.loadError = null;
    this.offerService
      .listPublicOffers()
      .pipe(
        catchError(() => {
          this.loadError = 'Could not load offers. Check that the API is running and CORS allows this site.';
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe((rows) => {
        this.offers = rows;
      });
  }
}
