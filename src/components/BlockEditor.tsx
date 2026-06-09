import React, { useState, useEffect, useRef } from "react";
import { Plus, GripVertical, CheckSquare, Trash, Trash2, Heading1, ListCollapse, TableProperties, Image as ImageIcon, Upload } from "lucide-react";
import { Block, Page } from "../types";

interface BlockEditorProps {
  pageId: string;
  onShowToast: (msg: string) => void;
}

export default function BlockEditor({ pageId, onShowToast }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [page, setPage] = useState<Page | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = () => {
    fetch(`/api/pages/${pageId}`)
      .then((res) => res.json())
      .then((data) => {
        setPage(data.page);
        // Ensure blocks content are object-parsed representation
        const parsed = (data.blocks || []).map((b: any) => ({
          ...b,
          content: typeof b.content === "string" ? JSON.parse(b.content) : b.content,
        }));
        setBlocks(parsed);
      })
      .catch((err) => console.error("Could not fetch page details", err));
  };

  // Debounced auto-save block changes
  const triggerAutoSave = (updatedBlocks: Block[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      fetch(`/api/pages/${pageId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: updatedBlocks }),
      })
        .then((res) => res.json())
        .catch((err) => console.error("Save blocks failed", err));
    }, 1500);
  };

  const handleBlockChange = (blockId: string, updatedContent: any) => {
    const updated = blocks.map((b) => {
      if (b.id === blockId) {
        return { ...b, content: updatedContent };
      }
      return b;
    });
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const handleAddNewBlock = (indexRef: number, type: "TEXT" | "HEADING_1" | "TODO" | "TABLE" | "KANBAN" | "IMAGE" = "TEXT") => {
    const defaultContent = () => {
      if (type === "HEADING_1") return { text: "Heading 1 Section Title" };
      if (type === "TODO") return { text: "Todo Action checklist", completed: false };
      if (type === "TABLE") return { title: "Simple Table", columns: ["Item Name", "Status", "Deadline"], rows: [["New item", "Active", "Tomorrow"]] };
      if (type === "IMAGE") return { src: "", alt: "Image block" };
      if (type === "KANBAN") return {
        title: "Kanban Board",
        columns: [
          { id: "todo", title: "To Do", cards: [{ id: Math.random().toString(), text: "Add logo specs" }] },
          { id: "inprogress", title: "In Progress", cards: [] },
          { id: "done", title: "Done", cards: [] }
        ]
      };
      return { text: "" };
    };

    const newBlock: Block = {
      id: "block-" + Math.random().toString(36).substr(2, 9),
      pageId,
      type,
      content: defaultContent(),
      order: indexRef + 1,
    };

    const updated = [...blocks];
    updated.splice(indexRef + 1, 0, newBlock);
    
    // Recalculate orders
    const resetOrder = updated.map((b, idx) => ({ ...b, order: idx }));
    setBlocks(resetOrder);
    triggerAutoSave(resetOrder);
    setFocusedBlockId(newBlock.id);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (blocks.length <= 1) {
      onShowToast("Keep at least one text block row!");
      return;
    }
    const filtered = blocks.filter((b) => b.id !== blockId);
    const resetOrder = filtered.map((b, idx) => ({ ...b, order: idx }));
    setBlocks(resetOrder);
    triggerAutoSave(resetOrder);
    onShowToast("Block cleared");
  };

  // Convert block type from Slash Command click select
  const handleConvertBlockType = (blockId: string, newType: "TEXT" | "HEADING_1" | "TODO" | "TABLE") => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    let baseText = block.content.text || "";
    let content: any = { text: baseText };

    if (newType === "TODO") {
      content = { text: baseText, completed: false };
    } else if (newType === "TABLE") {
      content = { title: "Table Data", columns: ["Goal", "Priority", "Due Date"], rows: [[baseText || "New Goal", "MEDIUM", "Friday, Oct 24"]] };
    }

    const updated = blocks.map((b) => {
      if (b.id === blockId) {
        return { ...b, type: newType, content };
      }
      return b;
    });

    setBlocks(updated);
    triggerAutoSave(updated);
    setSlashMenuBlockId(null);
    onShowToast(`Converted block to ${newType}`);
  };

  const handleInputKeyUp = (blockId: string, e: React.KeyboardEvent<HTMLParagraphElement>) => {
    const text = e.currentTarget.textContent || "";
    if (e.key === "/") {
      setSlashMenuBlockId(blockId);
    } else if (text === "" && e.key === "Backspace") {
      // Clear if empty on backspace
    } else if (!text.includes("/")) {
      setSlashMenuBlockId(null);
    }
  };


  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploadCover = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    await fetch(`/api/pages/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverImage: dataUrl }),
    });
    setPage((prev) => prev ? { ...prev, coverImage: dataUrl } : prev);
    onShowToast("Cover image updated");
  };

  const addImageBlockFromFile = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    const newBlock: Block = {
      id: "block-" + Math.random().toString(36).substr(2, 9),
      pageId,
      type: "IMAGE",
      content: { src: dataUrl, alt: file.name },
      order: blocks.length,
    };
    const updated = [...blocks, newBlock].map((b, idx) => ({ ...b, order: idx }));
    setBlocks(updated);
    triggerAutoSave(updated);
    onShowToast("Image added to page");
  };

  if (!page) {
    return (
      <div className="py-24 text-center text-gray-400">Loading editor canvas...</div>
    );
  }

  return (
    <article className="max-w-[800px] mx-auto w-full pt-10 pb-24 px-6 relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) addImageBlockFromFile(file);
          e.currentTarget.value = "";
        }}
      />

      <div className="flex gap-2 justify-end mb-4">
        <label className="px-3 py-1.5 border border-[#EDEDEB] rounded-lg text-[12px] font-semibold cursor-pointer hover:bg-[#F7F6F3] flex items-center gap-2">
          <Upload className="w-3.5 h-3.5" /> Change Cover
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadCover(file); }} />
        </label>
        <button className="px-3 py-1.5 border border-[#EDEDEB] rounded-lg text-[12px] font-semibold cursor-pointer hover:bg-[#F7F6F3] flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="w-3.5 h-3.5" /> Add Image Block
        </button>
      </div>

      {/* Dynamic Cover Image Banner */}
      {page.coverImage && (
        <div className="relative group h-60 -mx-6 -mt-10 mb-12 overflow-hidden rounded-b-xl border-b border-[#EDEDEB]">
          <img
            src={page.coverImage}
            alt="Workspace cover banner"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
          />
        </div>
      )}

      {/* Dynamic Header title */}
      <div className="relative mb-8 group mt-6">
        <div className="text-5xl mb-4 leading-none select-none drop-shadow-xs">
          {page.emoji || "🚀"}
        </div>
        <h1 
          className="text-[40px] font-black text-black outline-none leading-tight border-b border-transparent focus:border-gray-100"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const nextTitle = e.currentTarget.textContent || "Untitled";
            if (nextTitle !== page.title) {
              fetch(`/api/pages/${pageId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: nextTitle }),
              }).then(() => {
                setPage({ ...page, title: nextTitle });
                onShowToast("Page renamed!");
              });
            }
          }}
        >
          {page.title}
        </h1>
      </div>

      {/* Editor Blocks loop list */}
      <div className="space-y-4 relative">
        {blocks.map((block, idx) => {
          const isSlashMenuOpen = slashMenuBlockId === block.id;

          return (
            <div
              key={block.id}
              className="group relative flex gap-2 -ml-8 items-start hover:bg-gray-50/20 py-1 px-1 rounded transition-all"
            >
              {/* Block Action Handles spacer */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-gray-300 mt-1 cursor-grab flex-shrink-0">
                <button
                  className="p-0.5 hover:bg-gray-100 hover:text-black rounded transition-colors"
                  onClick={() => handleAddNewBlock(idx, "TEXT")}
                  title="Add new block"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <div title="Drag Indicator">
                  <GripVertical className="w-3.5 h-3.5 select-none" />
                </div>
              </div>

              {/* RENDER BY BLOCK TYPE */}
              <div className="flex-1 min-w-0">
                {/* 1. Heading 1 Renders block */}
                {block.type === "HEADING_1" && (
                  <h2
                    className="text-[22px] font-bold text-black outline-none tracking-tight leading-loose border-b border-transparent focus:border-gray-100 mt-4 mb-2"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      handleBlockChange(block.id, {
                        text: e.currentTarget.textContent || "",
                      });
                    }}
                    onKeyUp={(e) => handleInputKeyUp(block.id, e)}
                  >
                    {block.content.text}
                  </h2>
                )}

                {/* 2. Standard Text block */}
                {block.type === "TEXT" && (
                  <p
                    className="text-[14.5px] leading-relaxed text-gray-700 outline-none border-b border-transparent focus:border-gray-100 whitespace-pre-wrap"
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Start typing or use '/' for block type..."
                    onBlur={(e) => {
                      handleBlockChange(block.id, {
                        text: e.currentTarget.textContent || "",
                      });
                    }}
                    onKeyUp={(e) => handleInputKeyUp(block.id, e)}
                  >
                    {block.content.text}
                  </p>
                )}

                {/* 3. To-Do checkboxes with checked state */}
                {block.type === "TODO" && (
                  <div className="flex items-center gap-3 py-1 group/todo">
                    <input
                      type="checkbox"
                      checked={block.content.completed || false}
                      onChange={(e) => {
                        handleBlockChange(block.id, {
                          ...block.content,
                          completed: e.target.checked,
                        });
                        onShowToast(e.target.checked ? "Completed checkbox checked off!" : "Unlocked check line");
                      }}
                      className="w-4.5 h-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer checked:bg-black checked:border-black"
                    />
                    <span
                      className={`text-[14px] text-gray-800 outline-none flex-1 min-w-0 ${
                        block.content.completed
                          ? "line-through text-gray-400"
                          : "font-medium"
                      }`}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        handleBlockChange(block.id, {
                          ...block.content,
                          text: e.currentTarget.textContent || "",
                        });
                      }}
                    >
                      {block.content.text}
                    </span>
                  </div>
                )}

                {/* 4. Image block */}
                {block.type === "IMAGE" && (
                  <div className="my-4 border border-[#EDEDEB] rounded-xl overflow-hidden bg-[#F7F6F3]">
                    {block.content.src ? (
                      <img src={block.content.src} alt={block.content.alt || "Page image"} className="w-full max-h-[420px] object-contain bg-white" />
                    ) : (
                      <button className="w-full py-10 text-[13px] font-semibold text-gray-500 flex items-center justify-center gap-2" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="w-4 h-4" /> Upload image
                      </button>
                    )}
                    <input
                      className="w-full px-3 py-2 text-[12px] outline-none bg-white border-t border-[#EDEDEB]"
                      value={block.content.alt || ""}
                      placeholder="Caption / alt text"
                      onChange={(e) => handleBlockChange(block.id, { ...block.content, alt: e.target.value })}
                    />
                  </div>
                )}

                {/* 5. Simple custom table schema inline data modification */}
                {block.type === "TABLE" && (
                  <div className="w-full mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        {block.content.title || "Goal Table"}
                      </span>
                    </div>

                    <div className="border border-[#EDEDEB] rounded-lg overflow-hidden bg-white shadow-none max-w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse table-auto text-[13px]">
                        <thead className="bg-[#F7F6F3] border-b border-[#EDEDEB] text-[#37352F] font-semibold text-[11px] uppercase tracking-wider">
                          <tr>
                            {(block.content.columns || []).map((col: string, colIdx: number) => (
                              <th key={colIdx} className="px-4 py-2.5 border-r border-[#EDEDEB]">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-800">
                           {(block.content.rows || []).map((row: string[], rowIdx: number) => (
                            <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                              {row.map((cell: string, cellIdx: number) => (
                                <td
                                  key={cellIdx}
                                  className="px-4 py-3 border-r border-[#EDEDEB] min-w-[120px]"
                                >
                                  {/* Renders priority labels with High, Medium labels */}
                                  {cell === "HIGH" ? (
                                    <span className="bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
                                      {cell}
                                    </span>
                                  ) : cell === "MEDIUM" ? (
                                    <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
                                      {cell}
                                    </span>
                                  ) : (
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      className="outline-none block w-full focus:bg-amber-50/30 px-1 py-0.5"
                                      onBlur={(e) => {
                                        const newRows = [...block.content.rows];
                                        newRows[rowIdx][cellIdx] = e.currentTarget.textContent || "";
                                        handleBlockChange(block.id, {
                                          ...block.content,
                                          rows: newRows,
                                        });
                                      }}
                                    >
                                      {cell}
                                    </span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button
                        className="w-full py-2 text-center text-[11px] text-[#7D7C78] hover:text-[#37352F] hover:bg-gray-50 font-bold border-t border-[#EDEDEB] uppercase tracking-widest cursor-pointer transition-colors"
                        onClick={() => {
                          const newRows = [...block.content.rows, ["New Goal Task Item", "MEDIUM", "Friday, Oct 24"]];
                          handleBlockChange(block.id, {
                            ...block.content,
                            rows: newRows,
                          });
                          onShowToast("Prepend row initialized");
                        }}
                      >
                        + New Row
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Custom Kanban board items */}
                {block.type === "KANBAN" && (
                  <div className="w-full mt-4">
                    <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                      {block.content.title || "Kanban Project List"}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {(block.content.columns || []).map((col: any, colIdx: number) => (
                        <div key={col.id} className="w-[220px] flex-shrink-0 flex flex-col gap-3">
                          <div className="flex items-center justify-between px-1 bg-gray-50/60 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                {col.title}
                              </span>
                              <span className="bg-gray-200 px-1.5 py-0.5 rounded text-[10px] text-gray-600 font-bold leading-none">
                                {col.cards.length}
                              </span>
                            </div>
                            <button
                              className="p-1 hover:bg-gray-200 text-gray-400 hover:text-black rounded transition-colors cursor-pointer"
                              title="Add card"
                              onClick={() => {
                                const newCardText = prompt("Enter a brief description for your new card:", "Dynamic Workspace Task");
                                if (newCardText) {
                                  const updatedCols = block.content.columns.map((c: any) => {
                                    if (c.id === col.id) {
                                      return {
                                        ...c,
                                        cards: [...c.cards, { id: Math.random().toString(), text: newCardText, tags: ["Dynamic"] }],
                                      };
                                    }
                                    return c;
                                  });
                                  handleBlockChange(block.id, {
                                    ...block.content,
                                    columns: updatedCols,
                                  });
                                  onShowToast("Card added to column!");
                                }
                              }}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            {col.cards.map((card: any) => (
                              <div
                                key={card.id}
                                className="p-3 bg-white border border-[#EDEDEB] rounded-lg shadow-none hover:border-[#37352F] transition-colors cursor-pointer group/card flex items-start justify-between gap-1"
                              >
                                <div>
                                  <p className="text-[12px] font-semibold text-gray-800 leading-normal">
                                    {card.text}
                                  </p>
                                  {(card.tags || []).length > 0 && (
                                    <div className="flex gap-1.5 mt-2">
                                      {card.tags.map((tag: string) => (
                                        <span
                                          key={tag}
                                          className="bg-[#F7F6F3] px-1.5 py-0.5 rounded text-[8.5px] text-gray-500 font-bold"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button
                                  className="opacity-0 group-hover/card:opacity-100 text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-0.5 mt-0.5"
                                  onClick={() => {
                                    const updatedCols = block.content.columns.map((c: any) => {
                                      if (c.id === col.id) {
                                        return {
                                          ...c,
                                          cards: c.cards.filter((car: any) => car.id !== card.id),
                                        };
                                      }
                                      return c;
                                    });
                                    handleBlockChange(block.id, {
                                      ...block.content,
                                      columns: updatedCols,
                                    });
                                    onShowToast("Card discarded");
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Slash Command popover overlay list */}
              {isSlashMenuOpen && (
                <div className="absolute left-8 mt-5 w-64 bg-white border border-[#EDEDEB] shadow-xl rounded-lg z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-100">
                  <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-60">
                    Basic Blocks
                  </p>
                  <div className="px-1 space-y-0.5">
                    <button
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors text-left"
                      onClick={() => handleConvertBlockType(block.id, "TEXT")}
                    >
                      <div className="w-7 h-7 flex items-center justify-center border border-gray-100 rounded bg-gray-50 text-gray-500">
                        <ListCollapse className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12.5px] font-semibold text-gray-800">Text</span>
                        <span className="text-[9.5px] text-gray-400">Just start writing raw prose</span>
                      </div>
                    </button>

                    <button
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors text-left"
                      onClick={() => handleConvertBlockType(block.id, "HEADING_1")}
                    >
                      <div className="w-7 h-7 flex items-center justify-center border border-gray-100 rounded bg-gray-50 text-gray-500">
                        <Heading1 className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12.5px] font-semibold text-gray-800">Heading 1</span>
                        <span className="text-[9.5px] text-gray-400">Section heading block format</span>
                      </div>
                    </button>

                    <button
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors text-left"
                      onClick={() => handleConvertBlockType(block.id, "TODO")}
                    >
                      <div className="w-7 h-7 flex items-center justify-center border border-gray-100 rounded bg-gray-50 text-gray-500">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12.5px] font-semibold text-gray-800">To-do list</span>
                        <span className="text-[9.5px] text-gray-400">Task checker checkboxes inline</span>
                      </div>
                    </button>

                    <button
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors text-left"
                      onClick={() => { handleAddNewBlock(idx, "IMAGE"); setSlashMenuBlockId(null); }}
                    >
                      <div className="w-7 h-7 flex items-center justify-center border border-gray-100 rounded bg-gray-50 text-gray-500">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12.5px] font-semibold text-gray-800">Image</span>
                        <span className="text-[9.5px] text-gray-400">Upload local media into page</span>
                      </div>
                    </button>

                    <button
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors text-left"
                      onClick={() => handleConvertBlockType(block.id, "TABLE")}
                    >
                      <div className="w-7 h-7 flex items-center justify-center border border-gray-100 rounded bg-gray-50 text-gray-500">
                        <TableProperties className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12.5px] font-semibold text-gray-800">Table</span>
                        <span className="text-[9.5px] text-gray-400">Add simple structured tabular maps</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Individual row deletion on trash button click */}
              <button
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-100 hover:text-red-500 rounded text-gray-300 transition-all ml-1 cursor-pointer align-self-start mt-1 flex-shrink-0"
                onClick={() => handleDeleteBlock(block.id)}
                title="Discard Block"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
