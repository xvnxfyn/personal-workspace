import React, { useState, useEffect } from "react";
import { CheckSquare, ListTodo, Sliders, Plus, Trash2, ArrowUpDown } from "lucide-react";
import { Task } from "../types";

interface TasksViewProps { onShowToast: (msg: string) => void; }
type Tab = "All Tasks" | "Today" | "Upcoming" | "Completed";
type SortMode = "created" | "name" | "date" | "priority";
type FilterMode = "all" | "high" | "medium" | "low";

export default function TasksView({ onShowToast }: TasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("All Tasks");
  const [newTaskName, setNewTaskName] = useState("");
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [isAdding, setIsAdding] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("created");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = () => fetch("/api/tasks").then(r => r.json()).then(setTasks).catch(console.error);
  const updateTask = (id: string, body: Partial<Task>, msg?: string) => {
    fetch(`/api/tasks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(r => r.json()).then(() => { fetchTasks(); if (msg) onShowToast(msg); }).catch(console.error);
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTaskName.trim(), status: "To Do", priority: "Medium", dueDate: newDueDate }) })
      .then(r => r.json()).then(() => { setNewTaskName(""); setIsAdding(false); fetchTasks(); onShowToast("Task created and saved to database"); }).catch(console.error);
  };

  const priorityScore: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const today = new Date().toISOString().slice(0, 10);
  const filteredTasks = tasks
    .filter(t => {
      if (activeTab === "Completed") return t.status === "Done";
      if (activeTab === "Today") return t.status !== "Done" && t.dueDate === today;
      if (activeTab === "Upcoming") return t.status !== "Done" && (t.dueDate || "9999-99-99") > today;
      return true;
    })
    .filter(t => filterMode === "all" ? true : t.priority.toLowerCase() === filterMode)
    .sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "date") return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99");
      if (sortMode === "priority") return (priorityScore[a.priority] ?? 9) - (priorityScore[b.priority] ?? 9);
      return 0;
    });

  const cycleFilter = () => {
    const next: Record<FilterMode, FilterMode> = { all: "high", high: "medium", medium: "low", low: "all" };
    setFilterMode(next[filterMode]);
    onShowToast(`Filter: ${next[filterMode] === "all" ? "all priorities" : next[filterMode] + " priority"}`);
  };
  const cycleSort = () => {
    const next: Record<SortMode, SortMode> = { created: "date", date: "priority", priority: "name", name: "created" };
    setSortMode(next[sortMode]);
    onShowToast(`Sort: ${next[sortMode]}`);
  };

  const getPriorityDot = (p: string) => p === "High" ? "bg-red-500" : p === "Medium" ? "bg-gray-400" : "bg-gray-300";
  const getStatusStyle = (s: string) => s === "Done" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : s === "In Progress" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-gray-100 text-gray-800 border border-gray-200";

  return <div className="w-full max-w-[1000px] mx-auto px-10 py-12">
    <div className="flex items-center gap-4 mb-8"><CheckSquare className="w-10 h-10 text-[#37352F]" /><h2 className="text-[40px] font-bold text-[#37352F]">Tasks</h2></div>
    <div className="flex items-center border-b border-[#EDEDEB] mb-8 overflow-x-auto whitespace-nowrap">
      {(["All Tasks", "Today", "Upcoming", "Completed"] as Tab[]).map(tab => <button key={tab} className={`px-4 py-2 text-[13.5px] font-semibold border-b-2 ${activeTab === tab ? "border-[#37352F] text-[#37352F]" : "border-transparent text-gray-400 hover:text-black"}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      <div className="flex-grow" />
      <button onClick={cycleFilter} className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-[#7D7C78] hover:bg-[#F7F6F3] rounded-lg"><Sliders className="w-3.5 h-3.5" />Filter: {filterMode}</button>
      <button onClick={cycleSort} className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-[#7D7C78] hover:bg-[#F7F6F3] rounded-lg"><ArrowUpDown className="w-3.5 h-3.5" />Sort: {sortMode}</button>
    </div>

    <div className="bg-white border border-[#EDEDEB] rounded-xl overflow-hidden mb-12">
      <table className="w-full text-left border-collapse"><thead><tr className="bg-[#F7F6F3] border-b border-[#EDEDEB] text-[11px] font-bold text-[#7D7C78] uppercase tracking-wider"><th className="px-6 py-3 w-12"></th><th className="px-4 py-3">Task Name</th><th className="px-4 py-3 w-32">Status</th><th className="px-4 py-3 w-28">Priority</th><th className="px-4 py-3 w-40">Due Date</th><th className="px-4 py-3 w-12"></th></tr></thead>
      <tbody className="divide-y divide-gray-100">{filteredTasks.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-[13px] italic">No tasks found.</td></tr> : filteredTasks.map(task => <tr key={task.id} className="group hover:bg-[#F7F6F3]/50"><td className="px-6 py-4 text-center text-gray-300">⠿</td><td className="px-4 py-4"><div className="flex items-center gap-3"><input type="checkbox" checked={task.status === "Done"} onChange={() => updateTask(task.id, { status: task.status === "Done" ? "To Do" : "Done" }, "Task status saved")} className="w-4.5 h-4.5" /><input value={task.name} onChange={e => updateTask(task.id, { name: e.target.value })} className={`w-full bg-transparent outline-none text-[14px] ${task.status === "Done" ? "line-through text-gray-400" : "font-medium text-gray-800"}`} /></div></td><td className="px-4 py-4"><select className={`text-[11px] px-2 py-0.5 rounded font-semibold ${getStatusStyle(task.status)}`} value={task.status} onChange={e => updateTask(task.id, { status: e.target.value as Task["status"] }, "Status saved")}><option>To Do</option><option>In Progress</option><option>Done</option></select></td><td className="px-4 py-4"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`} /><select className="text-[14px] bg-transparent outline-none" value={task.priority} onChange={e => updateTask(task.id, { priority: e.target.value as Task["priority"] }, "Priority saved")}><option>High</option><option>Medium</option><option>Low</option></select></div></td><td className="px-4 py-4"><input type="date" value={(task.dueDate || "").slice(0,10)} onChange={e => updateTask(task.id, { dueDate: e.target.value }, "Due date saved")} className="text-[13px] border border-[#EDEDEB] rounded-md px-2 py-1" /></td><td className="px-4 py-4 text-center"><button className="text-gray-300 hover:text-red-500" onClick={() => fetch(`/api/tasks/${task.id}`, { method: "DELETE" }).then(() => { fetchTasks(); onShowToast("Task deleted"); })}><Trash2 className="w-3.5 h-3.5" /></button></td></tr>)}</tbody></table>
      {isAdding ? <form onSubmit={handleAddTaskSubmit} className="flex gap-3 border-t border-gray-100 bg-[#F7F6F3]/30 p-3"><input className="flex-1 px-4 py-2 text-[14px] border rounded-lg" placeholder="Task title" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} autoFocus /><input type="date" className="px-3 py-2 text-[13px] border rounded-lg" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} /><button type="button" className="px-4 py-2" onClick={() => setIsAdding(false)}>Cancel</button><button className="px-5 py-2 bg-[#37352F] text-white rounded-lg text-[13px] font-semibold">Create</button></form> : <button className="w-full text-left px-12 py-4 flex items-center gap-2.5 text-[#7D7C78] hover:text-[#37352F] border-t" onClick={() => setIsAdding(true)}><Plus className="w-4 h-4" /> Add a task</button>}
    </div>
    <div className="mt-12 flex flex-col items-center justify-center p-12 border border-dashed border-[#EDEDEB] rounded-xl bg-white"><ListTodo className="w-6 h-6 text-[#7D7C78] mb-3" /><h3 className="text-[18px] font-bold text-[#37352F]">Focused Environment</h3><p className="text-[13px] text-[#7D7C78] text-center max-w-sm">Tasks are saved through the Express API into SQLite/Prisma.</p></div>
  </div>;
}
