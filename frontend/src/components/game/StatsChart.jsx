import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { t } from "../../game/i18n";

export default function StatsChart({ history, lang }) {
  const data = (history || []).map((h, i) => ({
    t: i,
    rev: Math.round(h.rev * 10) / 10,
    burn: Math.round(h.burn * 10) / 10,
    cash: Math.round(h.cash),
  }));

  return (
    <div className="sm-panel p-3 md:p-4" data-testid="stats-chart-panel">
      <div className="sm-heading text-sm mb-2 uppercase tracking-widest text-[color:var(--sm-text-dim)]">
        // {t(lang, "stats.chart_title")}
      </div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
            <CartesianGrid stroke="#1a2336" strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke="#7f8ea8" tick={{ fontSize: 10 }} />
            <YAxis stroke="#7f8ea8" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#0c1117",
                border: "1px solid #232e42",
                borderRadius: 4,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
              }}
              labelStyle={{ color: "#7f8ea8" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="rev" name={t(lang, "stats.revenue")} stroke="#00ff9d" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="burn" name={t(lang, "stats.burn")} stroke="#ff4068" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-center text-[color:var(--sm-text-dim)] mt-2">
        {t(lang, "stats.chart_footer")}
      </div>
    </div>
  );
}
