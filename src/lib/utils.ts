type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

export const fetchTimeout = async (input: FetchInput, timeout = 5000, init?: FetchInit) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};

type NotificationEnv = CloudflareBindings & {
  NTFY_TOPIC_URL?: string;
};

export const ntfyNotify = async (env: NotificationEnv, text: string) => {
  const url = env.NTFY_TOPIC_URL?.trim();
  if (!url) return;

  const res = await fetch(url, {
    method: "POST",
    body: text,
  });
  if (!res.ok) {
    console.error(`ntfy failed: ${res.status} ${res.statusText} - ${await res.text()}`);
  }
};
