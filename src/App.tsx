import React, { useState, useEffect } from "react";
import { 
  Menu, 
  Sparkles, 
  Quote, 
  BookOpen, 
  Lightbulb, 
  Coffee, 
  FolderPlus, 
  MapPin, 
  DollarSign, 
  Dumbbell, 
  Settings, 
  Check, 
  X,
  FileText,
  Trash,
  HelpCircle,
  Plus
} from "lucide-react";

import Sidebar from "./components/Sidebar.js";
import BlockEditor from "./components/BlockEditor.js";
import HabitTrackerView from "./components/HabitTrackerView.js";
import TasksView from "./components/TasksView.js";
import UpdatesView from "./components/UpdatesView.js";
import SettingsView from "./components/SettingsView.js";
import SearchModal from "./components/SearchModal.js";
import TrashView from "./components/TrashView.js";
import AssetPortfolioView from "./components/AssetPortfolioView.js";
import FitnessMatrixView from "./components/FitnessMatrixView.js";
import NotificationsView from "./components/NotificationsView.js";
import { Page, User } from "./types.js";

export default function App() {
  const [activeView, setActiveView] = useState<string>("Page");
  const [activePageId, setActivePageId] = useState<string | null>("page-1");
  const [pages, setPages] = useState<Page[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean } | null>(null);

  // Second Brain Quick Inbox note pad state
  const [inboxText, setInboxText] = useState("");

  useEffect(() => {
    fetchPages();
    fetchUserProfile();
    const onlineTimer = setInterval(() => fetch("/api/user/online", { method: "POST" }).then(() => fetchUserProfile()).catch(() => null), 30000);
    fetch("/api/user/online", { method: "POST" }).catch(() => null);
    
    // Setup keybindings for Cmd+K Search modal focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); clearInterval(onlineTimer); };
  }, []);

  const fetchPages = () => {
    fetch("/api/pages")
      .then(res => res.json())
      .then((data: Page[]) => {
        setPages(data);
        // Find default active page if none exists or is missing
        if (data.length > 0 && !activePageId) {
          const first = data.find(p => !p.isTrash);
          if (first) {
            setActivePageId(first.id);
            setActiveView("Page");
          }
        }
      })
      .catch(err => console.error("Could not load workspace pages", err));
  };

  const fetchUserProfile = () => {
    fetch("/api/user")
      .then(res => res.json())
      .then((data: User) => setCurrentUser(data))
      .catch(err => console.error("Could not fetch user profile", err));
  };

  const handleShowToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, show: false } : null);
    }, 3000);
  };

  // Navigates Sidebar links
  const handleNavigateView = (view: string) => {
    setActiveView(view);
    setActivePageId(null);
  };

  const handleNavigatePage = (pageId: string) => {
    setActivePageId(pageId);
    setActiveView("Page");
  };


  const createPageWithBlocks = async (title: string, emoji: string, blocks: any[]) => {
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, emoji })
    });
    const data = await res.json();
    await fetch(`/api/pages/${data.page.id}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks })
    });
    await fetchPages();
    setActivePageId(data.page.id);
    setActiveView("Page");
    return data.page;
  };

  const handleCreateNewPage = () => {
    const defaultEmoji = ["📓", "💻", "💡", "🎨", "📝", "🚀"][Math.floor(Math.random() * 6)];
    const title = prompt("Enter new page title:", "Untitled Page");
    if (title === null) return;

    fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title: title.trim() || "Untitled Page", 
        emoji: defaultEmoji 
      })
    })
      .then(res => res.json())
      .then(data => {
        fetchPages();
        setActivePageId(data.page.id);
        setActiveView("Page");
        handleShowToast("Created new workspace page!");
      })
      .catch(err => console.error(err));
  };

  const handleToggleFavoritePage = (page: Page) => {
    fetch(`/api/pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !page.isFavorite })
    })
      .then(res => res.json())
      .then(() => {
        fetchPages();
        handleShowToast(page.isFavorite ? "Removed from Favorites" : "Added to Favorites!");
      })
      .catch(err => console.error(err));
  };

  const handleSoftDeletePage = (page: Page) => {
    if (!confirm(`Are you sure you want to move "${page.title}" to the Trash Bin?`)) return;

    fetch(`/api/pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTrash: true })
    })
      .then(res => res.json())
      .then(() => {
        // Reset active selection
        setActivePageId(null);
        fetchPages();
        setActiveView("Life OS");
        handleShowToast("Moved page to Trash");
      })
      .catch(err => console.error(err));
  };

  const activePageObject = pages.find(p => p.id === activePageId);

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-[#37352F] flex">
      {/* Toast Notification Element */}
      {toast?.show && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm bg-black text-white px-4 py-3 rounded-xl shadow-lg border border-gray-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-[13px] font-semibold tracking-wide">{toast.message}</span>
          </div>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={() => setToast(prev => prev ? { ...prev, show: false } : null)}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Search popover Command Panel */}
      <SearchModal 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigatePage={handleNavigatePage}
        onNavigateView={handleNavigateView}
      />

      {/* Sidebar navigation */}
      <Sidebar 
        pages={pages}
        activeView={activeView}
        activePageId={activePageId}
        currentUser={currentUser}
        onNavigateView={handleNavigateView}
        onNavigatePage={handleNavigatePage}
        onCreatePage={handleCreateNewPage}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Primary Layout offset main content area (240px sidebar spacing) */}
      <main className="flex-1 min-w-0 pl-[240px] transition-all duration-300">
        
        {/* Top Floating Control header strip */}
        <header className="h-14 px-10 border-b border-[#EDEDEB] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-40 select-none">
          {/* Breadcrumb route displays */}
          <div className="flex items-center gap-2 text-gray-400 font-medium text-[13px]">
            <span>Personal Workspace</span>
            <span>/</span>
            <span className="text-black font-semibold">
              {activeView === "Page" ? (activePageObject?.title || "Document View") : activeView}
            </span>
          </div>

          {/* Quick Context actions based on page state */}
          <div className="flex items-center gap-2.5">
            {activeView === "Page" && activePageObject && (
              <>
                <button
                  className={`px-3 py-1.5 border border-[#eaeaea] bg-white rounded-lg text-[12px] font-semibold cursor-pointer shadow-3xs transition-all ${
                    activePageObject.isFavorite 
                      ? "text-amber-500 hover:text-amber-600" 
                      : "text-gray-500 hover:text-black hover:border-black"
                  }`}
                  onClick={() => handleToggleFavoritePage(activePageObject)}
                >
                  {activePageObject.isFavorite ? "★ Favorited" : "☆ Favorite"}
                </button>
                
                <button
                  className="px-3 py-1.5 border border-[#eaeaea] bg-white hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 rounded-lg text-[12px] font-semibold cursor-pointer shadow-3xs transition-all"
                  onClick={() => handleSoftDeletePage(activePageObject)}
                  title="Archive page to trash"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <span className="text-gray-300">|</span>
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5 grayscale opacity-75">
              <span className="text-emerald-500">● Online</span>
            </span>
          </div>
        </header>

        {/* VIEW CONDITIONAL CONTROLLERS */}
        <div className="transition-all duration-300">
          
          {/* 1. Life OS themed layout page */}
          {activeView === "Life OS" && (
            <div className="w-full max-w-[1000px] mx-auto px-10 py-12">
              <div className="mb-8">
                <h2 className="text-[40px] font-black text-[#37352F] tracking-tight leading-none mb-3">
                  Life OS
                </h2>
                <div className="flex items-center gap-2 p-3 bg-[#F7F6F3] border-l-3 border-[#37352F] rounded-r-lg text-[#7D7C78] italic text-[14px]">
                  <Quote className="w-4 h-4 text-[#37352F] flex-shrink-0" />
                  <span>"The unexamined life is not worth living." — Socrates</span>
                </div>
              </div>

              {/* Grid bento dashboard views */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {/* Vision Box */}
                <div className="bg-white border border-[#EDEDEB] rounded-xl p-6 shadow-none flex flex-col justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#37352F] flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>Vision Board</span>
                    </h3>
                    <p className="text-[13px] text-[#7D7C78] font-medium leading-relaxed mb-4">
                      Define core year boundaries and strategic career horizons.
                    </p>
                    <ul className="space-y-2 text-[13px] text-[#37352F] font-medium">
                      <li className="flex items-center gap-2">✔ Standardize creative workflows</li>
                      <li className="flex items-center gap-2">✔ Maintain 8.5hrs of recovery sleep</li>
                      <li className="flex items-center gap-2">✔ Run 10k half-marathon sprint</li>
                    </ul>
                  </div>
                  <button 
                    className="mt-6 text-[11.5px] font-bold uppercase tracking-wider text-[#37352F] hover:underline cursor-pointer text-left"
                    onClick={() => createPageWithBlocks("Vision Board", "✨", [
                      { type: "HEADING_1", content: { text: "Vision Board" } },
                      { type: "TEXT", content: { text: "Tuliskan visi tahunan, target utama, dan batasan hidup/kerja Anda di sini." } },
                      { type: "TODO", content: { text: "Tentukan 3 prioritas utama tahun ini", completed: false } }
                    ]).then(() => handleShowToast("Vision Board page created"))}
                  >
                    Configure Vision →
                  </button>
                </div>

                {/* Financial overview ledger box */}
                <div className="bg-white border border-[#EDEDEB] rounded-xl p-6 shadow-none flex flex-col justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#37352F] flex items-center gap-2 mb-3">
                      <DollarSign className="w-4.5 h-4.5 text-emerald-600" />
                      <span>Asset Portfolio</span>
                    </h3>
                    <p className="text-[13px] text-[#7D7C78] font-medium leading-relaxed mb-4">
                      Aggregate dynamic allocations, budgets, and capital streams.
                    </p>
                    <div className="space-y-2 font-semibold text-[#37352F]">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-[#7D7C78]">Net Invested</span>
                        <span>$42,500</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-[#7D7C78]">Savings Target</span>
                        <span>82% met</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="mt-6 text-[11.5px] font-bold uppercase tracking-wider text-[#37352F] hover:underline cursor-pointer text-left"
                    onClick={() => { setActiveView("Asset Portfolio"); setActivePageId(null); handleShowToast("Opened Asset Portfolio"); }}
                  >
                    Open Ledger →
                  </button>
                </div>

                {/* Fitness metrics */}
                <div className="bg-white border border-[#EDEDEB] rounded-xl p-6 shadow-none flex flex-col justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#37352F] flex items-center gap-2 mb-3">
                      <Dumbbell className="w-4.5 h-4.5 text-[#37352F]" />
                      <span>Fitness Matrix</span>
                    </h3>
                    <p className="text-[13px] text-[#7D7C78] font-medium leading-relaxed mb-4">
                      Monitor athletic intervals, resting heart rates, and workout splits.
                    </p>
                    <div className="flex gap-2">
                      <div className="bg-[#F7F6F3] rounded-lg p-2 flex-1 text-center border border-[#EDEDEB]">
                        <span className="block text-[11px] text-[#7D7C78] font-bold uppercase">Weight</span>
                        <span className="text-[15px] font-black text-[#37352F]">74.5 kg</span>
                      </div>
                      <div className="bg-[#F7F6F3] rounded-lg p-2 flex-1 text-center border border-[#EDEDEB]">
                        <span className="block text-[11px] text-[#7D7C78] font-bold uppercase">Workouts</span>
                        <span className="text-[15px] font-black text-[#37352F]">4/wk</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="mt-6 text-[11.5px] font-bold uppercase tracking-wider text-[#37352F] hover:underline cursor-pointer text-left"
                    onClick={() => { setActiveView("Fitness Matrix"); setActivePageId(null); handleShowToast("Opened Fitness Matrix"); }}
                  >
                    View Schedule →
                  </button>
                </div>
              </div>

              {/* Bucket List Items lists */}
              <div className="bg-white border border-[#EDEDEB] rounded-xl p-6 shadow-none">
                <h3 className="text-[16px] font-bold text-[#37352F] mb-4 flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-rose-500" />
                  <span>Adventure Ledger (Travel Bucket-list)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] text-gray-700 font-medium">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#EDEDEB] cursor-pointer text-[#37352F] focus:ring-0" defaultChecked />
                    <span className="line-through text-[#7D7C78]">Summited Mount Fuji volcano, Japan (Sunset hike)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#EDEDEB] cursor-pointer text-[#37352F] focus:ring-0" />
                    <span className="text-[#37352F]">Explore Lofoten Island fjords, Norway (Northern lights winter cabin)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#EDEDEB] cursor-pointer text-[#37352F] focus:ring-0" />
                    <span className="text-[#37352F]">Roadtrip Route 66 historic trails (Classic mustang drive)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#EDEDEB] cursor-pointer text-[#37352F] focus:ring-0" defaultChecked />
                    <span className="line-through text-[#7D7C78]">Backpack Rome ancient forum, Italy</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 2. Second Brain Layout directory page */}
          {activeView === "Second Brain" && (
            <div className="w-full max-w-[1000px] mx-auto px-10 py-12">
              <div className="mb-10">
                <h2 className="text-[40px] font-black text-[#37352F] tracking-tight leading-none mb-2">
                  Second Brain
                </h2>
                <p className="text-[15px] text-[#7D7C78] max-w-xl font-medium">
                  An externalized system to capture raw flashes, capture project briefs, and synthesize books.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Inbox scratch pad log */}
                <div className="lg:col-span-1 bg-white border border-[#EDEDEB] rounded-xl p-6 shadow-none h-fit">
                  <h3 className="text-[15px] font-bold text-[#37352F] flex items-center gap-2 mb-3">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span>Quick Flash Inbox</span>
                  </h3>
                  <p className="text-[11.5px] text-[#7D7C78] font-medium leading-relaxed mb-4">
                    Draft raw insights before sorting them into notebooks. Single key clicks saving.
                  </p>
                  <textarea
                    className="w-full h-32 p-3 bg-[#F7F6F3] border border-[#EDEDEB] rounded-lg text-[13px] text-[#37352F] focus:outline-none focus:border-[#37352F] focus:bg-white transition-all resize-none"
                    placeholder="Capture raw ideas here..."
                    value={inboxText}
                    onChange={(e) => setInboxText(e.target.value)}
                  />
                  <button 
                    className="mt-3 w-full bg-[#37352F] hover:bg-[#37352F]/90 text-white text-[12px] font-semibold py-2 rounded-lg transition-all"
                    onClick={() => {
                      if (!inboxText.trim()) return;
                      createPageWithBlocks(`Idea - ${new Date().toLocaleString()}`, "💡", [
                        { type: "HEADING_1", content: { text: "Captured Idea" } },
                        { type: "TEXT", content: { text: inboxText.trim() } }
                      ]).then(() => {
                        handleShowToast("Idea saved as a new page in database");
                        setInboxText("");
                      });
                    }}
                  >
                     Save Idea as Page
                  </button>
                </div>

                {/* Right Side: Bento Resources cards directories */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Category boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Media Book reviews */}
                    <div className="bg-[#F7F6F3] border border-[#EDEDEB] p-5 rounded-xl hover:border-[#37352F] transition-all cursor-pointer" onClick={() => createPageWithBlocks("Book Syntheses", "📚", [{ type: "HEADING_1", content: { text: "Book Syntheses" } }, { type: "TEXT", content: { text: "Kumpulkan ringkasan buku, poin penting, kutipan, dan insight action-oriented." } }])}>
                      <BookOpen className="w-5 h-5 text-gray-700 mb-3" />
                      <h4 className="text-[14px] font-bold text-[#37352F] mb-1">Book Syntheses</h4>
                      <p className="text-[11.5px] text-[#7D7C78] font-semibold uppercase tracking-wider">
                         8 active files
                      </p>
                    </div>

                    {/* Quick ideations */}
                    <div className="bg-[#F7F6F3] border border-[#EDEDEB] p-5 rounded-xl hover:border-[#37352F] transition-all cursor-pointer" onClick={() => createPageWithBlocks("Ideation & Brainstorm", "💡", [{ type: "HEADING_1", content: { text: "Ideation & Brainstorm" } }, { type: "TEXT", content: { text: "Simpan ide mentah, rencana eksperimen, dan konsep project di sini." } }])}>
                      <Lightbulb className="w-5 h-5 text-gray-700 mb-3" />
                      <h4 className="text-[14px] font-bold text-[#37352F] mb-1">Ideation & Brainstorm</h4>
                      <p className="text-[11.5px] text-[#7D7C78] font-semibold uppercase tracking-wider">
                         14 ideas tagged
                      </p>
                    </div>
                  </div>

                  {/* Active Projects directories logs list table */}
                  <div className="bg-white border border-[#EDEDEB] rounded-xl p-6 shadow-none">
                    <h3 className="text-[15px] font-bold text-[#37352F] mb-4 flex items-center gap-2">
                      <FolderPlus className="w-4.5 h-4.5 text-sky-500" />
                      <span>Projects Directory</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-[#F7F6F3] p-2.5 rounded-lg border border-transparent hover:border-[#EDEDEB] cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#37352F]">Quantum Computing research briefs</p>
                          <span className="text-[10px] text-[#7D7C78] font-bold uppercase tracking-wider">Reference folder</span>
                        </div>
                        <span className="text-[11px] bg-[#E2F6D3] text-[#37352F] px-2 py-0.5 rounded font-bold">ACTIVE</span>
                      </div>

                      <div className="flex justify-between items-center bg-[#F7F6F3] p-2.5 rounded-lg border border-transparent hover:border-[#EDEDEB] cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#37352F]">SaaS Micro-launch Strategy</p>
                          <span className="text-[10px] text-[#7D7C78] font-bold uppercase tracking-wider">Resource manual</span>
                        </div>
                        <span className="text-[11px] bg-[#FFD5D2] text-[#37352F] px-2 py-0.5 rounded font-bold">ARCHIVED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Habit Tracker view */}
          {activeView === "Habit Tracker" && (
            <HabitTrackerView onShowToast={handleShowToast} />
          )}

          {/* 4. Tasks list view */}
          {activeView === "Tasks" && (
            <TasksView onShowToast={handleShowToast} />
          )}

          {/* 5. Updates view */}
          {activeView === "Updates" && (
            <UpdatesView 
              onShowToast={handleShowToast}
              onNavigatePage={handleNavigatePage}
            />
          )}

          {activeView === "Asset Portfolio" && (
            <AssetPortfolioView onShowToast={handleShowToast} />
          )}

          {activeView === "Fitness Matrix" && (
            <FitnessMatrixView onShowToast={handleShowToast} />
          )}

          {activeView === "Notifications" && (
            <NotificationsView onShowToast={handleShowToast} />
          )}

          {/* 6. Settings view */}
          {activeView === "Settings" && (
            <SettingsView 
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
              onShowToast={handleShowToast}
            />
          )}

          {/* 7. Trash bin view */}
          {activeView === "Trash" && (
            <TrashView 
              onShowToast={handleShowToast}
              onRefreshPages={fetchPages}
            />
          )}

          {/* 8. Generic dynamic canvas text editor view */}
          {activeView === "Page" && activePageId && (
            <BlockEditor 
              pageId={activePageId}
              onShowToast={handleShowToast}
            />
          )}

        </div>
      </main>
    </div>
  );
}
