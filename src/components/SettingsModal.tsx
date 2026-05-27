"use client";

import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { PRESETS } from "@/lib/constants";
import type { Provider } from "@/lib/types";

export function SettingsModal() {
  const open = useStore((s) => s.settingsOpen);
  const setOpen = useStore((s) => s.setSettingsOpen);
  const config = useStore((s) => s.config);
  const addModel = useStore((s) => s.addModel);
  const removeModel = useStore((s) => s.removeModel);
  const setActiveModel = useStore((s) => s.setActiveModel);
  const addGithub = useStore((s) => s.addGithub);
  const removeGithub = useStore((s) => s.removeGithub);

  const [provider, setProvider] = useState<Provider>("hf");
  const [label, setLabel] = useState("");
  const [baseUrl, setBaseUrl] = useState(PRESETS.hf.baseUrl);
  const [model, setModel] = useState(PRESETS.hf.model);
  const [apiKey, setApiKey] = useState("");

  const [ghUser, setGhUser] = useState("");
  const [ghToken, setGhToken] = useState("");

  if (!open) return null;

  const onProvider = (p: Provider) => {
    setProvider(p);
    if (p !== "custom") {
      setBaseUrl(PRESETS[p].baseUrl);
      setModel(PRESETS[p].model);
    }
  };

  const submitModel = () => {
    if (!baseUrl.trim() || !model.trim()) {
      alert("Base URL ve model gerekli.");
      return;
    }
    addModel({
      label: label.trim() || model.trim(),
      provider,
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      apiKey: apiKey.trim(),
    });
    setLabel("");
    setApiKey("");
  };

  const submitGithub = () => {
    if (!ghUser.trim() || !ghToken.trim()) {
      alert("Kullanıcı adı ve token gerekli.");
      return;
    }
    addGithub({ username: ghUser.trim(), token: ghToken.trim() });
    setGhUser("");
    setGhToken("");
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 max-h-[92vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Ayarlar</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-muted hover:text-ink p-1 rounded-lg hover:bg-bgsoft"
          >
            <X size={18} />
          </button>
        </div>

        {/* ---- MODEL API'LERİ ---- */}
        <section className="mb-7">
          <h4 className="text-sm font-bold mb-1">Model API&apos;leri</h4>
          <p className="text-xs text-muted mb-3">
            Birden fazla model ekleyebilirsin. Üst bardaki seçiciden hangisini
            seçersen onunla çalışır. Anahtarlar yalnızca bu tarayıcıda saklanır.
          </p>

          {config.models.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {config.models.map((m) => {
                const active = config.activeModelId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                      active ? "border-branddim bg-brand/10" : "border-line bg-bgsoft"
                    }`}
                  >
                    <button
                      onClick={() => setActiveModel(m.id)}
                      title="Aktif yap"
                      className={`w-5 h-5 rounded-full grid place-items-center border ${
                        active
                          ? "bg-brand border-brand text-white"
                          : "border-muted text-transparent"
                      }`}
                    >
                      <Check size={12} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {m.label}
                      </div>
                      <div className="text-xs text-muted font-mono truncate">
                        {PRESETS[m.provider].label.split(" ")[0]} · {m.model}
                      </div>
                    </div>
                    <button
                      onClick={() => removeModel(m.id)}
                      className="text-muted hover:text-red p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Yeni model ekleme formu */}
          <div className="rounded-xl border border-line p-3.5 bg-bgsoft/50">
            <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
              + Yeni Model Ekle
            </div>
            <div className="grid gap-2.5">
              <select
                value={provider}
                onChange={(e) => onProvider(e.target.value as Provider)}
                className="input-mono"
              >
                {(Object.keys(PRESETS) as Provider[]).map((p) => (
                  <option key={p} value={p}>
                    {PRESETS[p].label}
                  </option>
                ))}
              </select>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Görünen ad (opsiyonel, örn. 'Llama hızlı')"
                className="input-mono"
              />
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="Base URL"
                className="input-mono"
              />
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model adı"
                className="input-mono"
              />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`API anahtarı — ${PRESETS[provider].keyHint}`}
                className="input-mono"
              />
              <button
                onClick={submitModel}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand hover:bg-branddim text-white text-sm font-semibold"
              >
                <Plus size={15} /> Modeli Ekle
              </button>
            </div>
          </div>
        </section>

        {/* ---- GITHUB HESAPLARI ---- */}
        <section>
          <h4 className="text-sm font-bold mb-1">GitHub Hesapları</h4>
          <p className="text-xs text-muted mb-3">
            Coder sekmesinde özel depolara erişmek ve limiti artırmak için token
            ekle. (github.com/settings/tokens)
          </p>

          {config.githubAccounts.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {config.githubAccounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-line bg-bgsoft"
                >
                  <span className="text-brand">⌥</span>
                  <span className="flex-1 text-sm font-semibold truncate">
                    {a.username}
                  </span>
                  <button
                    onClick={() => removeGithub(a.id)}
                    className="text-muted hover:text-red p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-line p-3.5 bg-bgsoft/50">
            <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
              + GitHub Hesabı Ekle
            </div>
            <div className="grid gap-2.5">
              <input
                value={ghUser}
                onChange={(e) => setGhUser(e.target.value)}
                placeholder="Kullanıcı adı (görünen ad)"
                className="input-mono"
              />
              <input
                type="password"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder="GitHub token (ghp_... / github_pat_...)"
                className="input-mono"
              />
              <button
                onClick={submitGithub}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-line hover:border-brand text-sm font-semibold"
              >
                <Plus size={15} /> Hesabı Ekle
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
