import React, { useState, useEffect, useRef } from "react";
import { Search, FileText, CheckSquare, X, ChevronRight, Clock, Star, Users, CornerDownLeft } from "lucide-react";
import { Page, Task, SearchItem } from "../types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigatePage: (pageId: string) => void;
  onNavigateView: (view: string) => void;
}

export default function SearchModal({ isOpen, onClose, onNavigatePage, onNavigateView }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [filter, setFilter] = useState("All");
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Query API in real-time
  useEffect(() => {
    if (!isOpen) return;
    
    const debounceTimer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setResults(data);
        })
        .catch(err => console.error("Search query failed", err));
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [query, isOpen]);

  // Handle ESC button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Filter local state based on chip selected
  const filteredResults = results.filter(item => {
    if (filter === "All") return true;
    if (filter === "Pages") return item.type === "page";
    if (filter === "Tasks") return item.type === "task";
    if (filter === "Assets") return item.type === "asset";
    if (filter === "Fitness") return item.type === "fitness";
    return false; // Files, People, Meetings etc. can show empty lists for mock fidelity
  });

  const chips = ["All", "Pages", "Tasks", "Assets", "Fitness"];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-[#37352f]/10 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-[650px] bg-white border border-[#eaeaea] rounded-xl shadow-xl flex flex-col p-4 animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[#f1f1f1] pb-3 mb-3">
          <Search className="absolute left-3 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            className="w-full pl-10 pr-6 py-2 border-0 bg-transparent text-gray-800 text-[16px] placeholder-gray-400 focus:outline-none focus:ring-0"
            placeholder="Search for pages, notes, or tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters Chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-3 border-b border-[#f9f9f9] mb-4">
          {chips.map((chip) => (
            <button
              key={chip}
              className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-all ${
                filter === chip
                  ? "bg-black text-white border-black"
                  : "bg-[#f5f5f5] text-gray-600 border-[#eaeaea] hover:bg-gray-100"
              }`}
              onClick={() => setFilter(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Content Panel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[380px] overflow-y-auto no-scrollbar pb-3">
          {/* Main Search Results (SPAN 2) */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Top Matches
              </h3>
              {filteredResults.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-[13px] border border-dashed border-gray-100 rounded-lg">
                  No matching results found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredResults.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3 p-2.5 rounded-lg border border-transparent hover:border-[#eaeaea] hover:bg-[#f9f9f9] transition-all cursor-pointer"
                      onClick={() => {
                        if (item.type === "page") {
                          onNavigatePage(item.id);
                        } else if (item.type === "task") {
                          onNavigateView("Tasks");
                        } else if (item.type === "asset") {
                          onNavigateView("Asset Portfolio");
                        } else if (item.type === "fitness") {
                          onNavigateView("Fitness Matrix");
                        }
                        onClose();
                      }}
                    >
                      <div className="mt-0.5 p-1.5 rounded bg-gray-50 border border-[#eaeaea] text-gray-500 group-hover:text-black transition-colors">
                        {item.type === "page" ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <CheckSquare className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="text-[14px] font-medium text-gray-800 truncate">
                            {item.title}
                          </h4>
                          {item.timeInfo && (
                            <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                              {item.timeInfo}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side Suggestions Panel */}
          <div className="space-y-5 border-l border-gray-100 pl-4">
            {/* Recents */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Recent
              </h3>
              <ul className="space-y-2">
                <li 
                  className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-black cursor-pointer group"
                  onClick={() => { onNavigatePage("page-1"); onClose(); }}
                >
                  <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-black transition-colors" />
                  <span className="truncate">Getting Started</span>
                </li>
                <li 
                  className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-black cursor-pointer group"
                  onClick={() => { onNavigateView("Habit Tracker"); onClose(); }}
                >
                  <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-black transition-colors" />
                  <span className="truncate">Habit Tracker</span>
                </li>
                <li 
                  className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-black cursor-pointer group"
                  onClick={() => { onNavigateView("Settings"); onClose(); }}
                >
                  <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-black transition-colors" />
                  <span className="truncate">Workspace Settings</span>
                </li>
              </ul>
            </div>

            {/* Suggested Views */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Suggested
              </h3>
              <div className="space-y-1.5">
                <div 
                  className="p-2 border border-[#eaeaea] bg-gray-50 hover:bg-[#f9f9f9] hover:border-[#eaeaea] rounded-lg cursor-pointer transition-all"
                  onClick={() => { onNavigatePage("page-1"); onClose(); }}
                >
                  <div className="flex items-center gap-1.5 text-black font-semibold text-[11px]">
                    <Star className="w-3 h-3 text-black fill-black" />
                    <span>Favorites</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 lines-clamp-2">
                    Quick access to key assets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Guides Footer */}
        <div className="border-t border-gray-100 pt-3 mt-2 flex items-center justify-between text-[11px] text-gray-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-50 border border-gray-200 rounded">Esc</kbd>
              <span>Close</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1 py-0.5 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
              <CornerDownLeft className="w-2.5 h-2.5" />
            </kbd>
            <span>Open Result</span>
          </div>
        </div>
      </div>
    </div>
  );
}
