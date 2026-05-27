# craft.ai — web

Qwen Studio'dan ilham alan, terminal asistanının web sürümü. Next.js 16 +
TypeScript + Tailwind v4 + Supabase ile yazıldı, Vercel'de yayınlanır.

## Özellikler

- 💬 **Sohbet / Gizli Sohbet / Geçmiş** — normal sohbet kaydedilir, gizli sohbet kaydedilmez.
- 🧩 **Çoklu model** — Ayarlardan birden fazla model API'si ekle (Hugging Face, DeepSeek, OpenRouter, özel). Üst bardan seçtiğin modelle çalışır.
- 👨‍💻 **Coder sekmesi** — GitHub deposuna bağlan, dosya ağacını gez, içeriği sohbete gönder.
- 🔑 **Çoklu GitHub hesabı** — birden fazla token; özel depolar ve repo seçimi.
- 🔐 **Gizlilik** — API anahtarları yalnızca tarayıcıda (localStorage). LLM çağrıları `/api/chat` sunucu proxy'si üzerinden gider (CORS sorunu yok).
- ☁️ **Supabase (opsiyonel)** — giriş yaparsan sohbet geçmişin buluta senkronlanır; yoksa "yerel mod".

## Geliştirme

```bash
npm install
cp .env.example .env.local   # Supabase kullanacaksan doldur (opsiyonel)
npm run dev
```

## Supabase kurulumu (opsiyonel)

1. supabase.com'da yeni proje aç.
2. `supabase/schema.sql` içeriğini SQL Editor'da çalıştır.
3. Project Settings > API'den `URL` ve `anon key`'i al, `.env.local`'a yaz:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Authentication > URL Configuration'a `https://<site>/auth/callback` ekle.

## Vercel'e yayınlama

```bash
npm i -g vercel
vercel login
vercel        # önizleme
vercel --prod # canlı
```

Ortam değişkenlerini (Supabase + opsiyonel LLM) Vercel proje ayarlarına ekle.

---

**Geliştirici:** Enes Kahveci · eneskahveci.bs@gmail.com
