export type ChecklistSection = {
  title: string;
  items: string[];
  /** Amount (e.g. in JD) added per checked task in this section */
  pricePerTask: number;
  subtitle?: string;
};

/** First N sections are treated as “included in every standard cleaning”. */
export const INCLUDED_STANDARD_SECTION_COUNT = 3;

export const CLEANING_CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    title: 'Kitchen',
    pricePerTask: 1,
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
    pricePerTask: 1,
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
    pricePerTask: 1,
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
    pricePerTask: 2,
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
