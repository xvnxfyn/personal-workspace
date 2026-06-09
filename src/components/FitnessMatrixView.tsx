import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FitnessRecord } from "../types";
interface Props { onShowToast: (msg: string) => void; }
export default function FitnessMatrixView({ onShowToast }: Props) {
  const [records, setRecords] = useState<FitnessRecord[]>([]);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), type: "Workout", metric: "Minutes", value: "30", notes: "" });
  const load = () => fetch('/api/fitness').then(r=>r.json()).then(setRecords);
  useEffect(()=>{load();},[]);
  const add = async()=>{ await fetch('/api/fitness',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await load(); onShowToast('Fitness record saved'); };
  const del = async(id:string)=>{ await fetch(`/api/fitness/${id}`,{method:'DELETE'}); await load(); };
  const thisMonth = new Date().toISOString().slice(0,7);
  const monthly = records.filter(r=>r.date.startsWith(thisMonth));
  const total = monthly.reduce((s,r)=>s+Number(r.value||0),0);
  return <div className="w-full max-w-[1000px] mx-auto px-10 py-12">
    <h2 className="text-[40px] font-black tracking-tight mb-2">Fitness Matrix</h2><p className="text-[14px] text-[#7D7C78] mb-8">Log workouts, body metrics, and progress records.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><div className="p-5 rounded-xl border bg-[#F7F6F3]"><div className="text-xs font-bold uppercase text-gray-400">This Month Logs</div><div className="text-3xl font-black">{monthly.length}</div></div><div className="p-5 rounded-xl border bg-[#F7F6F3]"><div className="text-xs font-bold uppercase text-gray-400">Total Value</div><div className="text-3xl font-black">{total}</div></div><div className="p-5 rounded-xl border bg-[#F7F6F3]"><div className="text-xs font-bold uppercase text-gray-400">Consistency</div><div className="text-3xl font-black">{Math.min(100, Math.round((monthly.length/20)*100))}%</div></div></div>
    <div className="bg-white border rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3"><input type="date" className="border rounded-lg px-3 py-2 text-sm" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/><input className="border rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/><input className="border rounded-lg px-3 py-2 text-sm" value={form.metric} onChange={e=>setForm({...form,metric:e.target.value})}/><input type="number" className="border rounded-lg px-3 py-2 text-sm" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/><input className="border rounded-lg px-3 py-2 text-sm" placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button onClick={add} className="bg-[#37352F] text-white rounded-lg flex items-center justify-center gap-2"><Plus className="w-4 h-4"/>Add</button></div>
    <div className="bg-white border rounded-xl overflow-hidden"><table className="w-full text-sm"><thead className="bg-[#F7F6F3] text-left"><tr><th className="p-3">Date</th><th>Type</th><th>Metric</th><th>Value</th><th>Notes</th><th></th></tr></thead><tbody>{records.map(r=><tr key={r.id} className="border-t"><td className="p-3">{r.date}</td><td className="font-semibold">{r.type}</td><td>{r.metric}</td><td>{r.value}</td><td>{r.notes}</td><td><button className="text-red-500" onClick={()=>del(r.id)}><Trash2 className="w-4 h-4"/></button></td></tr>)}</tbody></table></div>
  </div>;
}
