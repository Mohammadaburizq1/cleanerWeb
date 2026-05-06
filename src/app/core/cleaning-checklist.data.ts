export type ChecklistSection = {
  title: string;
  items: string[];
  /** Amount (e.g. in JD) added per checked task in this section */
  pricePerTask: number;
  /**
   * Optional per-item pricing (used for add-ons where each item has a different price).
   * Key must match the item string in `items`.
   */
  itemPrices?: Record<string, number>;
  subtitle?: string;
};

/** First N sections are treated as “included in every standard cleaning”. */
export const INCLUDED_STANDARD_SECTION_COUNT = 3;

export const CLEANING_CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    title: 'Kitchen',
    pricePerTask: 0,
    items: [
      'Empty Trash',
      'Dust from Top to Bottom',
      'Dust Light Fixtures and Fans',
      'Dust Baseboards',
      'Dust Blinds and Window Sills',
      'Sinks',
      'Backsplash',
      'Cabinets — Dusted and Spot Checked',
      'All Countertops',
      'Small Appliances',
      'Glass Doors',
      'Microwave',
      'Polish Stainless Steel',
      'Dishwasher (Outside Only)',
      'Stovetop and Stove Fan',
      'Oven (Outside Only)',
      'Outside Fridge',
      'Floors Vacuumed',
      'Floors Mopped',
    ],
  },
  {
    title: 'Living Areas & Bedroom',
    pricePerTask: 0,
    items: [
      'Dust from Top to Bottom',
      'Dust Light Fixtures and Fans',
      'Dust Baseboards',
      'Dust Blinds & Window Sills',
      'Throw Rugs Vacuumed',
      'Empty Trash',
      'Clean All Mirrors',
      'Dust Furniture and Decorations',
      'Clean All Glass Surfaces',
      'Remove Fingerprints / Smudges',
      'Straighten and Make Presentable',
      'Make Beds',
      'Vacuum All Floors',
      'Mop Hard Surface Flooring',
      'Vacuum Stairs',
    ],
  },
  {
    title: 'Bathrooms',
    pricePerTask: 0,
    items: [
      'Dust from Top to Bottom',
      'Dust Light Fixtures and Fans',
      'Dust Baseboards',
      'Dust Blinds and Window Sills',
      'Sinks',
      'Countertops',
      'Mirrors',
      'Faucets (also polished)',
      'Toilet',
      'Empty Trash',
      'Shower Stall',
      'Remove Soap Scum',
      'Bathtub',
      'Shower Racks (as able)',
      'Towels Folded and Hung',
      'Straighten and Make Presentable',
      'Floors Vacuumed',
      'Floors Mopped',
    ],
  },
  {
    title: 'Deep Clean',
    pricePerTask: 3,
    items: [
      'Hand Wash Baseboards',
      'Hand Wash Wood Trim',
      'Hand Wash Outsides of Cabinets',
      'Full Soap Scum Buildup Removal',
      'Kitchen Grease & Buildup Removal',
    ],
  },
  {
    title: 'Moving Clean',
    pricePerTask: 5,
    subtitle: 'Everything in a Deep Clean, plus',
    items: ['Inside Empty Cabinets'],
  },
  {
    title: 'Upgrades',
    pricePerTask: 0,
    itemPrices: {
      'Changing Linens': 5,
      'Interior of Fridge & Freezer': 50,
      'Interior of Oven': 70,
      'Interior Windows': 5,
      'Vacuum Sectional / Large Couch': 10,
      'Vacuum Small Couch': 7,
    },
    items: [
      'Changing Linens',
      'Interior of Fridge & Freezer',
      'Interior of Oven',
      'Interior Windows',
      'Vacuum Sectional / Large Couch',
      'Vacuum Small Couch',
    ],
  },
];

export const STANDARD_INCLUDED_SECTIONS: ChecklistSection[] = CLEANING_CHECKLIST_SECTIONS.slice(
  0,
  INCLUDED_STANDARD_SECTION_COUNT,
);
