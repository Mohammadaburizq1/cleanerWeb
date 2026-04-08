import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_OFFERS } from '../../core/site-offers.data';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './offers.html',
  styleUrl: './offers.scss',
})
export class Offers {
  readonly offers = SITE_OFFERS;
}
