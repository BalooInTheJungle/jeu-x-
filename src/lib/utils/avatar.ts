export const AVATAR_COLORS = [
  '#FF6035',
  '#7C4DFF',
  '#00BCD4',
  '#FF4081',
  '#FFD700',
  '#69F0AE',
]

export const AVATAR_EMOJIS = ['🦊', '🐸', '🐶', '🦋', '🦁', '🐙', '🐼', '🐧', '🦉', '🦅']

export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

export function getAvatarEmoji(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) & 0xffffffff
  }
  return AVATAR_EMOJIS[Math.abs(hash) % AVATAR_EMOJIS.length]
}
