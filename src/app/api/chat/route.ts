import { SYSTEM_PROMPT } from "@/lib/constants";
import type { ChatMessage, Provider } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequest {
  messages: ChatMessage[];
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  provider?: Provider;
}

/**
 * LLM proxy'si. İstemci yerine sunucudan istek atarak CORS sorununu çözer ve
 * istenirse sunucu env anahtarlarını kullanır. Sağlayıcının SSE akışını
 * olduğu gibi istemciye aktarır (stream pass-through).
 */
export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response("Geçersiz istek gövdesi", { status: 400 });
  }

  const baseUrl = (
    body.baseUrl ||
    process.env.LLM_BASE_URL ||
    "https://router.huggingface.co/v1"
  ).replace(/\/$/, "");
  const model = body.model || process.env.LLM_MODEL || "";
  const apiKey = body.apiKey || process.env.LLM_API_KEY || "";

  if (!model) {
    return new Response("Model seçilmedi. Ayarlardan bir model girin.", {
      status: 400,
    });
  }
  if (!apiKey) {
    return new Response("API anahtarı yok. Ayarlardan anahtarınızı girin.", {
      status: 400,
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (body.provider === "openrouter") {
    headers["HTTP-Referer"] =
      req.headers.get("origin") || "https://craft-ai.vercel.app";
    headers["X-Title"] = "craft.ai";
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...body.messages,
  ];

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, stream: true }),
    });
  } catch (err) {
    return new Response(
      `Sağlayıcıya bağlanılamadı: ${(err as Error).message}`,
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return new Response(
      `Sağlayıcı hatası ${upstream.status}: ${detail.slice(0, 400)}`,
      { status: upstream.status || 500 },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
