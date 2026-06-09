import React, { useState, useEffect } from "react";
import { Clock, Edit3, MessageSquare, PlusCircle, CheckSquare, Trash2, Archive, CheckCircle, RotateCcw } from "lucide-react";
import { Activity } from "../types";

interface UpdatesViewProps {
  onShowToast: (msg: string) => void;
  onNavigatePage: (pageId: string) => void;
}

export default function UpdatesView({ onShowToast, onNavigatePage }: UpdatesViewProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<"All" | "Following" | "Archive">("All");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/activities")
      .then(res => res.json())
      .then(data => setActivities(data))
      .catch(err => console.error("Could not fetch activities", err));
  }, []);

  const handleAction = (id: string, action: string) => {
    setReadIds(prev => {
      const copy = new Set(prev);
      copy.add(id);
      return copy;
    });
    onShowToast(`${action} successful`);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "Edited":
        return <Edit3 className="w-4 h-4 text-gray-700" />;
      case "Mention":
        return <MessageSquare className="w-4 h-4 text-gray-700" />;
      case "Created":
        return <PlusCircle className="w-4 h-4 text-gray-700" />;
      case "Completed":
        return <CheckSquare className="w-4 h-4 text-gray-700" />;
      case "System":
        return <Trash2 className="w-4 h-4 text-gray-700" />;
      default:
        return <Clock className="w-4 h-4 text-gray-700" />;
    }
  };

  const getBubbleBg = (category: string) => {
    if (category === "Mention") return "bg-amber-100";
    return "bg-gray-100";
  };

  // Filter out items that have been marked read/dismissed or match following tab
  const activeActivities = activities.filter(act => {
    if (readIds.has(act.id)) return false;
    if (filter === "Following") {
      return act.category === "Edited" || act.category === "Completed";
    }
    if (filter === "Archive") return false; // Archives represented as empty/dismissed logs
    return true;
  });

  return (
    <div className="w-full max-w-[800px] mx-auto px-10 py-12">
      {/* Title Header */}
      <div className="mb-6">
        <h2 className="text-[40px] font-bold text-black tracking-tight leading-none">
          Updates
        </h2>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex gap-8 mb-10 border-b border-[#c4c7c7]/30">
        {(["All", "Following", "Archive"] as const).map((tab) => (
          <button
            key={tab}
            className={`pb-3 border-b-2 text-[14px] font-semibold transition-colors cursor-pointer ${
              filter === tab
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-black"
            }`}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-10 pb-24">
        {activeActivities.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-[14px]">
            No recent updates in this view. Everything's clean!
          </div>
        ) : (
          <section>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Recent Feed Logs
            </h3>
            <div className="space-y-2">
              {activeActivities.map((act) => (
                <div
                  key={act.id}
                  className="group relative flex items-start gap-4 p-4 -mx-4 rounded-xl hover:bg-[#f7f3f2]/40 transition-all duration-200"
                >
                  {/* Bubble Category Icon */}
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center border border-[#c4c7c7]/20 ${getBubbleBg(act.category)}`}>
                    {getIcon(act.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-black text-[14px]">
                        {act.userName}
                      </span>
                      <span className="text-gray-400 text-[14px]">
                        {act.action}
                      </span>
                      <button
                        className="font-medium text-black hover:underline text-[14px] truncate text-left focus:outline-none"
                        onClick={() => {
                          if (act.targetName === "Habit Tracker") {
                            // Link to Habits State
                          } else {
                            onNavigatePage("page-1");   
                          }
                        }}
                      >
                        {act.targetName}
                      </button>
                    </div>
                    <p className={`text-gray-500 text-[14px] mt-1 ${act.category === "Mention" ? "italic" : ""}`}>
                      {act.detail}
                    </p>
                    <span className="text-gray-400 text-[11px] font-semibold tracking-wide uppercase mt-1.5 block opacity-75">
                      {act.timeStr}
                    </span>
                  </div>

                  {/* Micro Interaction Action Hover buttons */}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all duration-150 absolute right-4 top-4">
                    {act.category === "System" ? (
                      <button
                        className="p-1.5 text-gray-400 hover:text-black hover:bg-white rounded border border-[#eaeaea] shadow-xs cursor-pointer transition-colors"
                        title="Restore"
                        onClick={() => handleAction(act.id, "Restore")}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <>
                        <button
                          className="p-1.5 text-gray-400 hover:text-black hover:bg-white rounded border border-[#eaeaea] shadow-xs cursor-pointer transition-colors"
                          title="Archive"
                          onClick={() => handleAction(act.id, "Archive")}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-black hover:bg-white rounded border border-[#eaeaea] shadow-xs cursor-pointer transition-colors"
                          title="Mark as read"
                          onClick={() => handleAction(act.id, "Read status check")}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
