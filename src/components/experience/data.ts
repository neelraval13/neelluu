export const TOP_Y = 5;
export const BOTTOM_Y = -5;
export const RAIL_X = 0.4;
export const ACCENT = "#ff3d9a";

// ============================================
// Types
// ============================================

export type Project = {
  name: string;
  description: string;
  stack?: string[];
  link?: string;
};

type DateMark = { year: number; month: number };

export type Rung = {
  id: number;
  monthYear: string;
  date: DateMark;
  isStart: boolean;
  isCurrent: boolean;
  isPromotion: boolean;
  isTransition: boolean;
  transitionLabel?: string;
  role: string;
  company: string;
  projects: Project[];
};

// ============================================
// Configuration - the only thing to edit
// ============================================

const START = {
  year: 2023,
  month: 7,
  transitionLabel: "JOINED ANKR",
  role: "Software Developer I",
  company: "Ankr Health",
};

const ROLE_CHANGES = [
  {
    year: 2024,
    month: 8,
    transitionLabel: "JOINED ODYSSEY",
    role: "Software Developer I",
    company: "Odyssey Therapeia",
  },
  {
    year: 2025,
    month: 2,
    transitionLabel: "LEAD DEV PROMOTION",
    role: "Lead Developer",
    company: "Odyssey Therapeia",
  },
  {
    year: 2025,
    month: 10,
    transitionLabel: "ENG LEAD PROMOTION",
    role: "Engineering Lead, Software & Product",
    company: "Odyssey Therapeia",
  },
];

const QUARTER_MONTHS = [3, 6, 9, 12];

// ============================================
// Project arrays - defined once, referenced
// TODO: Replace placeholder text with real content
// ============================================

const ANKR_PROJECTS: Project[] = [
  {
    name: "Patient records platform",
    description:
      "Owned features in the core patient records system used by clinical staff. Worked across data modeling, UI, and audit reliability.",
    stack: ["TypeScript", "Node.js", "PostgreSQL"],
  },
  {
    name: "Clinical workflow tooling",
    description:
      "Built internal tooling that reduced friction in day-to-day clinical workflows - reporting, audit views, and integrations with third-party services.",
    stack: ["TypeScript", "REST APIs"],
  },
];

const ODYSSEY_EARLY_PROJECTS: Project[] = [
  {
    name: "Platform foundation",
    description:
      "Came in as the first engineer building out the core platform. Set up the stack, auth, data layer, and the design conventions the team still uses.",
    stack: ["Next.js", "React", "TypeScript", "Tailwind"],
  },
  {
    name: "Early product surfaces",
    description:
      "Shipped the first customer-facing features end-to-end - from data schema through UI - on tight cycles.",
    stack: ["Next.js", "Drizzle", "Turso"],
  },
];

const ODYSSEY_LEAD_DEV_PROJECTS: Project[] = [
  {
    name: "EMR foundations",
    description:
      "Led the technical design of what would become the EMR - clinical data models, role-based access, modern auth patterns.",
    stack: ["Next.js", "Drizzle", "Turso", "NextAuth v5"],
  },
  {
    name: "Design system and tooling",
    description:
      "Established the shared component library and developer tooling that lets the team move fast without diverging.",
    stack: ["React", "Tailwind", "shadcn/ui"],
  },
  {
    name: "Engineering practices",
    description:
      "Standardized code review, CI, and shipping patterns across the engineering org as the team scaled.",
  },
];

const ODYSSEY_ENG_LEAD_PROJECTS: Project[] = [
  {
    name: "AI-native EMR",
    description:
      "Architecting an electronic medical records system from clinical workflows up. Agentic interfaces, modern auth, the full stack.",
    stack: ["Next.js", "React", "Drizzle", "Turso", "TypeScript"],
  },
  {
    name: "Public-sector tendering automation",
    description:
      "Building the platform that automates the painful manual work of preparing, tracking, and responding to government tender submissions.",
    stack: ["Next.js", "TypeScript"],
  },
  {
    name: "Multi-provider LLM layer",
    description:
      "Unified adapter across Gemini, Claude, and OpenAI with per-user BYOK support. Used internally across our AI products.",
    stack: ["TypeScript"],
  },
];

const PROJECT_PHASES: Array<{ startsAt: DateMark; projects: Project[] }> = [
  { startsAt: { year: 2023, month: 7 }, projects: ANKR_PROJECTS },
  { startsAt: { year: 2024, month: 8 }, projects: ODYSSEY_EARLY_PROJECTS },
  { startsAt: { year: 2025, month: 2 }, projects: ODYSSEY_LEAD_DEV_PROJECTS },
  { startsAt: { year: 2025, month: 10 }, projects: ODYSSEY_ENG_LEAD_PROJECTS },
];

// ============================================
// Per-rung overrides - leave empty unless a specific rung
// needs different content from its phase default
// Key format: "YYYY-MM"
// ============================================

const RUNG_PROJECT_OVERRIDES: Record<string, Project[]> = {
  // Example:
  // "2024-03": [
  //   { name: "Something specific that month", description: "..." },
  // ],
};

// ============================================
// Helpers
// ============================================

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatMonthYear(d: DateMark): string {
  return `${MONTH_NAMES[d.month - 1]} ${d.year}`;
}

