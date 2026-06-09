import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PrismaDB, SearchItem } from "./server/db.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const db = new PrismaDB();
  await db.init();

  app.use(express.json({ limit: "20mb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.get("/api/user", async (_req, res) => {
    res.json(await db.getUser());
  });

  app.post("/api/user/online", async (_req, res) => {
    res.json(await db.touchOnline());
  });

  app.put("/api/user", async (req, res) => {
    res.json(await db.updateUser(req.body));
  });

  app.get("/api/pages", async (_req, res) => {
    res.json(await db.getPages());
  });

  app.get("/api/pages/trash", async (_req, res) => {
    res.json(await db.getTrashPages());
  });

  app.get("/api/pages/:id", async (req, res) => {
    const page = await db.getPage(req.params.id);
    if (!page) return res.status(404).json({ error: "Page not found" });
    const blocks = await db.getBlocks(req.params.id);
    res.json({ page, blocks });
  });

  app.post("/api/pages", async (req, res) => {
    const { title, emoji } = req.body;
    const result = await db.createPage(title || "Untitled", emoji || "📄");
    await db.addActivity("Julian Alexander", "created", result.page.title, "Created a new blank page in the workspace.", "Created");
    res.status(201).json(result);
  });

  app.put("/api/pages/:id", async (req, res) => {
    const updated = await db.updatePage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Page not found" });

    if (req.body.isTrash !== undefined) {
      await db.addActivity(
        "Julian Alexander",
        req.body.isTrash ? "moved to Trash" : "restored",
        updated.title,
        req.body.isTrash ? "Moved this notebook to trash can." : "Restored page from Trash.",
        req.body.isTrash ? "System" : "Edited"
      );
    } else if (req.body.title) {
      await db.addActivity("Julian Alexander", "renamed page to", updated.title, `Renamed page to '${updated.title}'.`, "Edited");
    }
    res.json(updated);
  });

  app.delete("/api/pages/:id", async (req, res) => {
    await db.deletePagePermanently(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/pages/:id/blocks", async (req, res) => {
    const { blocks } = req.body;
    if (!Array.isArray(blocks)) return res.status(400).json({ error: "blocks array is required" });
    const saved = await db.saveBlocks(req.params.id, blocks);
    const page = await db.getPage(req.params.id);
    if (page) await db.addActivity("Julian Alexander", "edited", page.title, `Modified block content inside '${page.title}'.`, "Edited");
    res.json(saved);
  });

  app.get("/api/tasks", async (_req, res) => {
    res.json(await db.getTasks());
  });

  app.post("/api/tasks", async (req, res) => {
    const { name, status, priority, dueDate, reminderAt } = req.body;
    const task = await db.createTask(name, status, priority, dueDate, reminderAt);
    await db.addActivity("Julian Alexander", "created task", task.name, `New task created with status: ${task.status}.`, "Created");
    res.status(201).json(task);
  });

  app.put("/api/tasks/:id", async (req, res) => {
    const tasks = await db.getTasks();
    const taskBefore = tasks.find((t) => t.id === req.params.id);
    const updated = await db.updateTask(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Task not found" });

    if (req.body.status && taskBefore && taskBefore.status !== req.body.status) {
      if (req.body.status === "Done") {
        await db.addActivity("Julian Alexander", "completed tasks in", "Tasks", `Finished "${updated.name}" successfully.`, "Completed");
      } else {
        await db.addActivity("Julian Alexander", "updated status of", updated.name, `Moved task to ${req.body.status}.`, "Edited");
      }
    }
    res.json(updated);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    await db.deleteTask(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/habits", async (_req, res) => {
    res.json({ habits: await db.getHabits(), logs: await db.getHabitLogs() });
  });

  app.post("/api/habits", async (req, res) => {
    const { name, icon } = req.body;
    const habit = await db.addHabit(name, icon);
    await db.addActivity("Julian Alexander", "added habit", habit.name, "Added a new daily ritual to track.", "Created");
    res.status(201).json(habit);
  });

  app.delete("/api/habits/:id", async (req, res) => {
    await db.deleteHabit(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/habits/log", async (req, res) => {
    const { habitId, date, completed } = req.body;
    if (!habitId || !date) return res.status(400).json({ error: "habitId and date are required" });
    res.json(await db.toggleHabitLog(habitId, date, completed));
  });



  app.get("/api/assets", async (_req, res) => {
    res.json(await db.getAssets());
  });

  app.post("/api/assets", async (req, res) => {
    const asset = await db.createAsset(req.body);
    await db.addActivity("Julian Alexander", "created asset", asset.name, "Added asset portfolio item.", "Created");
    res.status(201).json(asset);
  });

  app.put("/api/assets/:id", async (req, res) => {
    const asset = await db.updateAsset(req.params.id, req.body);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    res.json(asset);
  });

  app.delete("/api/assets/:id", async (req, res) => {
    await db.deleteAsset(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/fitness", async (_req, res) => {
    res.json(await db.getFitnessRecords());
  });

  app.post("/api/fitness", async (req, res) => {
    const record = await db.createFitnessRecord(req.body);
    await db.addActivity("Julian Alexander", "logged fitness", record.type, "Added a fitness matrix record.", "Created");
    res.status(201).json(record);
  });

  app.delete("/api/fitness/:id", async (req, res) => {
    await db.deleteFitnessRecord(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/notifications", async (_req, res) => {
    res.json(await db.getNotifications());
  });

  app.post("/api/notifications", async (req, res) => {
    const notification = await db.createNotification(req.body);
    res.status(201).json(notification);
  });

  app.put("/api/notifications/:id", async (req, res) => {
    const notification = await db.markNotification(req.params.id, Boolean(req.body.read));
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  });

  app.get("/api/activities", async (_req, res) => {
    res.json(await db.getActivities());
  });

  app.get("/api/search", async (req, res) => {
    const query = (req.query.q || "").toString().toLowerCase();
    const pages = await db.getPages();
    const tasks = await db.getTasks();
    const results: SearchItem[] = [];

    pages.forEach((p) => {
      if (p.title.toLowerCase().includes(query) || p.emoji.includes(query)) {
        results.push({ id: p.id, title: p.title, type: "page", category: "Workspace", subtitle: `In Workspace > ${p.title}`, timeInfo: "Updated recently" });
      }
    });

    tasks.forEach((t) => {
      if (t.name.toLowerCase().includes(query)) {
        results.push({ id: t.id, title: t.name, type: "task", category: "Tasks", subtitle: `Priority: ${t.priority} | Status: ${t.status}`, timeInfo: t.dueDate ? `Due ${t.dueDate}` : undefined });
      }
    });

    const assets = await db.getAssets();
    assets.forEach((a) => {
      const blob = `${a.name} ${a.category} ${a.notes || ""}`.toLowerCase();
      if (blob.includes(query)) results.push({ id: a.id, title: a.name, type: "asset", category: "Asset Portfolio", subtitle: `${a.category} | ${a.value}`, timeInfo: "Asset" });
    });

    const fitness = await db.getFitnessRecords();
    fitness.forEach((f) => {
      const blob = `${f.type} ${f.metric} ${f.notes || ""}`.toLowerCase();
      if (blob.includes(query)) results.push({ id: f.id, title: f.type, type: "fitness", category: "Fitness Matrix", subtitle: `${f.metric}: ${f.value}`, timeInfo: f.date });
    });

    res.json(results);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
