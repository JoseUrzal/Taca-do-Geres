"use client";

// fetcher para SWR + POST com retry (wifi rural: uma falha de rede tenta outra vez)
export const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (r.status === 401) {
      window.location.href = "/";
      throw new Error("sem identidade");
    }
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  });

export async function post(url: string, body?: unknown): Promise<Response> {
  const attempt = () =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    return await attempt();
  } catch {
    // retry único após 800ms — suficiente para um blip de wifi
    await new Promise((r) => setTimeout(r, 800));
    return attempt();
  }
}

export const POLL = { refreshInterval: 2000, revalidateOnFocus: true } as const;
