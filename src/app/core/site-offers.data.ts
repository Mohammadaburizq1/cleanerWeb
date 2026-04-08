export type SiteOffer = {
  id: string;
  /** Short label on cards */
  title: string;
  /** One-line pitch */
  summary: string;
  /** Extra detail on the offers page */
  detail: string;
  /** Ribbon text e.g. Popular */
  badge?: string;
};

/** All active promotions — shown on /offers and summarized on the home popup */
export const SITE_OFFERS: SiteOffer[] = [
  {
    id: 'first-booking',
    badge: 'New customers',
    title: 'First booking discount',
    summary: 'Save on your first standard or deep clean when you book online or by phone.',
    detail:
      'Mention this offer when you book. Applies to first-time residential customers only; not combinable with other promos unless stated.',
  },
  {
    id: 'bundle-deep-hourly',
    badge: 'Bundle',
    title: 'Deep clean + hourly touch-ups',
    summary: 'Pair a deep clean with flexible hourly visits and get a packaged quote on the Services page.',
    detail:
      'We build your quote from bedrooms, baths, home size, and add-ons. Perfect after a deep clean for upkeep.',
  },
  {
    id: 'seasonal',
    badge: 'Spring',
    title: 'Spring refresh special',
    summary: 'Priority scheduling and upgraded focus on windows & baseboards during peak season.',
    detail: 'Available March–May while slots last. Ask when you book — seasonal surcharge may apply for peak weekends.',
  },
  {
    id: 'referral',
    badge: 'Refer a friend',
    title: 'Referral reward',
    summary: 'Refer a friend who books a full clean — you both receive a credit toward a future visit.',
    detail: 'Credit amount confirmed at booking. Referred customer must complete a paid service; limits apply.',
  },
  {
    id: 'recurring',
    badge: 'Ongoing',
    title: 'Recurring schedule savings',
    summary: 'Weekly or bi-weekly plans include a lower per-visit rate than one-time bookings.',
    detail: 'Ask for a recurring quote; minimum commitment and cancellation terms apply per agreement.',
  },
];

/** First lines for the home popup (session offer modal) */
export function siteOffersSummariesForPopup(max = 2): string[] {
  return SITE_OFFERS.slice(0, max).map((o) => `${o.title}: ${o.summary}`);
}
