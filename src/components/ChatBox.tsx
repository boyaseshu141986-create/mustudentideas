import { useEffect, useRef, useState } from "react";
import { Send, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const EMOJIS = [
  "😀","😄","😉","😍","🤩","🤗","🤔","😅","😎","🥳","👍","👏","🙏","💪","🔥","✨","🚀","💡","🎯","✅",
  "❤️","🎉","📚","🧠","🛠️","💻","📈","🌱","🤝","😂",
];

type Message = {
  id: string;
  room: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export function ChatBox({
  room,
  currentUserId,
  names,
  title,
  className,
}: {
  room: string;
  currentUserId: string;
  names: Record<string, string>;
  title?: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("messages")
      .select("*")
      .eq("room", room)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) setMessages((data ?? []) as Message[]);
      });

    const channel = supabase
      .channel(`room-${room}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room=eq.${room}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const content = text.trim();
    if (!content) return;
    setText("");
    await supabase.from("messages").insert({ room, sender_id: currentUserId, content });
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col rounded-xl border border-border bg-card", className)}>
      {title ? (
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">{title}</div>
      ) : null}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet — say hello 👋</p>
        ) : null}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2 text-sm",
                  mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}
              >
                {!mine ? (
                  <p className="mb-0.5 text-[11px] font-semibold opacity-70">
                    {names[m.sender_id] ?? "Member"}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Insert emoji">
              <Smile className="size-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="rounded p-1 text-lg hover:bg-muted"
                  onClick={() => setText((t) => t + e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Write a message…"
          maxLength={1000}
        />
        <Button onClick={() => void send()} size="icon" aria-label="Send message">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
