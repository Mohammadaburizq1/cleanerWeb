export type ServiceItem = {
  icon: string;
  title: string;
  description: string;
};

export type StepItem = {
  number: string;
  title: string;
  description: string;
};

export type TestimonialItem = {
  quote: string;
  name: string;
};

export type TrustBadgeItem = {
  title: string;
  text: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type ServiceAreaItem = {
  name: string;
  description: string;
};

export type GalleryItem = {
  title: string;
  description: string;
  image: string;
};

// Backend payload shape for a "single home endpoint" response.
export type HomePayload = {
  services: ServiceItem[];
  testimonials: TestimonialItem[];
  trustBadges: TrustBadgeItem[];
  faqs: FaqItem[];
  serviceAreas: ServiceAreaItem[];
  gallery: GalleryItem[];
};

