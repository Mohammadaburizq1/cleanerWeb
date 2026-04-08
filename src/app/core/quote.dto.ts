/** POST /api/Quote — matches OpenAPI CreateQuoteDto */
export interface CreateQuoteRequestDto {
  fullName: string;
  phone: string;
  serviceType: string;
  preferredDate: string;
  address: string;
  additionalDetails: string | null;
}

export interface QuoteDto {
  id: string;
  fullName: string;
  phone: string;
  serviceType: string;
  preferredDate: string;
  address: string;
  additionalDetails: string | null;
  createdAt: string;
}
