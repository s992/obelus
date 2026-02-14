import { getCsrfToken, resolveApiBaseUrl } from "@/api/trpc";
import {
  type GoodreadsImportOptions,
  type GoodreadsImportRecord,
  type GoodreadsIssue,
  goodreadsImportRecordSchema,
  goodreadsImportSummarySchema,
  goodreadsIssueSchema,
} from "@obelus/shared";

export type GoodreadsImportSnapshot = GoodreadsImportRecord & {
  issues: GoodreadsIssue[];
};

export type GoodreadsImportLiveConnectionState = "idle" | "connecting" | "connected" | "degraded";

type SubscribeToGoodreadsImportEventsInput = {
  importId: string;
  onSnapshot: (snapshot: GoodreadsImportSnapshot) => void;
  onConnectionStateChange?: (state: GoodreadsImportLiveConnectionState) => void;
  onError?: (error: Error) => void;
};

const fetchWithCredentials = async (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, {
    ...init,
    credentials: "include",
  });
};

export const createGoodreadsImport = async (input: {
  file: File;
  options: GoodreadsImportOptions;
}): Promise<{ importId: string }> => {
  const form = new FormData();
  form.set("file", input.file);
  form.set("options", JSON.stringify(input.options));

  const csrfToken = await getCsrfToken();
  const response = await fetchWithCredentials(`${resolveApiBaseUrl()}/imports/goodreads`, {
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Failed to start import (${response.status}).`);
  }

  return (await response.json()) as { importId: string };
};

const parseSnapshot = (payload: unknown): GoodreadsImportSnapshot => {
  const asRecord = payload as Record<string, unknown>;
  const record = goodreadsImportRecordSchema.parse(asRecord);
  const issuesRaw = Array.isArray(asRecord.issues) ? asRecord.issues : [];

  return {
    ...record,
    summary: goodreadsImportSummarySchema.parse(record.summary),
    issues: issuesRaw.map((issue) => goodreadsIssueSchema.parse(issue)),
  };
};

export const getGoodreadsImport = async (importId: string): Promise<GoodreadsImportSnapshot> => {
  const response = await fetchWithCredentials(
    `${resolveApiBaseUrl()}/imports/goodreads/${importId}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load import (${response.status}).`);
  }

  const payload = (await response.json()) as unknown;
  return parseSnapshot(payload);
};

export const listGoodreadsImports = async (): Promise<GoodreadsImportRecord[]> => {
  const response = await fetchWithCredentials(`${resolveApiBaseUrl()}/imports/goodreads`);

  if (!response.ok) {
    throw new Error(`Failed to load imports (${response.status}).`);
  }

  const payload = (await response.json()) as { imports?: unknown[] };
  return (payload.imports ?? []).map((entry) => goodreadsImportRecordSchema.parse(entry));
};

export const subscribeToGoodreadsImportEvents = (
  input: SubscribeToGoodreadsImportEventsInput,
): (() => void) => {
  const activeStatuses = new Set(["queued", "processing"]);
  let source: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let closed = false;

  const emitState = (state: GoodreadsImportLiveConnectionState) => {
    input.onConnectionStateChange?.(state);
  };

  const clearReconnect = () => {
    if (!reconnectTimer) {
      return;
    }
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };

  const closeSource = () => {
    if (!source) {
      return;
    }
    source.close();
    source = null;
  };

  const parseEventPayload = (event: MessageEvent<string>): GoodreadsImportSnapshot | null => {
    try {
      const payload = JSON.parse(event.data) as unknown;
      return parseSnapshot(payload);
    } catch (error) {
      input.onError?.(
        error instanceof Error ? error : new Error("Failed to parse import event payload."),
      );
      return null;
    }
  };

  const handleSnapshotEvent = (event: MessageEvent<string>) => {
    const snapshot = parseEventPayload(event);
    if (!snapshot) {
      return;
    }

    input.onSnapshot(snapshot);
    if (!activeStatuses.has(snapshot.status)) {
      emitState("idle");
      closed = true;
      clearReconnect();
      closeSource();
    }
  };

  const scheduleReconnect = () => {
    if (closed) {
      return;
    }
    clearReconnect();

    attempt += 1;
    const delay = Math.min(15_000, 1_000 * 2 ** (attempt - 1));
    emitState("degraded");
    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);
  };

  const connect = () => {
    if (closed) {
      return;
    }

    closeSource();
    emitState("connecting");

    source = new EventSource(`${resolveApiBaseUrl()}/imports/goodreads/${input.importId}/events`, {
      withCredentials: true,
    });

    source.addEventListener("open", () => {
      attempt = 0;
      emitState("connected");
    });

    source.addEventListener("import.started", handleSnapshotEvent as EventListener);
    source.addEventListener("import.progress", handleSnapshotEvent as EventListener);
    source.addEventListener("import.completed", handleSnapshotEvent as EventListener);
    source.addEventListener("import.failed", handleSnapshotEvent as EventListener);

    source.addEventListener("error", () => {
      closeSource();
      scheduleReconnect();
    });
  };

  connect();

  return () => {
    closed = true;
    clearReconnect();
    closeSource();
    emitState("idle");
  };
};
