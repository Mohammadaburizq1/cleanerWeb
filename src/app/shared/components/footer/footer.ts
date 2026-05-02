import { Component } from '@angular/core';
import { BUSINESS_CONTACT } from '../../../core/contact.constants';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  currentYear = new Date().getFullYear();
  readonly contact = BUSINESS_CONTACT;
}