function compareDate(a: DateMark, b: DateMark): number {
  return (a.year - b.year) * 12 + (a.month - b.month);
}

function sameMonth(a: DateMark, b: DateMark): boolean {
  return a.year === b.year && a.month === b.month;
}

function dateKey(d: DateMark): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}`;
}

function getCurrentDate(): DateMark {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function getActiveRole(date: DateMark): {
  role: string;
  company: string;
  transitionLabel: string;
} {
  let active = {
    role: START.role,
    company: START.company,
    transitionLabel: START.transitionLabel,
  };
  for (const change of ROLE_CHANGES) {
    if (compareDate(change, date) <= 0) {
      active = {
        role: change.role,
        company: change.company,
        transitionLabel: change.transitionLabel,
      };
    }
  }
  return active;
}

function getActiveProjects(date: DateMark): Project[] {
  // Per-rung override takes precedence
  const override = RUNG_PROJECT_OVERRIDES[dateKey(date)];
  if (override) return override;

  // Otherwise fall back to phase default
  let active = PROJECT_PHASES[0].projects;
  for (const phase of PROJECT_PHASES) {
    if (compareDate(phase.startsAt, date) <= 0) {
      active = phase.projects;
    }
  }
  return active;
}

// ============================================
// Rung generation
// ============================================

type ProtoRung = {
  date: DateMark;
  isStart: boolean;
  isCurrent: boolean;
  isPromotion: boolean;
  changeLabel?: string;
  changeRole?: string;
  changeCompany?: string;
};

function buildRungs(): Rung[] {
  const startDate: DateMark = { year: START.year, month: START.month };
  const endDate = getCurrentDate();

  const protoRungs: ProtoRung[] = [];

  protoRungs.push({
    date: startDate,
    isStart: true,
    isCurrent: false,
    isPromotion: false,
  });

  for (const change of ROLE_CHANGES) {
    const changeDate = { year: change.year, month: change.month };
    if (compareDate(changeDate, startDate) <= 0) continue;
    if (compareDate(changeDate, endDate) > 0) continue;
    protoRungs.push({
      date: changeDate,
      isStart: false,
      isCurrent: sameMonth(changeDate, endDate),
      isPromotion: true,
      changeLabel: change.transitionLabel,
      changeRole: change.role,
      changeCompany: change.company,
    });
  }

  const currentExistsAsPromotion = protoRungs.some(
    (p) => p.isPromotion && sameMonth(p.date, endDate),
  );
  const startEqualsEnd = sameMonth(startDate, endDate);
  if (!currentExistsAsPromotion && !startEqualsEnd) {
    protoRungs.push({
      date: endDate,
      isStart: false,
      isCurrent: true,
      isPromotion: false,
    });
  }

  for (let year = startDate.year; year <= endDate.year; year++) {
    for (const month of QUARTER_MONTHS) {
      const candidate: DateMark = { year, month };
      if (compareDate(candidate, startDate) <= 0) continue;
      if (compareDate(candidate, endDate) >= 0) continue;
      const conflictsWithPromotion = ROLE_CHANGES.some((c) =>
        sameMonth({ year: c.year, month: c.month }, candidate),
      );
      if (conflictsWithPromotion) continue;
      protoRungs.push({
        date: candidate,
        isStart: false,
        isCurrent: false,
        isPromotion: false,
      });
    }
  }

  protoRungs.sort((a, b) => compareDate(a.date, b.date));

  return protoRungs.map((proto, index) => {
    const id = index + 1;
    const monthYear = formatMonthYear(proto.date);

    if (proto.isStart) {
      return {
        id,
        monthYear,
        date: proto.date,
        isStart: true,
        isCurrent: false,
        isPromotion: false,
        isTransition: true,
        transitionLabel: START.transitionLabel,
        role: START.role,
        company: START.company,
        projects: getActiveProjects(proto.date),
      };
    }

    if (proto.isPromotion) {
      return {
        id,
        monthYear,
        date: proto.date,
        isStart: false,
        isCurrent: proto.isCurrent,
        isPromotion: true,
        isTransition: true,
        transitionLabel: proto.changeLabel,
        role: proto.changeRole!,
        company: proto.changeCompany!,
        projects: getActiveProjects(proto.date),
      };
    }

    if (proto.isCurrent) {
      const active = getActiveRole(proto.date);
      return {
        id,
        monthYear,
        date: proto.date,
        isStart: false,
        isCurrent: true,
        isPromotion: false,
        isTransition: true,
        transitionLabel: "CURRENT",
        role: active.role,
        company: active.company,
        projects: getActiveProjects(proto.date),
      };
    }

    const active = getActiveRole(proto.date);
    return {
      id,
      monthYear,
      date: proto.date,
      isStart: false,
      isCurrent: false,
      isPromotion: false,
      isTransition: false,
      role: active.role,
      company: active.company,
      projects: getActiveProjects(proto.date),
    };
  });
}

export const RUNGS: Rung[] = buildRungs();

export function rungY(id: number): number {
  const total = RUNGS.length;
  if (total <= 1) return 0;
  const fraction = (id - 1) / (total - 1);
  return BOTTOM_Y + fraction * (TOP_Y - BOTTOM_Y);
}
