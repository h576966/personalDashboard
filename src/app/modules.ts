import { Bookmark, CalendarCheck, Newspaper, NotebookPen, type LucideIcon } from "lucide-react";

export type ActiveModule = "family" | "notes" | "news" | "saved";

export interface DashboardModule {
  id: ActiveModule;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const dashboardModules: DashboardModule[] = [
  {
    id: "family",
    title: "Family Today",
    description: "Schedule and tasks",
    icon: CalendarCheck,
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
    id: "saved",
    title: "Saved",
    description: "Saved items and links",
    icon: Bookmark,
  },
];
