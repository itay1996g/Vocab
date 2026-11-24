// Latin accents, Hebrew niqqud and Arabic harakat, after NFD splits them from their letters.
const DIACRITICS = /[̀-֑ͯ-ׇً-ٟ]/g

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/\p{P}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// The saved text can hold several answers ("big, large / huge") and notes in parentheses.
function acceptedAnswers(expected: string): string[] {
  const parts = [expected, ...expected.split(/[,/;\n]/)]
  const partsWithoutNotes = parts.map((part) => part.replace(/\(.*?\)/g, ''))
  return [...parts, ...partsWithoutNotes].map(normalizeText).filter(Boolean)
}

export function isCorrectAnswer(answer: string, expected: string): boolean {
  const normalizedAnswer = normalizeText(answer)
  if (!normalizedAnswer) return false
  return acceptedAnswers(expected).includes(normalizedAnswer)
}
