import React from "react";
import { X } from "lucide-react";

export default function EventNotification({ events, onDismiss }) {
  if (!events || events.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        top: 16,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: 320,
      }}
      data-testid="event-stack"
    >
      {events.slice(-4).map((ev) => (
        <div
          key={ev.id}
          className="sm-event-card sm-panel p-3"
          style={{
            borderLeft: `3px solid ${ev.positive ? "var(--sm-neon-green)" : "var(--sm-neon-red)"}`,
          }}
          data-testid={`event-${ev.id}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div
              className={`sm-heading text-sm ${ev.positive ? "neon-green" : "neon-red"}`}
            >
              &gt; {ev.title}
            </div>
            <button
              onClick={() => onDismiss(ev.id)}
              className="text-[color:var(--sm-text-dim)] hover:text-white"
              data-testid={`event-dismiss-${ev.id}`}
              aria-label="dismiss"
            >
              <X size={14} />
            </button>
          </div>
          {ev.message && (
            <div className="text-xs mt-1 text-[color:var(--sm-text-dim)]">{ev.message}</div>
          )}
        </div>
      ))}
    </div>
  );
}
