/**
 * Booking `notes` from checkout are often a multi-line blob.
 * Extract readable fragments for Order History.
 */
export interface ParsedBookingNotes {
  serviceType: string | null;
  schedule: string | null;
  tasks: string | null;
  homeSize: string | null;
  totalLine: string | null;
  extraNotes: string | null;
}

export function parseBookingNotesForDisplay(notes: string | null | undefined): ParsedBookingNotes {
  const empty: ParsedBookingNotes = {
    serviceType: null,
    schedule: null,
    tasks: null,
    homeSize: null,
    totalLine: null,
    extraNotes: null,
  };
  if (!notes?.trim()) return empty;

  const lines = notes.split(/\r?\n/);
  const extra: string[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const sl = t.toLowerCase();

    if (sl.startsWith('property type:')) {
      empty.serviceType = afterColon(t);
      continue;
    }
    if (sl.startsWith('schedule:')) {
      empty.schedule = afterColon(t);
      continue;
    }
    if (sl.startsWith('selected tasks:')) {
      empty.tasks = afterColon(t);
      continue;
    }
    if (sl.startsWith('home size (sq ft range):')) {
      empty.homeSize = afterColon(t);
      continue;
    }
    if (sl.includes('total due') || sl.includes('sub-total after discount')) {
      empty.totalLine = empty.totalLine ? `${empty.totalLine} · ${t}` : t;
      continue;
    }
    if (
      sl.startsWith('guest / full name:') ||
      sl.startsWith('phone:') ||
      sl.startsWith('email:') ||
      sl.startsWith('map pin') ||
      sl.startsWith('pets in home:') ||
      sl.startsWith('discountpercent:') ||
      sl.startsWith('promotional offer:') ||
      sl.startsWith('discount amount') ||
      sl.startsWith('offer description:')
    ) {
      continue;
    }
    extra.push(t);
  }

  if (extra.length) empty.extraNotes = extra.join('\n');
  return empty;
}

function afterColon(line: string): string | null {
  const i = line.indexOf(':');
  if (i < 0) return null;
  const v = line.slice(i + 1).trim();
  return v || null;
}

/**
 * True when booking looks like a recurring (subscription) plan vs one-time.
 * Uses API `discountPercent` when present (> 0 = plan discount saved), else parses schedule label from notes.
 */
function subscriptionDiscountNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function bookingLooksLikeSubscription(
  booking: { discountPercent?: number | string },
  parsed: ParsedBookingNotes,
): boolean {
  if (subscriptionDiscountNumber(booking.discountPercent) > 0) return true;
  const s = (parsed.schedule ?? '').trim().toLowerCase();
  if (!s || s === 'one time') return false;
  return true;
}

/** Status values that do not imply subscription cancellation (payment/booking flow). */
const NEUTRAL_BOOKING_STATUS =
  /^(confirmed|pending|succeeded|paid|processing|complete|completed|scheduled|active)$/i;

/**
 * True when GET booking data indicates the Stripe subscription was cancelled or is scheduled to end.
 * Use together with local IDs after POST cancel — API may still return "Succeeded" until webhook updates.
 */
export function subscriptionCancellationIndicatedFromBooking(booking: {
  status?: string | null;
  notes?: string | null;
}): boolean {
  const st = (booking.status ?? '').trim();
  if (st && !NEUTRAL_BOOKING_STATUS.test(st)) {
    const lower = st.toLowerCase();
    if (
      /cancel|canceled|cancelled|unsub|inactive|revoked|expired|ended|termination/i.test(lower) &&
      !/non.?cancel/i.test(lower)
    ) {
      return true;
    }
  }
  const notes = (booking.notes ?? '').toLowerCase();
  if (
    /subscription\s*(cancel|canceled|cancelled|ending)|cancel.*subscription|cancel_at_period_end|will\s+end\s+after.*(billing|period)/i.test(
      notes,
    )
  ) {
    return true;
  }
  return false;
}
