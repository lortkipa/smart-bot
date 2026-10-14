import { type ClientMessage, ServerMessage, WS_PATH } from "../ws";

export type RealtimeStatus = "connecting" | "open" | "closed";

export interface RealtimeOptions {
  /** Same value as the HTTP client's baseUrl ("" = same origin as the page). */
  baseUrl: string;
  onMessage?: (msg: ServerMessage) => void;
  onStatus?: (status: RealtimeStatus) => void;
  /** Delay before reconnecting after the socket closes. */
  reconnectMs?: number;
}

function wsUrl(baseUrl: string): string {
  if (baseUrl) return `${baseUrl.replace(/^http/, "ws").replace(/\/$/, "")}${WS_PATH}`;
  // Same-origin: only valid in a browser page.
  const loc = (globalThis as { location?: { protocol: string; host: string } }).location;
  if (!loc) throw new Error("connectRealtime: baseUrl is required outside a browser page");
  const { protocol, host } = loc;
  return `${protocol === "https:" ? "wss:" : "ws:"}//${host}${WS_PATH}`;
}

/** Opens a WebSocket to the server and keeps it open until `close()` is called. */
export function connectRealtime(opts: RealtimeOptions) {
  const url = wsUrl(opts.baseUrl);
  let socket: WebSocket | undefined;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout> | undefined;

  const send = (msg: ClientMessage) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
  };

  const open = () => {
    opts.onStatus?.("connecting");
    socket = new WebSocket(url);
    socket.onopen = () => opts.onStatus?.("open");
    socket.onmessage = (event) => {
      const parsed = ServerMessage.safeParse(JSON.parse(String(event.data)));
      if (!parsed.success) return;
      if (parsed.data.type === "ping") send({ type: "pong", time: new Date().toISOString() });
      opts.onMessage?.(parsed.data);
    };
    socket.onclose = () => {
      opts.onStatus?.("closed");
      if (!stopped) retry = setTimeout(open, opts.reconnectMs ?? 2000);
    };
  };

  open();

  return {
    send,
    close() {
      stopped = true;
      clearTimeout(retry);
      // Aborting mid-handshake makes dev proxies log EPIPE errors, so close once it's open.
      if (socket?.readyState === WebSocket.CONNECTING) socket.onopen = () => socket?.close();
      else socket?.close();
    },
  };
}
