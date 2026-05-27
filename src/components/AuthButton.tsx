"use client";

import { useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export function AuthButton() {
  const userEmail = useStore((s) => s.userEmail);
  const [busy, setBusy] = useState(false);

  if (!supabaseConfigured) {
    return (
      <div className="text-xs text-muted px-2 py-1.5 rounded-lg bg-bgsoft border border-line text-center">
        Yerel mod · sohbetler bu tarayıcıda
      </div>
    );
  }

  const signIn = async () => {
    const email = window.prompt("E-posta adresin (giriş bağlantısı gönderilecek):");
    if (!email) return;
    const sb = createClient();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    alert(
      error
        ? `Hata: ${error.message}`
        : "Giriş bağlantısı e-postana gönderildi. Bağlantıya tıkla.",
    );
  };

  const signOut = async () => {
    const sb = createClient();
    if (sb) await sb.auth.signOut();
  };

  if (userEmail) {
    return (
      <button
        onClick={signOut}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-line bg-bgsoft hover:border-brand text-sm"
      >
        <User size={15} className="text-brand" />
        <span className="flex-1 truncate text-left text-muted">{userEmail}</span>
        <LogOut size={15} className="text-muted" />
      </button>
    );
  }

  return (
    <button
      onClick={signIn}
      disabled={busy}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-line bg-bgsoft hover:border-brand text-sm font-semibold disabled:opacity-50"
    >
      <LogIn size={15} />
      {busy ? "Gönderiliyor..." : "E-posta ile giriş"}
    </button>
  );
}
