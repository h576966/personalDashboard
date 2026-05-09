import { BookMarked, ListChecks, Newspaper, NotebookPen, type LucideIcon } from "lucide-react";

export type ActiveModule = "lists" | "notes" | "news" | "readLater";

export interface DashboardModule {
  id: ActiveModule;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const dashboardModules: DashboardModule[] = [
  {
    id: "lists",
    title: "Lists",
    description: "Shared household lists",
    icon: ListChecks,
  },
  {
    id: "notes",
    title: "Notes",
    description: "Quick thoughts and drafts",
    icon: NotebookPen,
  },
  {
    id: "news",
    title: "News",
    description: "Briefing and topics",
    icon: Newspaper,
  },
  {
    id: "readLater",
    title: "Read Later",
    description: "Saved articles and links",
    icon: BookMarked,
  },
];
