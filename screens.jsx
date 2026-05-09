/* global React */
const { useState, useMemo, useRef, useEffect } = React;

// ───────────────────────────────────────────────────────────
// Shared mini-components
// ───────────────────────────────────────────────────────────

const Sparkline = ({ seed = 1, color = "var(--coral)" }) => {
  const pts = useMemo(() => {
    const arr = [];
    let v = 14 + (seed * 7) % 12;
    for (let i = 0; i < 24; i++) {
      v += Math.sin(i * 0.6 + seed) * 3 + (Math.cos(i * 0.31 + seed * 2) * 2);
      v = Math.max(4, Math.min(32, v));
      arr.push(v);
    }
    return arr;
  }, [seed]);
  const w = 200, h = 36;
  const step = w / (pts.length - 1);
  const d = pts.map((y, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - y).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const Tile = ({ v, size = 1 }) => {
  const cls = v ? `t${v}` : "t0";
  const fontSize = v >= 1024 ? 14 : v >= 128 ? 18 : 22;
  return <div className={`tile ${cls}`} style={{ fontSize: `${fontSize * size}px` }}>{v || ""}</div>;
};

// Editable board name
const EditableName = ({ value, onChange, placeholder = "untitled board", style }) => {
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(value);
  const ref = useRef();
  useEffect(() => { setTmp(value); }, [value]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    if (onChange && tmp !== value) onChange(tmp || placeholder);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={tmp}
        onChange={(e) => setTmp(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setTmp(value); setEditing(false); } }}
        style={{
          font: "inherit",
          fontFamily: style?.fontFamily || "var(--sans)",
          fontSize: style?.fontSize || 14,
          fontWeight: style?.fontWeight || 500,
          background: "var(--paper)",
          border: "1.5px solid var(--rule)",
          borderRadius: 4,
          padding: "1px 4px",
          outline: "none",
          color: "var(--ink)",
          maxWidth: 200,
          ...style,
        }}
      />
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      title="click to rename"
      style={{
        cursor: "text",
        borderBottom: "1.5px dashed var(--ink-faint)",
        ...style,
      }}
    >
      {value}
      <span style={{ marginLeft: 4, opacity: .4, fontSize: 10, fontFamily: "var(--mono)" }}>✎</span>
    </span>
  );
};

const Board2048 = ({ state, hot, mini = false }) => {
  const grid = state || [
    [2, 4, 8, 16],
    [4, 16, 32, 64],
    [8, 32, 64, 128],
    [16, 64, 128, 256],
  ];
  return (
    <div className="grid-2048" style={hot ? { boxShadow: "0 0 0 3px var(--coral)" } : {}}>
      {grid.flat().map((v, i) => <Tile key={i} v={v} size={mini ? 0.7 : 1} />)}
    </div>
  );
};

// pre-baked board states
const BOARDS = {
  early: [[2, 4, 0, 0], [4, 8, 2, 0], [16, 32, 4, 2], [64, 128, 8, 4]],
  mid:   [[2, 4, 8, 16], [4, 16, 32, 64], [8, 32, 64, 128], [16, 64, 128, 256]],
  late:  [[8, 16, 32, 64], [16, 32, 64, 128], [32, 64, 128, 256], [64, 128, 256, 512]],
  rand:  [[0, 4, 0, 2], [2, 0, 8, 0], [0, 16, 0, 4], [4, 0, 32, 8]],
  full:  [[2, 4, 8, 16], [16, 32, 4, 2], [4, 8, 64, 128], [2, 4, 256, 4]],
};

const Money = ({ pts = "1,240", gems = "3" }) => (
  <div className="row" style={{ gap: 8 }}>
    <span className="pill coin">⬢ {pts} pts</span>
    <span className="pill gem">◆ {gems} prestige</span>
  </div>
);

// Bot catalogue — technical names + achievement unlock conditions
// First bot now unlocks at 64 tile (no immediate-start bot); everything else bumps up one rank
const BOTS = [
  { id: "rand",      name: "Random Walker",    rarity: "COMMON",   tier: 1, mps: "0.5", cost: "100",  algo: "uniform random direction",       unlock: "reach a 64 tile",                           color: "var(--peach)", got: "available" },
  { id: "lu",        name: "Left-Up",          rarity: "COMMON",   tier: 1, mps: "1.0", cost: "850",  algo: "left, then up. always.",          unlock: "reach a 128 tile",                          color: "var(--peach)", got: "available" },
  { id: "corner",    name: "Corner",           rarity: "COMMON",   tier: 1, mps: "1.0", cost: "1.2k", algo: "anchors largest tile in corner",  unlock: "reach a 256 tile",                          color: "var(--peach)", got: "locked" },
  { id: "snake",     name: "Snake",            rarity: "UNCOMMON", tier: 2, mps: "1.4", cost: "3.4k", algo: "snake-fills row by row",          unlock: "reach a 512 tile",                          color: "var(--sky)",   got: "locked" },
  { id: "greedy",    name: "Greedy",           rarity: "UNCOMMON", tier: 2, mps: "1.6", cost: "5.2k", algo: "max-merge each move",             unlock: "score 50,000 on one board",                 color: "var(--sky)",   got: "locked" },
  { id: "minmax2",   name: "Minimax · d2",     rarity: "RARE",     tier: 3, mps: "2.0", cost: "8.4k", algo: "looks 2 moves ahead",             unlock: "reach a 1024 tile",                         color: "var(--mint)",  got: "locked" },
  { id: "minmax4",   name: "Minimax · d4",     rarity: "RARE",     tier: 3, mps: "2.4", cost: "24k",  algo: "looks 4 moves ahead",             unlock: "reach a 2048 tile",                         color: "var(--mint)",  got: "locked" },
  { id: "expecti",   name: "Expectimax",       rarity: "EPIC",     tier: 4, mps: "2.6", cost: "82k",  algo: "weighted by spawn odds",          unlock: "reach a 4096 tile",                         color: "var(--lilac)", got: "locked" },
  { id: "mcts",      name: "Monte Carlo",      rarity: "EPIC",     tier: 4, mps: "2.2", cost: "140k", algo: "simulates 200 rollouts/move",     unlock: "10,000,000 total moves",                    color: "var(--lilac)", got: "locked" },
  { id: "ntuple",    name: "n-Tuple Network",  rarity: "LEGENDARY",tier: 5, mps: "3.0", cost: "1.2M", algo: "trained pattern weights",         unlock: "reach an 8192 tile",                        color: "var(--coral)", got: "locked" },
  { id: "afterstate",name: "Afterstate-TD",    rarity: "LEGENDARY",tier: 5, mps: "3.4", cost: "8.4M", algo: "TD-learned value function",       unlock: "lifetime 1T points",                        color: "var(--coral)", got: "locked" },
  { id: "myth",      name: "???",              rarity: "MYTHIC",   tier: 6, mps: "?",   cost: "?",    algo: "?",                               unlock: "reach a 16,384 tile · prestige 7+",         color: "var(--ink)",   got: "locked", hidden: true },
];

// Achievement conditions referenced across screens — many tiers, many reward types
const ACHIEVEMENTS = [
  // Tile milestones (you OR your bots)
  { id: "tile-32",   label: "reach 32",     got: true,  reward: "+50 pts",                 cat: "tile" },
  { id: "tile-64",   label: "reach 64",     got: true,  reward: "unlock Random Walker",   cat: "tile" },
  { id: "tile-128",  label: "reach 128",    got: true,  reward: "unlock Left-Up",         cat: "tile" },
  { id: "tile-256",  label: "reach 256",    got: true,  reward: "unlock Corner",          cat: "tile" },
  { id: "tile-512",  label: "reach 512",    got: true,  reward: "unlock Snake",           cat: "tile" },
  { id: "tile-1024", label: "reach 1024",   got: false, reward: "unlock Minimax · d2",    cat: "tile" },
  { id: "tile-2048", label: "reach 2048",   got: false, reward: "unlock Minimax · d4 · +1 ◆", cat: "tile" },
  { id: "tile-4096", label: "reach 4096",   got: false, reward: "unlock Expectimax",      cat: "tile" },
  { id: "tile-8192", label: "reach 8192",   got: false, reward: "unlock n-Tuple Network", cat: "tile" },
  { id: "tile-16k",  label: "reach 16,384", got: false, reward: "???", hidden: true,      cat: "tile" },

  // Score milestones
  { id: "score-1k",  label: "1,000 on one board",  got: true,  reward: "+250 pts",        cat: "score" },
  { id: "score-10k", label: "10,000 on one board", got: true,  reward: "+0.5 m/s starter speed", cat: "score" },
  { id: "score-50k", label: "50,000 on one board", got: false, reward: "unlock Greedy",   cat: "score" },
  { id: "score-250k",label: "250,000 on one board",got: false, reward: "+1 ◆",            cat: "score" },
  { id: "score-1m",  label: "1M on one board",     got: false, reward: "+10% all bot speed", cat: "score" },

  // Lifetime points
  { id: "life-1m",   label: "1M lifetime",   got: true,  reward: "+1 board slot",         cat: "life" },
  { id: "life-100m", label: "100M lifetime", got: false, reward: "+5% offline rate",      cat: "life" },
  { id: "life-1b",   label: "1B lifetime",   got: false, reward: "+1 ◆ + extra autorestart cap", cat: "life" },
  { id: "life-1t",   label: "1T lifetime",   got: false, reward: "unlock Afterstate-TD", cat: "life" },

  // Move count
  { id: "moves-1k",  label: "1,000 moves",   got: true,  reward: "+100 pts",              cat: "moves" },
  { id: "moves-100k",label: "100,000 moves", got: false, reward: "+5 max autorestarts",   cat: "moves" },
  { id: "moves-1m",  label: "1M moves",      got: false, reward: "+1 board slot",         cat: "moves" },
  { id: "moves-10m", label: "10M moves",     got: false, reward: "unlock Monte Carlo",    cat: "moves" },

  // Bot / collection
  { id: "first-bot", label: "buy first bot", got: true,  reward: "+50 pts",               cat: "bot" },
  { id: "5-bots",    label: "own 5 bots",    got: false, reward: "+1 board slot",         cat: "bot" },
  { id: "fuse-1",    label: "first fusion",  got: false, reward: "+1 ◆",                  cat: "bot" },
  { id: "all-common",label: "all commons owned",   got: false, reward: "+10% common bot speed", cat: "bot" },
  { id: "all-rare",  label: "all rares owned",     got: false, reward: "+10% rare bot speed",   cat: "bot" },

  // Boards
  { id: "boards-3",  label: "3 boards running",    got: true,  reward: "+1 max autorestart",     cat: "board" },
  { id: "boards-8",  label: "8 boards running",    got: false, reward: "+5% global pts",         cat: "board" },
  { id: "boards-5x5",label: "first 5×5 board",     got: false, reward: "+2 ◆",                   cat: "board" },
  { id: "boards-7x7",label: "first 7×7 board",     got: false, reward: "+5 ◆",                   cat: "board" },

  // Prestige / meta
  { id: "prestige-1", label: "first prestige",     got: true,  reward: "research tree opens",    cat: "meta" },
  { id: "prestige-3", label: "3 prestiges",        got: true,  reward: "+1 ◆ on every prestige", cat: "meta" },
  { id: "prestige-7", label: "7 prestiges",        got: false, reward: "unlock 5×5 boards",      cat: "meta" },
  { id: "no-manual",  label: "24h hands-off",      got: false, reward: "+25% offline rate",      cat: "meta" },

  // Rage
  { id: "rage-1",    label: "first rage",          got: true,  reward: "+25 pts",                 cat: "rage" },
  { id: "rage-100",  label: "100 rages",           got: false, reward: "rage lasts 50% longer",   cat: "rage" },

  // Hidden
  { id: "hidden-1",  label: "???",                 got: false, reward: "???",  hidden: true,     cat: "hidden" },
  { id: "hidden-2",  label: "???",                 got: false, reward: "???",  hidden: true,     cat: "hidden" },
];

// ───────────────────────────────────────────────────────────
// SCREEN 1 — Early game
// ───────────────────────────────────────────────────────────

const ScreenEarly = ({ direction, boardNames, renameBoard }) => {
  return (
    <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
      <div className="col grow" style={{ minWidth: 280, maxWidth: 460 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span className="lbl-note">
            <EditableName
              value={boardNames[0] || "main board"}
              onChange={(v) => renameBoard(0, v)}
              style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 22 }}
            />
          </span>
          <Money pts="240" gems="0" />
        </div>
        <Board2048 state={BOARDS.early} />
        <div className="row" style={{ gap: 6, justifyContent: "center" }}>
          <span className="btn-hand">←</span>
          <span className="btn-hand">↑</span>
          <span className="btn-hand">↓</span>
          <span className="btn-hand">→</span>
        </div>
        <div className="box fill-pink" style={{ padding: "8px 10px" }}>
          <div className="lbl-tiny">RAGE METER</div>
          <div className="row" style={{ alignItems: "center", gap: 8, marginTop: 4 }}>
            <div className="box" style={{ flex: 1, height: 14, background: "var(--paper)", overflow: "hidden" }}>
              <div style={{ width: "32%", height: "100%", background: "var(--coral)" }} />
            </div>
            <span className="num-mono">32%</span>
          </div>
          <div className="lbl-hand" style={{ fontSize: 12, color: "var(--ink-soft)" }}>fill it → all bots ×3 for 30s</div>
        </div>
      </div>

      <div className="col grow" style={{ minWidth: 280 }}>
        <div className="lbl-note">your first bot</div>
        <div className="box fill-butter" style={{ padding: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="lbl-note" style={{ fontSize: 18 }}>Random Walker</div>
              <div className="lbl-tiny">COMMON · TIER I</div>
            </div>
            <div className="box dashed" style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 20 }}>
              rnd
            </div>
          </div>
          <ul style={{ margin: "8px 0 6px 18px", padding: 0, fontFamily: "var(--sans)", fontSize: 13 }}>
            <li>0.5 moves / sec</li>
            <li>uniform random direction</li>
            <li>≈ 4 pts / sec</li>
          </ul>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className="num-mono">cost: 100 pts</span>
            <span className="btn-hand primary">buy →</span>
          </div>
        </div>

        <div className="box dashed" style={{ padding: 10 }}>
          <div className="lbl-tiny">LOCKED · ACHIEVEMENT</div>
          <div className="lbl-hand"><b>Left-Up</b> — reach a <span className="num-mono">64</span> tile</div>
        </div>
        <div className="box dashed" style={{ padding: 10 }}>
          <div className="lbl-tiny">LOCKED · ACHIEVEMENT</div>
          <div className="lbl-hand"><b>Corner</b> — reach a <span className="num-mono">128</span> tile</div>
        </div>
        <div className="box dashed" style={{ padding: 10 }}>
          <div className="lbl-tiny">LOCKED · ACHIEVEMENT</div>
          <div className="lbl-hand"><b>Snake</b> — reach a <span className="num-mono">256</span> tile</div>
        </div>

        <div className="box fill-mint" style={{ padding: 10, marginTop: 6 }}>
          <div className="lbl-tiny">HOW IT WORKS</div>
          <div className="lbl-hand">play merges → earn pts → buy a bot → it plays its own board while you keep going. hit milestones (128, 256, 512…) to unlock <b>better bots</b>.</div>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// SCREEN 2 — Mid game (board grid + shop)
// ───────────────────────────────────────────────────────────

const MiniBoardCell = ({ data, name, mps, owner, hot, onRename }) => (
  <div className="box" style={{ padding: 6, position: "relative", background: hot ? "var(--peach)" : "var(--paper)" }}>
    <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 12 }}>
        <EditableName value={name} onChange={onRename} style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 12 }} />
      </span>
      <span className="num-mono" style={{ fontSize: 9 }}>{mps} m/s</span>
    </div>
    <Board2048 state={data} mini />
    <div className="lbl-tiny" style={{ marginTop: 4 }}>{owner}</div>
  </div>
);

