import React, { useState } from "react";
import { 
  FolderOpen, 
  Brain, 
  CheckCircle, 
  CheckSquare, 
  Settings, 
  Trash2, 
  Plus, 
  Search, 
  Clock,
  Menu,
  ChevronDown,
  ChevronsUpDown,
  Layout,
  User,
  DollarSign,
  Dumbbell,
  Bell
} from "lucide-react";
import { Page, User as UserType } from "../types";

interface SidebarProps {
  pages: Page[];
  activeView: string;
  activePageId: string | null;
  currentUser: UserType | null;
  onNavigateView: (view: string) => void;
  onNavigatePage: (pageId: string) => void;
  onCreatePage: () => void;
  onOpenSearch: () => void;
}

export default function Sidebar({
  pages,
  activeView,
  activePageId,
  currentUser,
  onNavigateView,
  onNavigatePage,
  onCreatePage,
  onOpenSearch,
}: SidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  // Split favorite pages vs normal
  const favPages = pages.filter(p => p.isFavorite && !p.isTrash);
  const otherPages = pages.filter(p => !p.isFavorite && !p.isTrash);

  const renderPageLink = (page: Page) => {
    const staticView = page.title === "Life OS" || page.title === "Second Brain" ? page.title : null;
    const isActive = staticView ? activeView === staticView : activeView === "Page" && activePageId === page.id;
    return (
      <button
        key={page.id}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[14px] transition-all cursor-pointer truncate ${
          isActive
            ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
            : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
        }`}
        onClick={() => staticView ? onNavigateView(staticView) : onNavigatePage(page.id)}
      >
        <span className="flex items-center gap-2.5 truncate">
          <span className="text-[15px]">{page.emoji || "📄"}</span>
          <span className="truncate">{page.title}</span>
        </span>
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#F7F6F3] border-r border-[#EDEDEB] flex flex-col z-50">
      {/* Profile / Workspace Dropdown */}
      <div 
        className="p-3 border-b border-[#EDEDEB] hover:bg-[#EBEAE4] transition-colors duration-200 cursor-pointer flex items-center justify-between group relative"
        onClick={() => setProfileOpen(!profileOpen)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-[#37352F] flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
            PW
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[#37352F] text-[13.5px] truncate leading-tight">
              Personal Workspace
            </span>
            <span className="text-[10px] text-[#7D7C78] font-semibold tracking-wider uppercase leading-none mt-0.5">
              Individual Plan
            </span>
          </div>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-[#7D7C78] group-hover:text-[#37352F] flex-shrink-0 transition-colors" />

        {profileOpen && (
          <div className="absolute top-full left-3 right-3 bg-white border border-[#EDEDEB] rounded-lg shadow-lg z-50 py-1 mt-1 animate-in fade-in duration-100">
            <button 
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] hover:bg-gray-50 text-gray-700 font-medium"
              onClick={() => onNavigateView("Settings")}
            >
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>Julian Alexander</span>
            </button>
            <div className="border-t border-[#EDEDEB] my-1" />
            <div className="px-3 py-1.5 text-[10px] text-gray-400 font-semibold uppercase">
              Current Plan: FREE
            </div>
          </div>
        )}
      </div>

      {/* Quick Access List */}
      <div className="p-2 space-y-0.5">
        <button
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4] text-[14px] transition-all cursor-pointer font-medium"
          onClick={onOpenSearch}
        >
          <Search className="w-4 h-4 text-[#7D7C78]" />
          <span>Quick Find</span>
        </button>

        <button
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
            activeView === "Updates"
              ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
              : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
          }`}
          onClick={() => onNavigateView("Updates")}
        >
          <Clock className="w-4 h-4 text-[#7D7C78]" />
          <span>Updates</span>
        </button>

        <button
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
            activeView === "Settings"
              ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
              : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
          }`}
          onClick={() => onNavigateView("Settings")}
        >
          <Settings className="w-4 h-4 text-[#7D7C78]" />
          <span>Settings</span>
        </button>
      </div>

      {/* Main Pages Directories */}
      <nav className="flex-1 overflow-y-auto no-scrollbar p-2 mt-2 space-y-4">
        {/* Favorites Section */}
        {favPages.length > 0 && (
          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-[#7D7C78] uppercase tracking-widest leading-none mb-2">
              Favorites
            </h3>
            {favPages.map(renderPageLink)}
          </div>
        )}

        {/* Workspace Pages (Life OS, Second Brain, Habit, Tasks) */}
        <div className="space-y-1">
          <h3 className="px-3 text-[10px] font-bold text-[#7D7C78] uppercase tracking-widest leading-none mb-2">
            Workspace
          </h3>
          
          {/* Static Views configured as high contrast navigation */}
          <button
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
              activeView === "Life OS"
                ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
                : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
            }`}
            onClick={() => onNavigateView("Life OS")}
          >
            <FolderOpen className="w-4 h-4 text-[#7D7C78]" />
            <span>Life OS</span>
          </button>

          <button
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
              activeView === "Second Brain"
                ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
                : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
            }`}
            onClick={() => onNavigateView("Second Brain")}
          >
            <Brain className="w-4 h-4 text-[#7D7C78]" />
            <span>Second Brain</span>
          </button>

          <button
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
              activeView === "Habit Tracker"
                ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
                : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
            }`}
            onClick={() => onNavigateView("Habit Tracker")}
          >
            <CheckCircle className="w-4 h-4 text-[#7D7C78]" />
            <span>Habit Tracker</span>
          </button>

          <button
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
              activeView === "Tasks"
                ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
                : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
            }`}
            onClick={() => onNavigateView("Tasks")}
          >
            <CheckSquare className="w-4 h-4 text-[#7D7C78]" />
            <span>Tasks</span>
          </button>
          <button
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
              activeView === "Asset Portfolio"
                ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
                : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
            }`}
            onClick={() => onNavigateView("Asset Portfolio")}
          >
            <DollarSign className="w-4 h-4 text-[#7D7C78]" />
            <span>Asset Portfolio</span>
          </button>

          <button
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
              activeView === "Fitness Matrix"
                ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
                : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
            }`}
            onClick={() => onNavigateView("Fitness Matrix")}
          >
            <Dumbbell className="w-4 h-4 text-[#7D7C78]" />
            <span>Fitness Matrix</span>
          </button>

          <button
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
              activeView === "Notifications"
                ? "bg-[#EBEAE4] text-[#37352F] font-semibold"
                : "text-[#7D7C78] hover:text-[#37352F] hover:bg-[#EBEAE4]"
            }`}
            onClick={() => onNavigateView("Notifications")}
          >
            <Bell className="w-4 h-4 text-[#7D7C78]" />
            <span>Notifications</span>
          </button>

          {/* User Custom Dynamic Pages */}
          {otherPages.length > 0 && (
            <div className="pt-2 border-t border-[#EDEDEB] mt-2 space-y-1">
              {otherPages.map(renderPageLink)}
            </div>
          )}
        </div>
      </nav>

      {/* New Page CTA / Trash footer */}
      <div className="p-3 border-t border-[#EDEDEB] bg-[#F7F6F3]">
        <button
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#37352F] hover:bg-[#37352F]/90 text-white rounded-lg text-[13px] font-semibold tracking-wide shadow-xs transition-all cursor-pointer active:scale-95 group"
          onClick={onCreatePage}
        >
          <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
          <span>New Page</span>
        </button>

        <div className="mt-3 flex items-center justify-between px-2 text-[#7D7C78] hover:text-[#37352F] transition-colors">
          <button 
            className="flex items-center gap-2 text-[12px] font-medium cursor-pointer"
            onClick={() => onNavigateView("Trash")}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Trash</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
