export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  language: string;
  timezone: string;
  theme: string;
  role?: string;
  lastActive?: string;
}

export interface Page {
  id: string;
  title: string;
  emoji: string;
  coverImage?: string;
  isFavorite: boolean;
  isTrash: boolean;
}

export interface Block {
  id: string;
  pageId: string;
  type: "TEXT" | "HEADING_1" | "TODO" | "TABLE" | "KANBAN" | "IMAGE";
  content: any;
  order: number;
}

export interface Task {
  id: string;
  name: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  reminderAt?: string;
}

export interface Habit { id: string; name: string; icon: string; }
export interface HabitLog { habitId: string; date: string; completed: boolean; }
export interface Activity { id: string; userName: string; action: string; targetName: string; detail: string; timeStr: string; category: "Edited" | "Mention" | "Created" | "Completed" | "System"; avatarUrl?: string; }
export interface Asset { id: string; name: string; category: string; value: number; notes?: string; fileName?: string; fileData?: string; }
export interface FitnessRecord { id: string; date: string; type: string; metric: string; value: number; notes?: string; }
export interface NotificationItem { id: string; title: string; message: string; dueAt?: string; read: boolean; }
export interface SearchItem { id: string; title: string; type: "page" | "task" | "file" | "asset" | "fitness"; category: string; subtitle?: string; timeInfo?: string; }