const ScreenMid = ({ direction, boardNames, renameBoard }) => {
  const cells = [
    { data: BOARDS.mid,   mps: "—",   owner: "manual",         hot: true },
    { data: BOARDS.full,  mps: "0.5", owner: "Random Walker" },
    { data: BOARDS.rand,  mps: "1.0", owner: "Left-Up" },
    { data: BOARDS.early, mps: "1.0", owner: "Corner" },
    { data: BOARDS.late,  mps: "2.0", owner: "Minimax · d2" },
    { data: BOARDS.mid,   mps: "1.4", owner: "Snake" },
  ];
  return (
    <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
      <div className="col grow" style={{ minWidth: 320, flex: 2 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span className="lbl-note">boards · 6 of 8</span>
          <Money pts="48,920" gems="2" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {cells.map((c, i) => (
            <MiniBoardCell
              key={i}
              {...c}
              name={boardNames[i] || `board ${i + 1}`}
              onRename={(v) => renameBoard(i, v)}
            />
          ))}
        </div>
        <div className="row" style={{ gap: 8, marginTop: 4, alignItems: "center" }}>
          <span className="lbl-tiny">PRODUCTION</span>
          <Sparkline seed={3} />
          <span className="num-mono">+ 124 pts/s</span>
        </div>
        <div className="box fill-butter" style={{ padding: 8, marginTop: 4 }}>
          <div className="lbl-tiny">JUST UNLOCKED ✦</div>
          <div className="lbl-hand"><b>Greedy</b> — you scored 10,000 on one board</div>
        </div>
      </div>

      <div className="col" style={{ minWidth: 280, flex: 1 }}>
        <div className="lbl-note">shop</div>
        <div className="box" style={{ padding: 8 }}>
          <div className="row" style={{ gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <span className="pill" style={{ background: "var(--mint)" }}>bots</span>
            <span className="pill">boards</span>
            <span className="pill">restarts</span>
            <span className="pill">boosts</span>
          </div>
          <div className="col" style={{ gap: 8 }}>
            {[
              { n: "Greedy",        t: "UNCOMMON", c: "5,200 pts", color: "var(--sky)",  unlocked: "just unlocked" },
              { n: "Minimax · d4",  t: "RARE",     c: "24,000 pts", color: "var(--mint)", unlocked: "needs 1024 tile", locked: true },
              { n: "Expectimax",    t: "EPIC",     c: "82,000 pts", color: "var(--lilac)", unlocked: "needs 2048 tile", locked: true },
            ].map((b, i) => (
              <div key={i} className="box" style={{ padding: 8, background: b.color, opacity: b.locked ? .55 : 1 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="lbl-hand" style={{ fontWeight: 600 }}>{b.n}</span>
                  <span className="lbl-tiny">{b.t}</span>
                </div>
                <div className="lbl-tiny" style={{ marginTop: 2 }}>{b.unlocked}</div>
                <div className="row" style={{ justifyContent: "space-between", marginTop: 4, alignItems: "center" }}>
                  <span className="num-mono">{b.c}</span>
                  <span className="btn-hand">{b.locked ? "locked" : "buy"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="box fill-pink" style={{ padding: 10 }}>
          <div className="lbl-tiny">AUTORESTARTS</div>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className="lbl-note">42 / 100</span>
            <span className="num-mono">+ 1 / 4m</span>
          </div>
          <div className="box" style={{ height: 8, background: "var(--paper)", marginTop: 6 }}>
            <div style={{ width: "42%", height: "100%", background: "var(--coral)" }} />
          </div>
          <div className="lbl-tiny" style={{ marginTop: 6 }}>spent during offline calc · drains pool</div>
          <div className="row" style={{ marginTop: 6, gap: 6, flexWrap: "wrap" }}>
            <span className="btn-hand">+10 (200)</span>
            <span className="btn-hand">+50 (900)</span>
            <span className="btn-hand">cap +25 (8k)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// SCREEN 3 — Late game (abstracted)
// ───────────────────────────────────────────────────────────

const ScreenLate = ({ direction, boardNames, renameBoard }) => {
  const farms = [
    { key: 0, defaultName: "farm A", boards: 12, mps: "12.4k", color: "var(--mint)" },
    { key: 1, defaultName: "farm B", boards: 12, mps: "9.8k",  color: "var(--sky)" },
    { key: 2, defaultName: "farm C", boards: 24, mps: "31.2k", color: "var(--lilac)" },
    { key: 3, defaultName: "farm D", boards: 8,  mps: "4.1k",  color: "var(--peach)" },
    { key: 4, defaultName: "manual", boards: 1, mps: "—",     color: "var(--pink)" },
  ];
  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <span className="lbl-note">farms · 57 boards · 89 bots</span>
        <Money pts="14.2M" gems="847" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <div className="col" style={{ gap: 10 }}>
          {farms.map((f, i) => (
            <div key={i} className="box" style={{ padding: 10, background: f.color }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <span className="lbl-note" style={{ fontSize: 22 }}>
                  <EditableName
                    value={boardNames[100 + f.key] || f.defaultName}
                    onChange={(v) => renameBoard(100 + f.key, v)}
                    style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 22 }}
                  />
                </span>
                <span className="num-mono">{f.mps} pts/s</span>
              </div>
              <div className="row" style={{ gap: 3, marginTop: 6, flexWrap: "wrap" }}>
                {Array.from({ length: f.boards }).map((_, j) => (
                  <div key={j} className="box" style={{
                    width: 16, height: 22, padding: 0,
                    background: "var(--paper)", borderRadius: 4,
                    position: "relative", overflow: "hidden"
                  }}>
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: `${30 + (j * 13 + i * 7) % 60}%`,
                      background: "var(--ink)"
                    }} />
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 8, gap: 8, alignItems: "center" }}>
                <span className="lbl-tiny">production</span>
                <Sparkline seed={i + 4} />
                <span className="btn-hand">expand</span>
              </div>
            </div>
          ))}
        </div>

        <div className="col" style={{ gap: 10 }}>
          <div className="box fill-butter" style={{ padding: 10 }}>
            <div className="lbl-tiny">TOTAL OUTPUT</div>
            <div className="lbl-note" style={{ fontSize: 28 }}>57.5k <span className="num-mono" style={{ fontSize: 12 }}>pts/s</span></div>
            <Sparkline seed={9} />
          </div>
          <div className="box" style={{ padding: 10 }}>
            <div className="lbl-tiny">OFFLINE EARNINGS · 35%</div>
            <div className="lbl-hand">last away 2h 14m</div>
            <div className="lbl-note" style={{ fontSize: 22 }}>+ 162M pts</div>
            <div className="lbl-tiny" style={{ marginTop: 4 }}>used 18 autorestarts · 24 left</div>
            <span className="btn-hand primary" style={{ marginTop: 6 }}>collect</span>
          </div>
          <div className="box fill-lilac" style={{ padding: 10 }}>
            <div className="lbl-tiny">PRESTIGE READY</div>
            <div className="lbl-hand">reset everything for ~ 12 ◆</div>
            <div className="box" style={{ height: 8, background: "var(--paper)", marginTop: 6 }}>
              <div style={{ width: "78%", height: "100%", background: "var(--ink)" }} />
            </div>
            <span className="btn-hand warn" style={{ marginTop: 6 }}>prestige →</span>
          </div>
          <div className="box dashed" style={{ padding: 10 }}>
            <div className="lbl-tiny">RAGE MODE (manual)</div>
            <div className="lbl-hand">play your manual board to charge → all bots ×3</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// SCREEN 4 — Bot detail / upgrade (gacha card)
// ───────────────────────────────────────────────────────────

const ScreenBot = ({ direction }) => {
  return (
    <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
      <div className="col" style={{ flex: "0 0 320px" }}>
        <div className="box fill-lilac" style={{ padding: 14, borderRadius: 18, transform: "rotate(-1deg)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="lbl-tiny">RARE · TIER III</span>
            <span className="num-mono">#012</span>
          </div>
          <div className="box dashed" style={{
            aspectRatio: "1 / 1", margin: "8px 0", display: "flex",
            alignItems: "center", justifyContent: "center", background: "var(--paper)",
            fontFamily: "var(--mono)", fontSize: 28, color: "var(--ink-soft)"
          }}>
            minimax
          </div>
          <div className="lbl-note" style={{ fontSize: 24 }}>Minimax · d2</div>
          <div className="lbl-hand" style={{ fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic" }}>
            looks 2 moves ahead. evaluates by empty cells + monotonicity.
          </div>
          <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <span className="pill">depth 2</span>
            <span className="pill">2.0 m/s</span>
            <span className="pill">+8% merge</span>
          </div>
          <div className="box" style={{ padding: 6, marginTop: 8, background: "var(--paper)" }}>
            <div className="lbl-tiny">UNLOCKED BY</div>
            <div className="lbl-hand">reaching a 512 tile · ✓</div>
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="btn-hand">◀ prev</span>
          <span className="btn-hand grow" style={{ justifyContent: "center" }}>assign to board</span>
          <span className="btn-hand">next ▶</span>
        </div>
      </div>

      <div className="col grow" style={{ minWidth: 320, gap: 10 }}>
        <div className="lbl-note">upgrades</div>
        <div className="col" style={{ gap: 8 }}>
          {[
            { n: "speed",                 lvl: 12, max: 25, cost: "1.2k", color: "var(--mint)" },
            { n: "look-ahead depth",      lvl: 2,  max: 6,  cost: "8.4k", color: "var(--sky)" },
            { n: "merge bonus %",         lvl: 6,  max: 20, cost: "2.1k", color: "var(--peach)" },
            { n: "lucky tile (×4 spawn)", lvl: 1,  max: 5,  cost: "12k",  color: "var(--pink)" },
          ].map((u, i) => (
            <div key={i} className="box" style={{ padding: 10, background: u.color }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <span className="lbl-hand" style={{ fontSize: 14, fontWeight: 600 }}>{u.n}</span>
                <span className="num-mono">lvl {u.lvl}/{u.max}</span>
              </div>
              <div className="box" style={{ height: 8, background: "var(--paper)", marginTop: 6 }}>
                <div style={{ width: `${(u.lvl/u.max)*100}%`, height: "100%", background: "var(--ink)" }} />
              </div>
              <div className="row" style={{ marginTop: 6, justifyContent: "space-between" }}>
                <span className="num-mono">cost {u.cost}</span>
                <span className="btn-hand">+1</span>
              </div>
            </div>
          ))}
        </div>

        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <div className="box fill-butter grow" style={{ padding: 10, minWidth: 180 }}>
            <div className="lbl-tiny">CURRENT BOARD</div>
            <div className="lbl-note" style={{ fontSize: 18 }}>board 5</div>
            <div className="lbl-hand">avg score 14.2k · best 2048</div>
          </div>
          <div className="box fill-paper2 grow" style={{ padding: 10, minWidth: 180 }}>
            <div className="lbl-tiny">LIFETIME (this bot)</div>
            <div className="lbl-hand">moves: 412k</div>
            <div className="lbl-hand">merges: 89.1k</div>
            <div className="lbl-hand">restarts used: 47</div>
          </div>
        </div>

        <div className="box dashed" style={{ padding: 10 }}>
          <div className="lbl-tiny">FUSION (3 of same → tier IV)</div>
          <div className="row" style={{ gap: 6, marginTop: 4, alignItems: "center" }}>
            <span className="pill">d2 ×2</span>
            <span className="pill" style={{ opacity: .4 }}>+ 1 needed</span>
            <span className="btn-hand" style={{ marginLeft: "auto", opacity: .5 }}>fuse →</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// SCREEN 5 — Shop / Catalogue (driven by BOTS array)
// ───────────────────────────────────────────────────────────

const BotCard = ({ bot }) => {
  const locked = bot.got === "locked";
  const owned = bot.got === "owned";
  return (
    <div className="box" style={{ padding: 10, background: bot.color, opacity: locked ? .55 : 1, color: bot.id === "myth" ? "var(--paper)" : "inherit" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="lbl-tiny" style={{ color: bot.id === "myth" ? "var(--paper)" : "var(--ink-soft)" }}>{bot.rarity} · T{bot.tier}</span>
        <span className="lbl-tiny" style={{ color: bot.id === "myth" ? "var(--paper)" : "var(--ink-soft)" }}>
          {owned ? "✓ owned" : locked ? "🔒" : "available"}
        </span>
      </div>
      <div className="box dashed" style={{
        aspectRatio: "4 / 3", margin: "6px 0", background: "var(--paper)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--mono)", fontSize: 14, color: "var(--ink-soft)"
      }}>
        {bot.hidden ? "?" : bot.id}
      </div>
      <div className="lbl-note" style={{ fontSize: 16 }}>{bot.hidden ? "???" : bot.name}</div>
      <div className="lbl-hand" style={{ fontSize: 11, color: bot.id === "myth" ? "rgba(255,255,255,.7)" : "var(--ink-soft)", fontStyle: "italic", minHeight: 28, marginTop: 2 }}>
        {bot.hidden ? "—" : bot.algo}
      </div>
      <div className="row" style={{ gap: 4, flexWrap: "wrap", marginTop: 4 }}>
        <span className="pill" style={{ fontSize: 11, padding: "1px 6px" }}>{bot.mps} m/s</span>
      </div>
      <div className="box" style={{ padding: "4px 6px", marginTop: 6, background: "var(--paper)" }}>
        <div className="lbl-tiny">UNLOCK</div>
        <div className="lbl-hand" style={{ fontSize: 11 }}>{bot.unlock}</div>
      </div>
      <div className="row" style={{ marginTop: 6, justifyContent: "space-between", alignItems: "center" }}>
        <span className="num-mono" style={{ color: bot.id === "myth" ? "var(--paper)" : "var(--ink)" }}>{bot.cost} pts</span>
        <span className="btn-hand" style={{ opacity: locked || owned ? .5 : 1 }}>
          {owned ? "owned" : locked ? "locked" : "buy"}
        </span>
      </div>
    </div>
  );
};

const ScreenShop = ({ direction }) => {
  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <span className="pill" style={{ background: "var(--mint)" }}>bots ({BOTS.length})</span>
          <span className="pill">boards (3)</span>
          <span className="pill">restarts</span>
          <span className="pill">boosts</span>
          <span className="pill">cosmetics</span>
        </div>
        <Money pts="48,920" gems="12" />
      </div>

      <div className="lbl-tiny">unlock new bots by hitting in-game milestones — your bots count too!</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
        {BOTS.map((b, i) => <BotCard key={i} bot={b} />)}
      </div>

      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="box fill-butter grow" style={{ padding: 10, minWidth: 240 }}>
          <div className="lbl-tiny">DAILY GACHA PULL</div>
          <div className="lbl-note" style={{ fontSize: 18 }}>free in 4h 12m</div>
          <div className="lbl-hand">or pull now for 1 ◆ — 3% legendary chance</div>
          <span className="btn-hand primary" style={{ marginTop: 6 }}>spin →</span>
        </div>
        <div className="box fill-pink grow" style={{ padding: 10, minWidth: 240 }}>
          <div className="lbl-tiny">AUTORESTARTS · MAX 100</div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="lbl-note" style={{ fontSize: 18 }}>42 / 100</span>
            <span className="num-mono">regen 1 / 4m</span>
          </div>
          <div className="lbl-tiny" style={{ marginTop: 4 }}>drains during offline · used when a board fills</div>
          <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <span className="btn-hand">refill +10 (200)</span>
            <span className="btn-hand">refill +50 (900)</span>
            <span className="btn-hand">refill +100 (3k)</span>
          </div>
          <div className="box" style={{ padding: 6, marginTop: 6, background: "var(--paper)" }}>
            <div className="lbl-tiny">PERMANENT CAP UPGRADES</div>
            <div className="row" style={{ gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <span className="btn-hand">cap → 125 (8k)</span>
              <span className="btn-hand">cap → 150 (32k)</span>
              <span className="btn-hand">cap → 200 (180k)</span>
            </div>
          </div>
        </div>
        <div className="box fill-mint grow" style={{ padding: 10, minWidth: 240 }}>
          <div className="lbl-tiny">EXTRA BOARDS</div>
          <div className="lbl-note" style={{ fontSize: 18 }}>slot 7 of 8</div>
          <div className="lbl-hand">next slot: 80k pts</div>
          <span className="btn-hand" style={{ marginTop: 6 }}>buy slot</span>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// SCREEN 6 — Research tree + Prestige
// ───────────────────────────────────────────────────────────

const ResearchNode = ({ x, y, label, state, color }) => {
  const fill = state === "owned" ? color : state === "available" ? "var(--paper)" : "var(--paper-2)";
  const op = state === "locked" ? .45 : 1;
  return (
    <g transform={`translate(${x},${y})`} opacity={op}>
      <circle r="22" fill={fill} stroke="var(--rule)" strokeWidth="1.5" strokeDasharray={state === "locked" ? "3 3" : "none"} />
      <text textAnchor="middle" y="4" fontFamily="'Source Sans 3', sans-serif" fontWeight="500" fontSize="10" fill="var(--ink)">{label}</text>
    </g>
  );
};
const ResearchEdge = ({ x1, y1, x2, y2, dim }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--rule)" strokeWidth="1.25" opacity={dim ? 0.35 : 1} strokeDasharray={dim ? "3 3" : "none"} />
);

const ScreenResearch = ({ direction }) => {
  const center = { x: 380, y: 220 };
  const ring1 = [
    { a: 0, label: "speed I", state: "owned", color: "var(--mint)" },
    { a: 60, label: "merge I", state: "owned", color: "var(--mint)" },
    { a: 120, label: "boards", state: "available", color: "var(--sky)" },
    { a: 180, label: "depth I", state: "owned", color: "var(--mint)" },
    { a: 240, label: "luck I", state: "available", color: "var(--peach)" },
    { a: 300, label: "rage I", state: "available", color: "var(--pink)" },
  ];
  const ring2 = [
    { a: 0, label: "speed II", state: "available", color: "var(--mint)" },
    { a: 30, label: "fusion", state: "locked", color: "var(--lilac)" },
    { a: 60, label: "merge II", state: "locked", color: "var(--mint)" },
    { a: 120, label: "+1 board", state: "locked", color: "var(--sky)" },
    { a: 180, label: "depth II", state: "available", color: "var(--mint)" },
    { a: 210, label: "expecti", state: "locked", color: "var(--mint)" },
    { a: 240, label: "luck II", state: "locked", color: "var(--peach)" },
    { a: 300, label: "rage II", state: "locked", color: "var(--pink)" },
    { a: 330, label: "offline+", state: "locked", color: "var(--butter)" },
  ];
  const ring3 = [
    { a: 30,  label: "?",      state: "locked", color: "var(--coral)" },
    { a: 90,  label: "5×5",    state: "locked", color: "var(--sky)" },
    { a: 150, label: "?",      state: "locked", color: "var(--coral)" },
    { a: 210, label: "6×6",    state: "locked", color: "var(--sky)" },
    { a: 270, label: "7×7",    state: "locked", color: "var(--sky)" },
    { a: 330, label: "?",      state: "locked", color: "var(--coral)" },
  ];
  // ring 4 — late-game-only board sizes
  const ring4 = [
    { a: 90,  label: "8×8",    state: "locked", color: "var(--sky)" },
    { a: 270, label: "9×9",    state: "locked", color: "var(--sky)" },
  ];
  const polar = (cx, cy, r, deg) => ({ x: cx + r * Math.cos(deg * Math.PI / 180), y: cy + r * Math.sin(deg * Math.PI / 180) });

  return (
    <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
      <div className="col grow" style={{ minWidth: 360, flex: 2 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span className="lbl-note">research tree</span>
          <span className="pill gem">◆ 7 prestige to spend</span>
        </div>
        <div className="box" style={{ padding: 6, background: "var(--paper-2)" }}>
          <svg viewBox="0 0 760 440" style={{ width: "100%", height: "auto", display: "block" }}>
            <circle cx={center.x} cy={center.y} r="200" fill="none" stroke="var(--ink-soft)" strokeDasharray="2 5" />
            <text x={center.x + 165} y={center.y - 165} fontFamily="'Source Sans 3', sans-serif" fontSize="11" fill="var(--ink-soft)">expand at next prestige →</text>

            {ring1.map((n, i) => {
              const p = polar(center.x, center.y, 80, n.a);
              return <ResearchEdge key={i} x1={center.x} y1={center.y} x2={p.x} y2={p.y} />;
            })}
            {ring2.map((n, i) => {
              const p2 = polar(center.x, center.y, 150, n.a);
              const closest = ring1.reduce((a, b) => Math.abs(b.a - n.a) < Math.abs(a.a - n.a) ? b : a);
              const p1 = polar(center.x, center.y, 80, closest.a);
              return <ResearchEdge key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} dim={n.state === "locked"} />;
            })}
            {ring3.map((n, i) => {
              const p3 = polar(center.x, center.y, 200, n.a);
              const closest = ring2.reduce((a, b) => Math.abs(b.a - n.a) < Math.abs(a.a - n.a) ? b : a);
              const p2 = polar(center.x, center.y, 150, closest.a);
              return <ResearchEdge key={i} x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} dim />;
            })}
            {ring4.map((n, i) => {
              const p4 = polar(center.x, center.y, 250, n.a);
              const closest = ring3.reduce((a, b) => Math.abs(b.a - n.a) < Math.abs(a.a - n.a) ? b : a);
              const p3 = polar(center.x, center.y, 200, closest.a);
              return <ResearchEdge key={i} x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} dim />;
            })}

            <circle cx={center.x} cy={center.y} r="28" fill="var(--butter)" stroke="var(--rule)" strokeWidth="2" />
            <text x={center.x} y={center.y + 5} textAnchor="middle" fontFamily="'Newsreader', serif" fontWeight="600" fontSize="16">core</text>

            {ring1.map((n, i) => {
              const p = polar(center.x, center.y, 80, n.a);
              return <ResearchNode key={i} x={p.x} y={p.y} {...n} />;
            })}
            {ring2.map((n, i) => {
              const p = polar(center.x, center.y, 150, n.a);
              return <ResearchNode key={i} x={p.x} y={p.y} {...n} />;
            })}
            {ring3.map((n, i) => {
              const p = polar(center.x, center.y, 200, n.a);
              return <ResearchNode key={i} x={p.x} y={p.y} {...n} />;
            })}
            {ring4.map((n, i) => {
              const p = polar(center.x, center.y, 250, n.a);
              return <ResearchNode key={i} x={p.x} y={p.y} {...n} />;
            })}
          </svg>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <span className="pill" style={{ background: "var(--mint)" }}>● owned</span>
          <span className="pill">○ available</span>
          <span className="pill" style={{ opacity: .55 }}>◌ locked</span>
          <span className="pill" style={{ background: "var(--coral)", color: "var(--paper)" }}>next ring at prestige 4</span>
        </div>
      </div>

      <div className="col" style={{ minWidth: 280, flex: 1 }}>
        <div className="lbl-note">prestige</div>
        <div className="box fill-lilac" style={{ padding: 12 }}>
          <div className="lbl-tiny">PRESTIGE 3 → 4</div>
          <div className="row" style={{ alignItems: "center", gap: 8 }}>
            <span className="lbl-note" style={{ fontSize: 28 }}>78%</span>
            <div className="box" style={{ flex: 1, height: 12, background: "var(--paper)" }}>
              <div style={{ width: "78%", height: "100%", background: "var(--ink)" }} />
            </div>
          </div>
          <div className="lbl-hand" style={{ fontSize: 13, marginTop: 6 }}>
            reset everything · gain <b>+12 ◆</b> · expand research tree by one ring
          </div>
          <span className="btn-hand warn" style={{ marginTop: 8 }}>prestige →</span>
        </div>

        <div className="box" style={{ padding: 10 }}>
          <div className="lbl-tiny">YOU KEEP</div>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontFamily: "var(--sans)", fontSize: 13 }}>
            <li>prestige tokens (◆)</li>
            <li>unlocked research nodes</li>
            <li>achievements & bot unlocks</li>
            <li>cosmetic bot variants</li>
          </ul>
        </div>
        <div className="box dashed" style={{ padding: 10 }}>
          <div className="lbl-tiny">YOU LOSE</div>
          <ul style={{ margin: "4px 0 0 18px", padding: 0, fontFamily: "var(--sans)", fontSize: 13 }}>
            <li>points, owned bots, board upgrades</li>
            <li>autorestart stockpile</li>
          </ul>
        </div>

        <div className="box fill-butter" style={{ padding: 10 }}>
          <div className="lbl-tiny">NEXT EXPANSION (P4)</div>
          <div className="lbl-hand">unlocks: legendary bots, fusion II, ×2 offline</div>
        </div>
        <div className="box fill-sky" style={{ padding: 10 }}>
          <div className="lbl-tiny">FAR-FUTURE BRANCH</div>
          <div className="lbl-hand"><b>higher-dimensional boards</b> — 5×5 (P7) → 6×6 (P9) → 7×7 (P12) → 8×8 (P16) → 9×9 (P20). bigger grids, exponential scoring.</div>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// SCREEN 7 — Stats / Achievements
// ───────────────────────────────────────────────────────────

const ScreenStats = ({ direction }) => {
  // sort: incomplete first, completed pushed to bottom; hidden last among completed group
  const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => {
    if (a.got !== b.got) return a.got ? 1 : -1;
    if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
    return 0;
  });
  const completedCount = ACHIEVEMENTS.filter(a => a.got).length;

  // group color by category
  const catColor = {
    tile: "var(--peach)",
    score: "var(--butter)",
    life: "var(--mint)",
    moves: "var(--sky)",
    bot: "var(--lilac)",
    board: "var(--pink)",
    meta: "var(--coral)",
    rage: "var(--coral)",
    hidden: "var(--paper-2)",
  };

  return (
    <div className="col" style={{ gap: 14 }}>
      <div>
        <div className="lbl-note">lifetime stats</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {[
            { l: "total pts", v: "82.4M", c: "var(--butter)" },
            { l: "boards finished", v: "1,204", c: "var(--mint)" },
            { l: "moves made", v: "412k", c: "var(--sky)" },
            { l: "best tile", v: "4096", c: "var(--peach)" },
            { l: "bots owned", v: "5 of 12", c: "var(--lilac)" },
            { l: "prestiges", v: "3", c: "var(--pink)" },
            { l: "rage triggers", v: "84", c: "var(--coral)" },
            { l: "play time", v: "14h 22m", c: "var(--paper-2)" },
          ].map((s, i) => (
            <div key={i} className="box" style={{ padding: 10, background: s.c, transform: `rotate(${(i % 3 - 1) * 0.4}deg)` }}>
              <div className="lbl-tiny">{s.l}</div>
              <div className="lbl-note" style={{ fontSize: 26, fontFamily: "var(--tile-num)", fontWeight: 700 }}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="box" style={{ padding: 10, marginTop: 10 }}>
          <div className="lbl-tiny">POINTS / SECOND OVER LAST HOUR</div>
          <Sparkline seed={11} />
        </div>
      </div>

      <div>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="lbl-note">achievements · {completedCount} of {ACHIEVEMENTS.length}</span>
          <span className="lbl-tiny">unlocked by you OR your bots · in-progress first, completed at the bottom</span>
        </div>
        <div className="box" style={{ padding: 10, background: "var(--paper-2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
            {sortedAchievements.map((a, i) => {
              const bg = a.got ? "var(--paper-2)" : (catColor[a.cat] || "var(--paper)");
              return (
                <div key={a.id} className="box" style={{
                  padding: 8,
                  background: bg,
                  borderStyle: a.got ? "solid" : "dashed",
                  opacity: a.got ? .7 : 1,
                  position: "relative",
                  transform: `rotate(${(i % 5 - 2) * 0.25}deg)`,
                }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="lbl-tiny">{a.cat}</span>
                    <span className="lbl-tiny">{a.got ? "✓" : "—"}</span>
                  </div>
                  <div className="lbl-hand" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                    {a.hidden ? "???" : a.label}
                  </div>
                  <div className="lbl-tiny" style={{ marginTop: 4, fontFamily: "var(--sans)", textTransform: "none", letterSpacing: 0, fontSize: 11, color: "var(--ink-soft)" }}>
                    → {a.hidden ? "?" : a.reward}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="box fill-pink" style={{ padding: 10, marginTop: 10 }}>
          <div className="lbl-tiny">NEXT MILESTONE</div>
          <div className="lbl-hand">reach <b>1024</b> → unlock <b>Minimax · d2</b></div>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// Export screens map
// ───────────────────────────────────────────────────────────

window.SCREENS = {
  early: { title: "Early game", crumb: "01 · manual board + first bot", render: (d, p) => <ScreenEarly direction={d} {...p} /> },
  mid:   { title: "Mid game",   crumb: "02 · board grid + shop",       render: (d, p) => <ScreenMid direction={d} {...p} /> },
  late:  { title: "Late game",  crumb: "03 · abstracted farms",        render: (d, p) => <ScreenLate direction={d} {...p} /> },
  bot:   { title: "Bot detail", crumb: "04 · gacha card + upgrades",   render: (d, p) => <ScreenBot direction={d} {...p} /> },
  shop:  { title: "Shop",       crumb: "05 · catalogue + unlocks",     render: (d, p) => <ScreenShop direction={d} {...p} /> },
  research: { title: "Research + Prestige", crumb: "06 · radial tree + reset", render: (d, p) => <ScreenResearch direction={d} {...p} /> },
  stats: { title: "Stats & Achievements",   crumb: "07 · lifetime + milestones", render: (d, p) => <ScreenStats direction={d} {...p} /> },
};
