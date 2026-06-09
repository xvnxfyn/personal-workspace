import React, { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Paperclip } from "lucide-react";
import { Asset } from "../types";

interface Props { onShowToast: (msg: string) => void; }

export default function AssetPortfolioView({ onShowToast }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState({ name: "", category: "Investment", value: "", notes: "", fileName: "", fileData: "" });
  const total = assets.reduce((sum, a) => sum + Number(a.value || 0), 0);

  const load = () => fetch("/api/assets").then(r => r.json()).then(setAssets);
  useEffect(() => { load(); }, []);

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
  });

  const submit = async () => {
    if (!form.name.trim()) return onShowToast("Asset name is required");
    await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", category: "Investment", value: "", notes: "", fileName: "", fileData: "" });
    await load(); onShowToast("Asset added to portfolio");
  };

  const remove = async (id: string) => { await fetch(`/api/assets/${id}`, { method: "DELETE" }); await load(); onShowToast("Asset removed"); };

  return <div className="w-full max-w-[1000px] mx-auto px-10 py-12">
    <h2 className="text-[40px] font-black tracking-tight mb-2">Asset Portfolio</h2>
    <p className="text-[14px] text-[#7D7C78] mb-8">Track assets, values, notes, and supporting files. Data is stored in SQLite via Prisma.</p>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-[#F7F6F3] border border-[#EDEDEB] rounded-xl p-5"><div className="text-[11px] font-bold uppercase text-gray-400">Total Portfolio</div><div className="text-3xl font-black">{total.toLocaleString()}</div></div>
      <div className="bg-[#F7F6F3] border border-[#EDEDEB] rounded-xl p-5"><div className="text-[11px] font-bold uppercase text-gray-400">Items</div><div className="text-3xl font-black">{assets.length}</div></div>
      <div className="bg-[#F7F6F3] border border-[#EDEDEB] rounded-xl p-5"><div className="text-[11px] font-bold uppercase text-gray-400">Attachments</div><div className="text-3xl font-black">{assets.filter(a => a.fileData).length}</div></div>
    </div>
    <div className="bg-white border border-[#EDEDEB] rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
      <input className="border rounded-lg px-3 py-2 text-[13px]" placeholder="Asset name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <select className="border rounded-lg px-3 py-2 text-[13px]" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Investment</option><option>Cash</option><option>Property</option><option>Vehicle</option><option>Document</option><option>Other</option></select>
      <input className="border rounded-lg px-3 py-2 text-[13px]" type="number" placeholder="Value" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/>
      <input className="border rounded-lg px-3 py-2 text-[13px]" placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
      <div className="flex gap-2">
        <label className="flex-1 border rounded-lg px-3 py-2 text-[12px] cursor-pointer flex items-center gap-2 justify-center"><Upload className="w-3.5 h-3.5"/> File<input type="file" className="hidden" onChange={async e=>{const f=e.target.files?.[0]; if(f) setForm({...form,fileName:f.name,fileData:await fileToDataUrl(f)});}}/></label>
        <button onClick={submit} className="bg-[#37352F] text-white rounded-lg px-3"><Plus className="w-4 h-4"/></button>
      </div>
    </div>
    <div className="bg-white border border-[#EDEDEB] rounded-xl overflow-hidden"><table className="w-full text-[13px]"><thead className="bg-[#F7F6F3] text-left"><tr><th className="p-3">Name</th><th>Category</th><th>Value</th><th>Notes</th><th>File</th><th></th></tr></thead><tbody>{assets.map(a=><tr key={a.id} className="border-t"><td className="p-3 font-semibold">{a.name}</td><td>{a.category}</td><td>{Number(a.value).toLocaleString()}</td><td>{a.notes}</td><td>{a.fileData ? <a className="underline flex items-center gap-1" href={a.fileData} download={a.fileName || "attachment"}><Paperclip className="w-3 h-3"/>{a.fileName || "file"}</a> : "-"}</td><td><button onClick={()=>remove(a.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></button></td></tr>)}</tbody></table></div>
  </div>;
}
