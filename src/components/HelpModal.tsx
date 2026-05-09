import { Modal } from './Modal'

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="how to play" size="lg">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card title="currencies" body="Points buy bots, board slots, and autorestart refills. Prestige tokens (◆) buy research nodes." color="var(--color-butter)" />
        <Card title="bots are cards" body="Each bot is a stand-alone card with a strategy. Drop one onto a board and it plays autonomously." color="var(--color-mint)" />
        <Card title="boards" body="A board is a single 2048 game. You play it manually or assign a bot. Bigger sizes (5×5+) unlock through research." color="var(--color-sky)" />
        <Card title="autorestarts" body="When a board locks up, an autorestart spends 1 charge to refresh it. Pool refills slowly over time. Manual lockups cost a charge too." color="var(--color-coral)" />
      </div>
      <div className="mt-4 text-xs text-[var(--color-ink-soft)]">
        Hotkeys: 1..7 switch tabs · ? opens help · Esc closes modals · arrows / WASD move on the manual board.
      </div>
    </Modal>
  )
}

const Card = ({ title, body, color }: { title: string; body: string; color: string }) => (
  <div className="rounded-xl border border-[var(--color-ink)] p-3" style={{ background: color }}>
    <div className="font-serif text-lg">{title}</div>
    <div className="mt-1 text-sm">{body}</div>
  </div>
)
