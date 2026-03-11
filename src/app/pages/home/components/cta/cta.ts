import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cta.html',
  styleUrl: './cta.scss',
})
export class Cta {
  // keep RouterLink in the class so TS doesn't mark the import as unused
  protected readonly routerLink = RouterLink;
}
