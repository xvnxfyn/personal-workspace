import { PrismaClient, BlockType } from "@prisma/client";

const prisma = new PrismaClient();

export interface SearchItem {
  id: string;
  title: string;
  type: "page" | "task" | "file" | "asset" | "fitness";
  category: string;
  subtitle?: string;
  timeInfo?: string;
}

type TaskStatus = "To Do" | "In Progress" | "Done";
type TaskPriority = "Low" | "Medium" | "High";
type ActivityCategory = "Edited" | "Mention" | "Created" | "Completed" | "System";

export class PrismaDB {
  private defaultUserId = "user-1";

  async init() {
    const userCount = await prisma.user.count();
    if (userCount > 0) { await this.touchOnline(); return; }

    await prisma.user.create({
      data: {
        id: this.defaultUserId,
        email: "julian.a@workspace.io",
        name: "Julian Alexander",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        language: "English (US)",
        timezone: "(GMT-08:00) Pacific Time",
        theme: "Light",
        role: "owner",
      },
    });

    await prisma.page.createMany({
      data: [
        { id: "page-1", title: "Getting Started", emoji: "🚀", coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", isFavorite: true, userId: this.defaultUserId },
        { id: "page-2", title: "Life OS", emoji: "📂", isFavorite: true, userId: this.defaultUserId },
        { id: "page-3", title: "Second Brain", emoji: "🧠", isFavorite: true, userId: this.defaultUserId },
      ],
    });

    await prisma.block.createMany({
      data: [
        { id: "block-1", pageId: "page-1", type: "HEADING_1", content: JSON.stringify({ text: "Welcome to your Personal Workspace" }), order: 0 },
        { id: "block-2", pageId: "page-1", type: "TEXT", content: JSON.stringify({ text: "This app now uses a real Express API and SQLite database via Prisma." }), order: 1 },
        { id: "block-3", pageId: "page-1", type: "TODO", content: JSON.stringify({ text: "Create your first page", completed: false }), order: 2 },
      ],
    });

    await prisma.task.createMany({
      data: [
        { id: "task-1", name: "Quarterly report synthesis", status: "In Progress", priority: "High", dueDate: "2026-06-12", userId: this.defaultUserId },
        { id: "task-2", name: "Design system documentation update", status: "To Do", priority: "Medium", dueDate: "2026-06-18", userId: this.defaultUserId },
        { id: "task-3", name: "Review team OKRs", status: "Done", priority: "Low", dueDate: "2026-06-08", userId: this.defaultUserId },
      ],
    });

    await prisma.habit.createMany({
      data: [
        { id: "habit-1", name: "Drink Water", icon: "water_drop", userId: this.defaultUserId },
        { id: "habit-2", name: "Meditate", icon: "self_improvement", userId: this.defaultUserId },
        { id: "habit-3", name: "Exercise", icon: "fitness_center", userId: this.defaultUserId },
        { id: "habit-4", name: "Reading", icon: "menu_book", userId: this.defaultUserId },
      ],
    });

    await prisma.activity.createMany({
      data: [
        { id: "act-1", userName: "System", action: "created", targetName: "Workspace", detail: "Initial workspace database has been created.", timeStr: "Just now", category: "System", userId: this.defaultUserId },
      ],
    });
  }

  async getUser() {
    return prisma.user.findFirst();
  }

  async updateUser(update: any) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found");
    return prisma.user.update({ where: { id: user.id }, data: update });
  }

  async touchOnline() {
    const user = await this.getUser();
    if (!user) return null;
    return prisma.user.update({ where: { id: user.id }, data: { lastActive: new Date() } });
  }

  async getPages() {
    return prisma.page.findMany({ where: { isTrash: false }, orderBy: { updatedAt: "desc" } });
  }

  async getTrashPages() {
    return prisma.page.findMany({ where: { isTrash: true }, orderBy: { updatedAt: "desc" } });
  }

  async getPage(id: string) {
    return prisma.page.findUnique({ where: { id } });
  }

  async createPage(title: string, emoji = "📄") {
    const user = await this.getUser();
    const page = await prisma.page.create({ data: { title, emoji, userId: user?.id } });
    const block = await prisma.block.create({
      data: {
        pageId: page.id,
        type: "TEXT",
        content: JSON.stringify({ text: "Write something here..." }),
        order: 0,
      },
    });
    return { page, blocks: [block] };
  }

