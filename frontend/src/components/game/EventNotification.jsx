import React from "react";
import { X } from "lucide-react";

export default function EventNotification({ events, onDismiss }) {
  if (!events || events.length === 0) return null;
  return (
    <div
      className="sm-event-stack"
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
              className={`sm-heading text-xs md:text-sm ${ev.positive ? "neon-green" : "neon-red"}`}
            >
              &gt; {ev.title}
            </div>
            <button
              onClick={() => onDismiss(ev.id)}
              className="text-[color:var(--sm-text-dim)] hover:text-white shrink-0 p-1"
              data-testid={`event-dismiss-${ev.id}`}
              aria-label="dismiss"
            >
              <X size={16} />
            </button>
          </div>
          {ev.message && (
            <div className="text-[11px] md:text-xs mt-1 text-[color:var(--sm-text-dim)]">{ev.message}</div>
          )}
        </div>
      ))}
    </div>
  );
}
