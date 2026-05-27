"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Menu, VenetianMask } from "lucide-react";
import { useStore } from "@/lib/store";
import { MessageBubble } from "./MessageBubble";
import { SelectorBar } from "./SelectorBar";

const SUGGESTIONS = [
  "Python'da bir CLI argüman ayrıştırıcı yaz",
  "Bu hatayı açıkla: IndexError: list index out of range",
  "REST ile GraphQL arasındaki farklar neler?",
  "Coder sekmesinden bir dosya seçip özetlememi iste",
];

export function ChatView() {
  const chats = useStore((s) => s.chats);
  const currentId = useStore((s) => s.currentId);
  const incognito = useStore((s) => s.incognito);
  const streaming = useStore((s) => s.streaming);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const pendingInput = useStore((s) => s.pendingInput);
  const setPendingInput = useStore((s) => s.setPendingInput);

  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const current = chats.find((c) => c.id === currentId) || null;
  const messages = current?.messages ?? [];

  useEffect(() => {
    if (pendingInput) {
      setInput(pendingInput);
      setPendingInput(null);
      taRef.current?.focus();
    }
  }, [pendingInput, setPendingInput]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const store = useStore.getState();
    const active = store.activeModel();

    if (!active) {
      store.setSettingsOpen(true);
      return;
    }
    if (!store.currentId) store.newChat(incognito);

    store.pushMessage({ role: "user", content: text });
    store.maybeSetTitle(text);
    setInput("");

    const apiMessages = (useStore.getState().current()?.messages ?? []).map(
      (m) => ({ role: m.role, content: m.content }),
    );

    store.pushMessage({ role: "assistant", content: "" });
    store.setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          baseUrl: active.baseUrl,
          model: active.model,
          apiKey: active.apiKey,
          provider: active.provider,
        }),
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              full += delta;
              useStore.getState().updateLastContent(full);
            }
          } catch {
            /* parçalı satır, yoksay */
          }
        }
      }
      if (!full) {
        useStore.getState().updateLastContent("_(Model boş yanıt döndürdü.)_");
      }
    } catch (err) {
      useStore
        .getState()
        .updateLastContent(
          `⚠️ **Hata:** ${(err as Error).message}\n\n_Anahtar/model doğru mu? Ayarlardan kontrol et._`,
        );
    } finally {
      useStore.getState().setStreaming(false);
      await useStore.getState().persistCurrent();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Üst bar */}
      <div className="min-h-14 shrink-0 flex items-center gap-3 px-4 py-2 border-b border-line flex-wrap">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden text-muted"
        >
          <Menu size={20} />
        </button>
        <SelectorBar />
        {incognito && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple/15 text-purple border border-purple/40">
            <VenetianMask size={12} /> Gizli
          </span>
        )}
      </div>

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto px-5 pt-[12vh] text-center">
            <div className="w-14 h-14 rounded-2xl brand-gradient grid place-items-center text-white text-2xl mx-auto mb-5">
              ◆
            </div>
            <h2 className="text-2xl font-extrabold">
              {incognito ? "Gizli Sohbet" : "Merhaba 👋"}
            </h2>
            <p className="text-muted mt-2">
              {incognito
                ? "Bu sohbet hiçbir yere kaydedilmez."
                : "craft.ai ile kod yaz, açıklat, hata ayıkla."}
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-7 text-left">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="p-3.5 rounded-xl border border-line bg-surface hover:border-branddim text-sm transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-5 py-6">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-line bg-bg py-4">
        <div className="max-w-3xl mx-auto px-5">
          <div className="flex items-end gap-2 bg-surface border border-line rounded-2xl px-3 py-2.5 focus-within:border-branddim transition-colors">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Bir mesaj yaz... (Enter = gönder, Shift+Enter = yeni satır)"
              className="flex-1 bg-transparent resize-none outline-none text-[15px] leading-relaxed max-h-[200px] py-1.5"
            />
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              className="shrink-0 w-9 h-9 rounded-xl bg-brand hover:bg-branddim text-white grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUp size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-muted mt-2">
            Anahtarların yalnızca senin cihazında saklanır · craft.ai
          </p>
        </div>
      </div>
    </div>
  );
}