  async updatePage(id: string, update: any) {
    const existing = await this.getPage(id);
    if (!existing) return null;
    return prisma.page.update({ where: { id }, data: update });
  }

  async deletePagePermanently(id: string) {
    await prisma.page.delete({ where: { id } }).catch(() => null);
  }

  async getBlocks(pageId: string) {
    return prisma.block.findMany({ where: { pageId }, orderBy: { order: "asc" } });
  }

  async saveBlocks(pageId: string, clientBlocks: any[]) {
    await prisma.$transaction(async (tx) => {
      await tx.block.deleteMany({ where: { pageId } });
      for (const [index, cb] of clientBlocks.entries()) {
        await tx.block.create({
          data: {
            id: cb.id || undefined,
            pageId,
            type: cb.type as BlockType,
            content: typeof cb.content === "string" ? cb.content : JSON.stringify(cb.content),
            order: index,
          },
        });
      }
    });
    return this.getBlocks(pageId);
  }

  async getTasks() {
    return prisma.task.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  }

  async createTask(name: string, status: TaskStatus = "To Do", priority: TaskPriority = "Medium", dueDate?: string, reminderAt?: string) {
    const user = await this.getUser();
    return prisma.task.create({ data: { name, status, priority, dueDate: dueDate || new Date().toISOString().split("T")[0], reminderAt, userId: user?.id } });
  }

  async updateTask(id: string, update: any) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return null;
    return prisma.task.update({ where: { id }, data: update });
  }

  async deleteTask(id: string) {
    await prisma.task.delete({ where: { id } }).catch(() => null);
  }

  async getHabits() {
    return prisma.habit.findMany({ orderBy: { createdAt: "asc" } });
  }

  async getHabitLogs() {
    return prisma.habitLog.findMany({ orderBy: { createdAt: "asc" } });
  }

  async addHabit(name: string, icon = "check_circle") {
    const user = await this.getUser();
    return prisma.habit.create({ data: { name, icon, userId: user?.id } });
  }

  async deleteHabit(id: string) {
    await prisma.habit.delete({ where: { id } }).catch(() => null);
  }

  async toggleHabitLog(habitId: string, date: string, completed: boolean) {
    await prisma.habitLog.deleteMany({ where: { habitId, date } });
    await prisma.habitLog.create({ data: { habitId, date, completed } });
    return this.getHabitLogs();
  }


  async getAssets() {
    return prisma.asset.findMany({ orderBy: { updatedAt: "desc" } });
  }

  async createAsset(data: any) {
    const user = await this.getUser();
    return prisma.asset.create({ data: { name: data.name || "Untitled Asset", category: data.category || "General", value: Number(data.value || 0), notes: data.notes || "", fileName: data.fileName || null, fileData: data.fileData || null, userId: user?.id } });
  }

  async updateAsset(id: string, data: any) {
    return prisma.asset.update({ where: { id }, data: { ...data, value: data.value !== undefined ? Number(data.value) : undefined } }).catch(() => null);
  }

  async deleteAsset(id: string) {
    await prisma.asset.delete({ where: { id } }).catch(() => null);
  }

  async getFitnessRecords() {
    return prisma.fitnessRecord.findMany({ orderBy: { date: "desc" } });
  }

  async createFitnessRecord(data: any) {
    const user = await this.getUser();
    return prisma.fitnessRecord.create({ data: { date: data.date || new Date().toISOString().split("T")[0], type: data.type || "Workout", metric: data.metric || "Minutes", value: Number(data.value || 0), notes: data.notes || "", userId: user?.id } });
  }

  async deleteFitnessRecord(id: string) {
    await prisma.fitnessRecord.delete({ where: { id } }).catch(() => null);
  }

  async getNotifications() {
    return prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  }

  async createNotification(data: any) {
    const user = await this.getUser();
    return prisma.notification.create({ data: { title: data.title || "Reminder", message: data.message || "", dueAt: data.dueAt || null, userId: user?.id } });
  }

  async markNotification(id: string, read: boolean) {
    return prisma.notification.update({ where: { id }, data: { read } }).catch(() => null);
  }

  async getActivities() {
    return prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  }

  async addActivity(userName: string, action: string, targetName: string, detail: string, category: ActivityCategory) {
    const user = await this.getUser();
    return prisma.activity.create({
      data: {
        userName,
        action,
        targetName,
        detail,
        timeStr: "Just now",
        category,
        avatarUrl: user?.avatar,
        userId: user?.id,
      },
    });
  }
}
