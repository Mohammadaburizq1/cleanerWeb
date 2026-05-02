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
