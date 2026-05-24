export type VocabularySuggestion = {
  word: string
}

type DatamuseSuggestion = {
  word?: unknown
}

export async function fetchVocabularySuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<VocabularySuggestion[]> {
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < 2) {
    return []
  }

  const response = await fetch(
    `https://api.datamuse.com/sug?s=${encodeURIComponent(normalizedQuery)}&max=8`,
    { signal },
  )

  if (!response.ok) {
    return []
  }

  const data = (await response.json()) as DatamuseSuggestion[]

  return data
    .map((item) => item.word)
    .filter((word): word is string => typeof word === 'string' && word.length > 0)
    .map((word) => ({ word }))
}
