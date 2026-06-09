import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, ShieldAlert, FileText } from "lucide-react";
import { Page } from "../types";

interface TrashViewProps {
  onShowToast: (msg: string) => void;
  onRefreshPages: () => void;
}

export default function TrashView({ onShowToast, onRefreshPages }: TrashViewProps) {
  const [trashPages, setTrashPages] = useState<Page[]>([]);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = () => {
    fetch("/api/pages/trash")
      .then(res => res.json())
      .then(data => setTrashPages(data))
      .catch(err => console.error(err));
  };

  const handleRestore = (id: string, name: string) => {
    fetch(`/api/pages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTrash: false })
    })
      .then(res => res.json())
      .then(() => {
        fetchTrash();
        onRefreshPages();
        onShowToast(`Restored page: "${name}"`);
      })
      .catch(err => console.error(err));
  };

  const handleDeletePermanent = (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete "${name}"? This action is irreversible.`)) return;

    fetch(`/api/pages/${id}`, {
      method: "DELETE"
    })
      .then(() => {
        fetchTrash();
        onRefreshPages();
        onShowToast(`Permanently deleted: "${name}"`);
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-10 py-12">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-red-500">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-[28px] font-bold text-black tracking-tight leading-none mb-1">
            Trash Bin
          </h2>
          <p className="text-[12.5px] text-gray-400 font-medium leading-none">
            Manage soft-deleted notebooks and documentation.
          </p>
        </div>
      </div>

      <hr className="my-8 border-gray-100" />

      {trashPages.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-200 rounded-xl bg-white text-gray-400">
          <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <p className="text-[14px] font-semibold text-gray-600 mb-0.5">Your Trash is empty</p>
          <p className="text-[11px] text-gray-400">Pages you delete will accumulate here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trashPages.map((page) => (
            <div
              key={page.id}
              className="group flex items-center justify-between p-4 bg-white border border-[#eaeaea] rounded-xl hover:border-black transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[18px] select-none flex-shrink-0">{page.emoji || "📄"}</span>
                <span className="font-semibold text-gray-800 text-[14px] truncate">
                  {page.title}
                </span>
                <span className="text-[10px] bg-red-50 border border-red-100 text-red-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Trashed
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 hover:bg-black hover:text-white rounded-lg text-[12px] font-semibold transition-all cursor-pointer text-gray-600"
                  onClick={() => handleRestore(page.id, page.title)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
                <button
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete permanently"
                  onClick={() => handleDeletePermanent(page.id, page.title)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety notices footer box */}
      <div className="mt-12 p-4 bg-amber-50/50 border border-amber-100/60 rounded-xl flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-[12.5px] font-bold text-amber-800">Security & Retention</h4>
          <p className="text-[11.5px] text-amber-700/80 leading-relaxed font-semibold">
            Pages moved here are excluded from search results, sidebar navigation panels, and quick finds. Deleting elements here will clear their block references permanently from state files.
          </p>
        </div>
      </div>
    </div>
  );
}
