import { Component } from '@angular/core';
import { BUSINESS_CONTACT } from '../../../../core/contact.constants';
import { FaqItem } from '../../models/home.models';

@Component({
  selector: 'app-faq',
  imports: [],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class Faq {
  faqs: FaqItem[] = [
    {
      question: 'How long does a cleaning service take?',
      answer:
        'The duration depends on the size of the property and the type of cleaning service. Most standard cleanings take between 2 to 4 hours.',
    },
    {
      question: 'Do I need to be home during the cleaning?',
      answer:
        'No, it is not required. Many clients provide access instructions and return to a freshly cleaned home.',
    },
    {
      question: 'Do you bring cleaning supplies?',
      answer: 'Yes. Our team arrives fully equipped with professional cleaning tools and products.',
    },
    {
      question: 'Are your cleaners insured?',
      answer:
        'Yes. Our cleaning professionals are trained, vetted, and fully insured for your peace of mind.',
    },
    {
      question: 'How do I book a cleaning service?',
      answer: `Book online from this site or reach us at ${BUSINESS_CONTACT.phoneDisplay} or ${BUSINESS_CONTACT.email}.`,
    },
  ];

  trackByQuestion(index: number, item: FaqItem): string {
    return item.question;
  }
}
