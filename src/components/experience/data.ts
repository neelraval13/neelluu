export interface Rung {
  id: number;
  monthYear: string;
  isTransition: boolean;
  transitionLabel?: string;
  role?: string;
  company?: string;
}

export const RUNGS: Rung[] = [
  {
    id: 11,
    monthYear: "May 2026",
    isTransition: true,
    transitionLabel: "Current",
    role: "Engineering Lead, Software & Product",
    company: "Odyssey Therapeia",
  },
  { id: 10, monthYear: "Feb 2026", isTransition: false },
  {
    id: 9,
    monthYear: "Oct 2025",
    isTransition: true,
    transitionLabel: "Eng Lead promotion",
    role: "Engineering Lead, Software & Product",
    company: "Odyssey Therapeia",
  },
  { id: 8, monthYear: "Jun 2025", isTransition: false },
  {
    id: 7,
    monthYear: "Feb 2025",
    isTransition: true,
    transitionLabel: "Lead Dev promotion",
    role: "Lead Developer",
    company: "Odyssey Therapeia",
  },
  { id: 6, monthYear: "Dec 2024", isTransition: false },
  {
    id: 5,
    monthYear: "Aug 2024",
    isTransition: true,
    transitionLabel: "Joined Odyssey",
    role: "Software Developer I",
    company: "Odyssey Therapeia",
  },
  { id: 4, monthYear: "Jul 2024", isTransition: false },
  { id: 3, monthYear: "Mar 2024", isTransition: false },
  { id: 2, monthYear: "Nov 2023", isTransition: false },
  {
    id: 1,
    monthYear: "Jul 2023",
    isTransition: true,
    transitionLabel: "Joined Ankr",
    role: "Software Developer I",
    company: "Ankr Health",
  },
];

// World coordinate system: Y up, ladder vertical
// Rung 11 at top (Y = TOP_Y), Rung 1 at bottom (Y = BOTTOM_Y)
export const TOP_Y = 5;
export const BOTTOM_Y = -5;
export const RAIL_X = 0.4;

export function rungY(rungId: number): number {
  const RUNG_SPACING = (TOP_Y - BOTTOM_Y) / (RUNGS.length - 1);
  return BOTTOM_Y + (rungId - 1) * RUNG_SPACING;
}

export const ACCENT = "#ff3d9a";
