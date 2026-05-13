export type SkillTier = "core" | "strong" | "familiar";

export interface Skill {
  name: string;
  tier: SkillTier;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: Skill[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "ai-ml",
    name: "AI & Machine Learning",
    skills: [
      { name: "LLMs", tier: "core" },
      { name: "Agentic LLM Systems", tier: "core" },
      { name: "Tool-Use & Function Calling", tier: "core" },
      { name: "Prompt Engineering", tier: "core" },
      { name: "Anthropic Claude", tier: "core" },
      { name: "Multimodal AI", tier: "strong" },
      { name: "Computer Vision", tier: "strong" },
      { name: "Structured Outputs", tier: "strong" },
      { name: "Retrieval-Augmented Generation (RAG)", tier: "strong" },
      { name: "Embeddings", tier: "strong" },
      { name: "Streaming Inference", tier: "strong" },
      { name: "Anthropic", tier: "strong" },
      { name: "Google Gemini", tier: "strong" },
      { name: "OpenAI", tier: "strong" },
      { name: "Local LLM Deployment", tier: "strong" },
      { name: "LLM Evaluation & Reward Shaping", tier: "familiar" },
    ],
  },
  {
    id: "engineering",
    name: "Engineering & Frameworks",
    skills: [
      { name: "Python", tier: "core" },
      { name: "TypeScript", tier: "core" },
      { name: "Next.js", tier: "core" },
      { name: "React", tier: "core" },
      { name: "Node.js", tier: "core" },
      { name: "REST APIs", tier: "core" },
      { name: "JavaScript", tier: "strong" },
      { name: "FastAPI", tier: "strong" },
      { name: "Pydantic", tier: "strong" },
      { name: "Express", tier: "strong" },
      { name: "tRPC", tier: "strong" },
      { name: "WebSockets", tier: "strong" },
      { name: "Server-Sent Events (SSE)", tier: "strong" },
      { name: "Streaming", tier: "strong" },
      { name: "Rate Limiting", tier: "strong" },
      { name: "Authentication (Auth0, OAuth)", tier: "strong" },
      { name: "Drizzle", tier: "strong" },
      { name: "TailwindCSS", tier: "strong" },
      { name: "Zustand", tier: "strong" },
      { name: "Progressive Web Apps (PWA)", tier: "strong" },
      { name: "Testing (Vitest, Jest, Mocha, Chai)", tier: "strong" },
      { name: "React Native", tier: "familiar" },
      { name: "Django", tier: "familiar" },
      { name: "GraphQL", tier: "familiar" },
      { name: "gRPC", tier: "familiar" },
      { name: "Prisma", tier: "familiar" },
      { name: "Structured Logging (structlog)", tier: "familiar" },
    ],
  },
  {
    id: "infra",
    name: "Database, Cloud & DevOps",
    skills: [
      { name: "Git", tier: "core" },
      { name: "Vercel", tier: "core" },
      { name: "Turso", tier: "core" },
      { name: "AWS", tier: "strong" },
      { name: "Docker", tier: "strong" },
      { name: "PostgreSQL", tier: "strong" },
      { name: "Redis", tier: "strong" },
      { name: "CI/CD", tier: "strong" },
      { name: "GitHub Actions", tier: "strong" },
      { name: "Nginx", tier: "strong" },
      { name: "MongoDB", tier: "familiar" },
      { name: "Convex", tier: "familiar" },
      { name: "Render", tier: "familiar" },
      { name: "HuggingFace Spaces", tier: "familiar" },
    ],
  },
  {
    id: "leadership",
    name: "Leadership & Product Strategy",
    skills: [
      { name: "System Architecture", tier: "core" },
      { name: "Engineering Leadership", tier: "core" },
      { name: "Technical Roadmapping", tier: "core" },
      { name: "Product Strategy", tier: "strong" },
      { name: "Code Review", tier: "strong" },
      { name: "Mentorship", tier: "strong" },
      { name: "Agile / Scrum", tier: "familiar" },
    ],
  },
];
