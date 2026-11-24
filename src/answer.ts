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

// English verbs: "to have" and "have" are the same answer.
function withoutInfinitiveTo(normalizedText: string): string {
  return normalizedText.replace(/^to /, '')
}

// The saved text can hold several answers ("big, large / huge") and notes in parentheses.
function acceptedAnswers(expected: string): string[] {
  const parts = [expected, ...expected.split(/[,/;\n]/)]
  const partsWithoutNotes = parts.map((part) => part.replace(/\(.*?\)/g, ''))
  return [...parts, ...partsWithoutNotes].map(normalizeText).map(withoutInfinitiveTo).filter(Boolean)
}

export function isCorrectAnswer(answer: string, expected: string): boolean {
  const normalizedAnswer = withoutInfinitiveTo(normalizeText(answer))
  if (!normalizedAnswer) return false
  return acceptedAnswers(expected).includes(normalizedAnswer)
}
