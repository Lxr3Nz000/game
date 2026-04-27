import React from "react";
import { t } from "../../game/i18n";
import { GEM_ITEMS } from "../../game/gemShop";
import { Gem, X, Sparkles } from "lucide-react";

export default function GemShop({ open, onClose, state, lang, onPurchase }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 4, 8, 0.82)",
        backdropFilter: "blur(6px)",
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
      onClick={onClose}
      data-testid="gem-shop-modal"
    >
      <div
        className="sm-panel"
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflowY: "auto",
          borderLeft: "3px solid var(--sm-neon-purple)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-4 md:p-5 border-b"
          style={{ borderColor: "var(--sm-border)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="neon-purple" />
            <div className="sm-display text-xl md:text-2xl neon-purple">
              &gt; GEM_SHOP
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="sm-hud-chip" data-testid="gem-shop-balance">
              <Gem size={12} className="neon-purple" />
              <span className="neon-purple">{state.gems}</span>
            </div>
            <button
              className="sm-btn !px-3 !py-2 !min-h-0"
              onClick={onClose}
              data-testid="gem-shop-close"
              aria-label="close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 p-4 md:p-5">
          {GEM_ITEMS.filter((it) => !it.onlyWhen || it.onlyWhen(state)).map((item) => {
            const canAfford = state.gems >= item.cost;
            return (
              <div
                key={item.id}
                className="sm-panel p-3 md:p-4 flex flex-col gap-2"
                data-testid={`gem-item-${item.id}`}
                style={{
                  borderColor: canAfford ? "var(--sm-border-strong)" : "var(--sm-border)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="sm-heading text-sm md:text-base">{item.name[lang]}</div>
                  <div className="sm-hud-chip !py-1 !px-2 shrink-0">
                    <Gem size={10} className="neon-purple" />
                    <span className="neon-purple text-xs">{item.cost}</span>
                  </div>
                </div>
                <div className="text-xs text-[color:var(--sm-text-dim)]">
                  {item.desc[lang]}
                </div>
                <button
                  className={`sm-btn mt-auto ${canAfford ? "sm-btn-primary" : ""}`}
                  disabled={!canAfford}
                  onClick={() => onPurchase(item.id)}
                  data-testid={`gem-buy-${item.id}`}
                >
                  {t(lang, "common.buy")}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-4 pb-4 text-center text-[10px] text-[color:var(--sm-text-dim)] sm-display">
          &gt; earn gems by unlocking milestones_
        </div>
      </div>
    </div>
  );
}
