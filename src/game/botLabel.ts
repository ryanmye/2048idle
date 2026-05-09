import type { Bot, BotCatalogEntry } from './types'

/** Primary line: serial plus nickname or catalog name (e.g. `3 · Corner`). */
export function botTitleLine(bot: Bot, cat: BotCatalogEntry | undefined): string {
  const name = (bot.nickname?.trim() || cat?.name || bot.type) as string
  return `${bot.serial} · ${name}`
}
