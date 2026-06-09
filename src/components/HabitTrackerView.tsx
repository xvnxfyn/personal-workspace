import React, { useState, useEffect } from "react";
import { CheckCircle, Flame, Percent, Star, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Habit, HabitLog } from "../types";

interface HabitTrackerViewProps { onShowToast: (msg: string) => void; }
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const startOfWeek = (d: Date) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x; };

export default function HabitTrackerView({ onShowToast }: HabitTrackerViewProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  useEffect(() => { fetchHabits(); }, []);
  const fetchHabits = () => fetch("/api/habits").then(r => r.json()).then(d => { setHabits(d.habits || []); setLogs(d.logs || []); }).catch(console.error);
  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return { name: d.toLocaleDateString("en-US", { weekday: "short" }), date: fmt(d), dayNum: String(d.getDate()) }; });
  const monthDays = Array.from({ length: 35 }, (_, i) => { const d = new Date(new Date().getFullYear(), new Date().getMonth(), 1); d.setDate(d.getDate() + i); return d; });
  const logged = (habitId: string, date: string) => logs.some(l => l.habitId === habitId && l.date === date && l.completed !== false);

  const handleToggleLog = (habitId: string, date: string) => {
    const isCompleted = logged(habitId, date);
    fetch("/api/habits/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ habitId, date, completed: !isCompleted }) })
      .then(r => r.json()).then(setLogs).then(() => onShowToast(!isCompleted ? "Habit checked and saved" : "Habit unchecked and saved")).catch(console.error);
  };
  const addHabit = (e: React.FormEvent) => {
    e.preventDefault(); if (!newHabitName.trim()) return;
    fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newHabitName.trim() }) })
      .then(() => { setNewHabitName(""); setIsAdding(false); fetchHabits(); onShowToast("Habit added to database"); }).catch(console.error);
  };
  const deleteHabit = (id: string) => fetch(`/api/habits/${id}`, { method: "DELETE" }).then(() => { fetchHabits(); onShowToast("Habit deleted"); });

  const totalSlots = Math.max(habits.length * weekDates.length, 1);
  const weekDone = habits.reduce((n, h) => n + weekDates.filter(w => logged(h.id, w.date)).length, 0);
  const completionRate = Math.round((weekDone / totalSlots) * 100);
  const topHabit = habits.map(h => ({ name: h.name, count: logs.filter(l => l.habitId === h.id && l.completed !== false).length })).sort((a,b) => b.count-a.count)[0]?.name || "-";
  const streak = (() => { let s=0; for (let i=0;i<60;i++){ const d=new Date(); d.setDate(d.getDate()-i); const ok = habits.length > 0 && habits.some(h => logged(h.id, fmt(d))); if(ok) s++; else if(i>0) break; } return s; })();
  const monthTotal = habits.length * monthDays.length;
  const monthDone = habits.reduce((n,h)=> n + monthDays.filter(d => logged(h.id, fmt(d))).length,0);

  return <div className="w-full max-w-[1000px] mx-auto px-10 py-12">
    <div className="flex items-center gap-4 mb-3"><div className="w-16 h-16 bg-white border rounded-2xl flex items-center justify-center"><CheckCircle className="w-8 h-8" /></div><h2 className="text-[40px] font-bold text-[#37352F]">Habit Tracker</h2></div>
    <p className="text-[15px] text-[#7D7C78] max-w-xl">Track daily rituals. All checkboxes, new habits, delete actions, and monthly consistency are now backed by the database.</p>
    <hr className="my-10 border-[#EDEDEB]" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-white border p-6 rounded-xl"><div className="flex gap-2 mb-2 text-[#7D7C78]"><Flame className="w-4 h-4 text-orange-500"/><h3 className="text-[11px] font-bold uppercase tracking-widest">Current Streak</h3></div><p className="text-[28px] font-bold">{streak} Days</p><span className="text-[11.5px] text-emerald-600 font-semibold">Calculated from saved logs</span></div>
      <div className="bg-white border p-6 rounded-xl"><div className="flex gap-2 mb-2 text-[#7D7C78]"><Percent className="w-4 h-4"/><h3 className="text-[11px] font-bold uppercase tracking-widest">Completion Rate</h3></div><p className="text-[28px] font-bold">{completionRate}%</p><div className="w-full bg-[#F7F6F3] h-1.5 rounded-full mt-3"><div className="bg-[#37352F] h-full" style={{width:`${completionRate}%`}} /></div></div>
      <div className="bg-white border p-6 rounded-xl"><div className="flex gap-2 mb-2 text-[#7D7C78]"><Star className="w-4 h-4 text-amber-500"/><h3 className="text-[11px] font-bold uppercase tracking-widest">Best Habit</h3></div><p className="text-[28px] font-bold truncate">{topHabit}</p><span className="text-[11.5px] text-[#7D7C78] font-semibold">Most completed habit</span></div>
    </div>
    <section className="mb-14"><div className="flex justify-between items-end mb-6"><h3 className="text-[18px] font-bold">Weekly Progress</h3><div className="flex items-center gap-3"><button className="p-1 hover:bg-[#F7F6F3] rounded" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); }}><ChevronLeft className="w-4 h-4" /></button><span className="text-[11.5px] font-bold uppercase tracking-widest">{weekDates[0].date} — {weekDates[6].date}</span><button className="p-1 hover:bg-[#F7F6F3] rounded" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); }}><ChevronRight className="w-4 h-4" /></button></div></div>
      <div className="bg-white border rounded-xl overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-[#F7F6F3]"><th className="p-4 text-left text-[11px] font-bold text-[#7D7C78] uppercase min-w-[180px]">Habit Name</th>{weekDates.map(w=><th key={w.date} className="p-4 text-center text-[11px] font-bold text-[#7D7C78] uppercase">{w.name}<span className="block text-[10px]">{w.dayNum}</span></th>)}<th className="p-4 w-12"></th></tr></thead><tbody className="divide-y">{habits.map(h=><tr key={h.id} className="hover:bg-gray-50 group"><td className="p-4 font-semibold text-[14px]">{h.name}</td>{weekDates.map(w=><td key={w.date} className="p-4 text-center"><input type="checkbox" checked={logged(h.id,w.date)} onChange={()=>handleToggleLog(h.id,w.date)} className="w-5 h-5" /></td>)}<td className="p-4 text-center"><button onClick={()=>deleteHabit(h.id)} className="text-[#7D7C78] hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5"/></button></td></tr>)}<tr><td colSpan={9} className="p-3">{isAdding ? <form onSubmit={addHabit} className="flex gap-3 max-w-sm"><input className="flex-1 px-3 py-1.5 border rounded-lg" placeholder="Habit name" value={newHabitName} onChange={e=>setNewHabitName(e.target.value)} autoFocus/><button type="button" onClick={()=>setIsAdding(false)} className="px-3.5 py-1 text-[12px]">Cancel</button><button className="px-4 py-1 bg-[#37352F] text-white rounded-lg text-[12px]">Add</button></form> : <button onClick={()=>setIsAdding(true)} className="flex items-center gap-1.5 text-[#7D7C78] hover:text-[#37352F] font-semibold text-[13px]"><Plus className="w-4 h-4"/>Add new habit</button>}</td></tr></tbody></table></div></section>
    <section className="mb-24"><div className="flex justify-between items-center mb-6"><h3 className="text-[18px] font-bold text-black">Monthly Consistency</h3><span className="text-[11.5px] font-semibold bg-[#F7F6F3] border px-3 py-1 rounded-lg">{new Date().toLocaleDateString("en-US", {month:"long", year:"numeric"})}</span></div><div className="grid grid-cols-1 md:grid-cols-4 gap-8"><div className="md:col-span-1 space-y-4"><p className="text-[11px] font-bold text-[#7D7C78] uppercase tracking-widest">Key</p><div className="text-[10.5px] text-[#7D7C78] font-semibold uppercase space-y-1"><div>0% = empty</div><div>50% = partial</div><div>100% = full</div></div><div className="bg-[#F7F6F3]/60 border p-4 rounded-xl"><p className="text-[11px] font-bold text-[#7D7C78] uppercase">Total Habits Met</p><p className="text-[20px] font-black">{monthDone} / {monthTotal || 0}</p></div></div><div className="md:col-span-3"><div className="grid grid-cols-7 gap-1.5">{["M","T","W","T","F","S","S"].map((d,i)=><div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>)}{monthDays.map(d=>{ const date=fmt(d); const done=habits.filter(h=>logged(h.id,date)).length; const pct=habits.length?done/habits.length:0; const cls=pct===0?"bg-gray-100":pct<0.5?"bg-gray-300":pct<1?"bg-gray-500":"bg-[#37352F]"; return <button key={date} className={`aspect-square rounded-sm hover:scale-110 ${cls}`} title={`${date}: ${done}/${habits.length}`} onClick={()=>onShowToast(`${date}: ${done}/${habits.length} habits complete`)} />;})}</div></div></div></section>
  </div>;
}
