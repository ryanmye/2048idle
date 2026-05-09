/* global React, ReactDOM, SCREENS, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, TweakSelect */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "E",
  "showSystemNotes": true,
  "boardView": "grid",
  "rarityVisible": true,
  "compactMode": false,
  "currencyStyle": "pill"
}/*EDITMODE-END*/;

const TABS = [
  { id: "early",    n: "01" },
  { id: "mid",      n: "02" },
  { id: "late",     n: "03" },
  { id: "bot",      n: "04" },
  { id: "shop",     n: "05" },
  { id: "research", n: "06" },
  { id: "stats",    n: "07" },
];

const DIRECTIONS = [
  { id: "A", name: "A · sticky-notes" },
  { id: "B", name: "B · index card" },
  { id: "C", name: "C · graph paper" },
  { id: "D", name: "D · sketchbook" },
  { id: "E", name: "E · whiteboard" },
  { id: "F", name: "F · zine cut-out" },
];

// Each direction subtly restyles the sheet body via class on root
const DIR_STYLES = {
  A: { bg: "var(--paper)", accent: "var(--pink)" },
  B: { bg: "#fff8ec", accent: "var(--peach)" },
  C: { bg: "#f3f6ee", accent: "var(--mint)" },
  D: { bg: "#f6efe1", accent: "var(--butter)" },
  E: { bg: "#f4f4ee", accent: "var(--sky)" },
  F: { bg: "#f7eee8", accent: "var(--lilac)" },
};

// per-direction bg pattern overlay
const DIR_PATTERNS = {
  A: "none",
  B: "repeating-linear-gradient(0deg, transparent 0 23px, rgba(43,42,38,.08) 23px 24px), linear-gradient(90deg, rgba(232,165,156,.4) 0 1px, transparent 1px 100%)",
  C: "repeating-linear-gradient(0deg, transparent 0 19px, rgba(43,42,38,.07) 19px 20px), repeating-linear-gradient(90deg, transparent 0 19px, rgba(43,42,38,.07) 19px 20px)",
  D: "radial-gradient(circle at 20% 30%, rgba(43,42,38,.04) 0 1px, transparent 1px), radial-gradient(circle at 70% 60%, rgba(43,42,38,.04) 0 1px, transparent 1px)",
  E: "linear-gradient(180deg, rgba(196,216,234,.25), transparent 30%)",
  F: "repeating-linear-gradient(45deg, transparent 0 6px, rgba(216,202,230,.3) 6px 7px)",
};

function App() {
  const [tab, setTab] = useState("early");
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const dir = tweaks.direction;

  // Editable board names — persisted in localStorage so renames stick
  const [boardNames, setBoardNames] = useState(() => {
    try {
      const raw = localStorage.getItem("idle2048_board_names");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const renameBoard = (idx, name) => {
    setBoardNames(prev => {
      const next = { ...prev, [idx]: name };
      try { localStorage.setItem("idle2048_board_names", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    document.body.style.transition = "background-color .3s";
  }, []);

  const screen = SCREENS[tab];

  return (
    <div className="app">
      <header className="title">
        <h1>
          Idle 2048 <span className="scribble">— wireframes</span>
          <small>cozy pastel · 7 screens × 6 directions · whiteboard default</small>
        </h1>
        <div className="meta">
          <div><b>core loop</b> manual board → buy bots → boards → prestige</div>
          <div><b>currencies</b> ⬢ pts (soft) · ◆ prestige (hard)</div>
          <div><b>offline</b> 35% of online points/sec</div>
          <div><b>unlocks</b> hit milestones (128, 256, 512…) → new bots</div>
        </div>
      </header>

      {tweaks.showSystemNotes && (
        <div className="notes">
          <div className="card">
            <h4>currencies</h4>
            <p>⬢ points from every merge. ◆ prestige earned by resetting. tokens unlock outer research rings + legendaries.</p>
          </div>
          <div className="card">
            <h4>bots = collectible cards</h4>
            <p>each bot is a card w/ rarity (common→legendary), an algorithm, a moves/sec stat, a personality blurb. fuse 3-of-a-kind → next tier.</p>
          </div>
          <div className="card">
            <h4>boards</h4>
            <p>start with 1 manual board. buy slots. assign bots. click any board to expand & tweak. rage mode = play yours, all bots ×N.</p>
          </div>
          <div className="card">
            <h4>autorestarts</h4>
            <p>both consumable (buy in bulk) and a slow regen pool. when a board fills, a restart is spent automatically.</p>
          </div>
        </div>
      )}

      <div className="tabs">
        {TABS.map(t => (
          <div
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="num">{t.n}</span>
            {SCREENS[t.id].title}
          </div>
        ))}
      </div>

      <div className="directions">
        <span className="lbl">direction</span>
        {DIRECTIONS.map(d => (
          <button
            key={d.id}
            className={`dirbtn ${dir === d.id ? "active" : ""}`}
            onClick={() => setTweak("direction", d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div
        className="sheet"
        style={{
          background: DIR_STYLES[dir].bg,
          backgroundImage: DIR_PATTERNS[dir],
        }}
        data-screen-label={`${TABS.find(t => t.id === tab).n} ${screen.title}`}
      >
        <div className="sheet-head">
          <h2>{screen.title}</h2>
          <span className="crumb">{screen.crumb} · dir {dir}</span>
        </div>
        {screen.render(dir, { boardNames, renameBoard })}
      </div>

      <div className="footer-note">
        <span>← → switch tabs · click direction chips to compare layout flavors · open Tweaks for more knobs</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>idle-2048 · wireframe v0.1</span>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection title="aesthetic">
          <TweakRadio
            label="direction"
            value={dir}
            onChange={(v) => setTweak("direction", v)}
            options={DIRECTIONS.map(d => ({ value: d.id, label: d.id }))}
          />
        </TweakSection>
        <TweakSection title="content">
          <TweakToggle
            label="show system notes"
            value={tweaks.showSystemNotes}
            onChange={(v) => setTweak("showSystemNotes", v)}
          />
          <TweakToggle
            label="bot rarity badges"
            value={tweaks.rarityVisible}
            onChange={(v) => setTweak("rarityVisible", v)}
          />
          <TweakToggle
            label="compact mode"
            value={tweaks.compactMode}
            onChange={(v) => setTweak("compactMode", v)}
          />
        </TweakSection>
        <TweakSection title="board view (mid game)">
          <TweakSelect
            label="multi-board layout"
            value={tweaks.boardView}
            onChange={(v) => setTweak("boardView", v)}
            options={[
              { value: "grid", label: "grid (3-up)" },
              { value: "stack", label: "stacked list" },
              { value: "focus", label: "focus + sidebar" },
            ]}
          />
        </TweakSection>
        <TweakSection title="currency display">
          <TweakRadio
            label="style"
            value={tweaks.currencyStyle}
            onChange={(v) => setTweak("currencyStyle", v)}
            options={[
              { value: "pill",   label: "pills" },
              { value: "stacked", label: "stack" },
              { value: "bar",    label: "topbar" },
            ]}
          />
        </TweakSection>
      </TweaksPanel>

      {tweaks.compactMode && (
        <style>{`
          .grid-2048 { gap: 4px; padding: 5px; }
          .tile { font-size: 16px !important; }
          .sheet { padding: 12px; }
          .notes { display: none; }
        `}</style>
      )}
      {!tweaks.rarityVisible && (
        <style>{`.lbl-tiny:first-child { visibility: hidden; }`}</style>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
