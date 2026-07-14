import { useState, type FormEvent, type PointerEvent } from "react";
import AiPromptPanel from "@/components/editor/AiPromptPanel";
import type { ColorMode } from "@/types/website";

export type ChatMessage = { id: string; role: "user" | "assistant"; text: string };
export type PromptHistoryItem = { id: string; prompt: string; createdAt: string };

type EditorSidebarProps = { colorMode: ColorMode; onToggleColorMode: () => void; messages: ChatMessage[]; history: PromptHistoryItem[]; isProcessing: boolean; prompt: string; onPromptChange: (value: string) => void; autoMode: boolean; onToggleAutoMode: () => void; onSubmit: (event: FormEvent) => void };

const dateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function EditorSidebar(props: EditorSidebarProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [width, setWidth] = useState(322);
  const [resizing, setResizing] = useState(false);
  const resize = (event: PointerEvent<HTMLDivElement>) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setWidth(Math.max(240, Math.min(event.clientX, window.innerWidth / 3))); };
  const groupedHistory = props.history.reduce<Record<string, PromptHistoryItem[]>>((groups, item) => {
    const label = dateLabel(item.createdAt);
    groups[label] = [...(groups[label] ?? []), item];
    return groups;
  }, {});

  return <aside className="ide-sidebar relative flex w-full flex-col border-r border-zinc-200 bg-[#fcfbf7]" style={{ width, maxWidth: "33.333vw" }}>
    <div className="border-b border-zinc-200 p-5"><div className="flex items-center justify-between"><h2 className="brand-title text-xl font-semibold text-zinc-900">&#123;HTTPMAKER</h2><div className="flex items-center gap-2"><button type="button" onClick={() => setHistoryOpen((open) => !open)} className="history-toggle rounded-full border px-3 py-1 text-xs font-medium" aria-expanded={historyOpen}>History</button><button type="button" onClick={props.onToggleColorMode} className="theme-toggle rounded-full border px-3 py-1 text-xs font-medium" aria-label={`Switch to ${props.colorMode === "dark" ? "light" : "dark"} mode`}>{props.colorMode === "dark" ? "☼" : "◐"}</button></div></div></div>
    <div className="chat-thread flex-1 overflow-y-auto p-4"><div className="space-y-4">{props.messages.map((message) => <div key={message.id} className={`chat-message chat-message-${message.role}`}><span>{message.role === "assistant" ? "AI" : "You"}</span><p>{message.text}</p></div>)}{props.isProcessing && <div className="chat-message chat-message-assistant"><span>AI</span><p className="animate-pulse">Thinking…</p></div>}</div></div>
    <AiPromptPanel suggestions={[]} prompt={props.prompt} onPromptChange={props.onPromptChange} autoMode={props.autoMode} onToggleAutoMode={props.onToggleAutoMode} onSubmit={props.onSubmit} isProcessing={props.isProcessing} />
    {historyOpen && <div className="history-drawer absolute inset-0 z-30 flex flex-col"><div className="flex items-center justify-between border-b p-4"><div><p className="text-xs uppercase tracking-widest">Conversations</p><h3 className="font-semibold">Prompt history</h3></div><button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close history">×</button></div><div className="flex-1 overflow-y-auto p-3">{props.history.length === 0 && <p className="p-3 text-sm">Your sent prompts will appear here.</p>}{Object.entries(groupedHistory).map(([label, items]) => <section key={label} className="mb-5"><h4 className="mb-2 px-2 text-[10px] uppercase tracking-[0.2em]">{label}</h4><div className="space-y-1">{items.map((item) => <button type="button" key={item.id} className="history-prompt w-full p-3 text-left text-sm" onClick={() => { props.onPromptChange(item.prompt); setHistoryOpen(false); }}>{item.prompt}</button>)}</div></section>)}</div><p className="border-t p-3 text-xs">Selecting a prompt copies it into chat. It will not be sent.</p></div>}
    <div className={`sidebar-resizer ${resizing ? "active" : ""}`} onPointerDown={(event)=>{event.currentTarget.setPointerCapture(event.pointerId);setResizing(true)}} onPointerMove={resize} onPointerUp={(event)=>{event.currentTarget.releasePointerCapture(event.pointerId);setResizing(false)}} onPointerCancel={()=>setResizing(false)} />
  </aside>;
}
