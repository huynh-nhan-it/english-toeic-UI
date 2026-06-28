import type { DictionaryDetails, VocabularySuggestion, ToeicCollocation } from '../types'

// Cache-Aside Pattern: In-memory caches for word details and collocations
const wordDetailsCache = new Map<string, DictionaryDetails>()
const onlineColloCache = new Map<string, ToeicCollocation[]>()

export async function fetchVocabularySuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<VocabularySuggestion[]> {
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < 2) {
    return []
  }

  try {
    const response = await fetch(
      `https://api.datamuse.com/sug?s=${encodeURIComponent(normalizedQuery)}&max=8`,
      { signal },
    )

    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as { word?: unknown }[]

    return data
      .map((item) => item.word)
      .filter((word): word is string => typeof word === 'string' && word.length > 0)
      .map((word) => ({ word }))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    console.error('Suggestions API error:', error)
    return []
  }
}

export async function fetchWordDetails(word: string): Promise<DictionaryDetails> {
  const normalizedWord = word.trim().toLowerCase()

  // 1. Check cache first (Cache-Aside Pattern)
  if (wordDetailsCache.has(normalizedWord)) {
    return wordDetailsCache.get(normalizedWord)!
  }

  let phonetic = ''
  let definition = ''
  let translation = ''
  let rawSynonyms: string[] = []
  let example = ''
  let audioUrl: string | undefined = undefined

  // 2. Fetch Vietnamese Translation
  try {
    const transRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(normalizedWord)}`
    )
    if (transRes.ok) {
      const transData = await transRes.json()
      if (transData && transData[0] && transData[0][0] && transData[0][0][0]) {
        translation = transData[0][0][0]
      }
    }
  } catch (err) {
    console.error('Translation error:', err)
  }

  // 3. Fetch English Dictionary Details
  try {
    const dictRes = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`
    )
    if (dictRes.ok) {
      const dictData = await dictRes.json()
      if (Array.isArray(dictData) && dictData.length > 0) {
        const entry = dictData[0]
        phonetic = entry.phonetic || entry.phonetics?.[0]?.text || ''

        // Find audio
        const audioObj = entry.phonetics?.find((p: { audio?: string }) => p.audio && p.audio.length > 0)
        if (audioObj) {
          audioUrl = audioObj.audio
        }

        // Get first meaning/definition
        if (entry.meanings && entry.meanings.length > 0) {
          const meaning = entry.meanings[0]

          if (meaning.definitions && meaning.definitions.length > 0) {
            definition = meaning.definitions[0].definition || ''
            example = meaning.definitions[0].example || ''
          }

          // Gather synonyms from meanings
          const synsSet = new Set<string>()
          entry.meanings.forEach((m: { synonyms?: string[] }) => {
            if (Array.isArray(m.synonyms)) {
              m.synonyms.forEach((s: string) => {
                if (s.toLowerCase() !== normalizedWord) {
                  synsSet.add(s)
                }
              })
            }
          })
          rawSynonyms = Array.from(synsSet).slice(0, 4)
        }
      }
    }
  } catch (err) {
    console.error('Dictionary API error:', err)
  }

  // 4. Fetch details for synonyms in parallel
  const synonyms = await Promise.all(
    rawSynonyms.map(async (syn) => {
      let synExample = ''
      let synTranslation = ''

      try {
        const transRes = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(syn)}`
        )
        if (transRes.ok) {
          const transData = await transRes.json()
          if (transData && transData[0] && transData[0][0] && transData[0][0][0]) {
            synTranslation = transData[0][0][0]
          }
        }
      } catch (err) {
        console.error('Synonym translation error:', err)
      }

      try {
        const dictRes = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(syn)}`
        )
        if (dictRes.ok) {
          const dictData = await dictRes.json()
          if (Array.isArray(dictData) && dictData.length > 0) {
            const entry = dictData[0]
            if (entry.meanings) {
              for (const m of entry.meanings) {
                if (m.definitions) {
                  for (const d of m.definitions) {
                    if (d.example) {
                      synExample = d.example
                      break
                    }
                  }
                }
                if (synExample) break
              }
            }
          }
        }
      } catch (err) {
        console.error('Synonym dict error:', err)
      }

      return {
        word: syn,
        translation: synTranslation || undefined,
        example: synExample || undefined,
      }
    })
  )

  const result: DictionaryDetails = {
    word: normalizedWord,
    phonetic,
    definition,
    translation,
    synonyms,
    example,
    audioUrl,
  }

  // Save to cache
  wordDetailsCache.set(normalizedWord, result)
  return result
}

export async function fetchOnlineCollocations(keyword: string): Promise<ToeicCollocation[]> {
  const trimmed = keyword.trim().toLowerCase()
  if (trimmed.length < 2) return []

  // Check cache first (Cache-Aside Pattern)
  if (onlineColloCache.has(trimmed)) {
    return onlineColloCache.get(trimmed)!
  }

  try {
    const [resAfter, resBefore] = await Promise.all([
      fetch(`https://api.datamuse.com/words?rel_bga=${encodeURIComponent(trimmed)}&max=3`).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`https://api.datamuse.com/words?rel_bgb=${encodeURIComponent(trimmed)}&max=3`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])

    const candidatePhrases: string[] = []

    if (Array.isArray(resAfter)) {
      resAfter.forEach((item: { word?: string }) => {
        if (item.word && item.word.trim().length > 0) {
          candidatePhrases.push(`${trimmed} ${item.word.trim()}`)
        }
      })
    }

    if (Array.isArray(resBefore)) {
      resBefore.forEach((item: { word?: string }) => {
        if (item.word && item.word.trim().length > 0) {
          candidatePhrases.push(`${item.word.trim()} ${trimmed}`)
        }
      })
    }

    // Fallback: If no bigrams found, fetch semantically related words (ml) to pair
    if (candidatePhrases.length === 0) {
      const resMl = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(trimmed)}&max=4`).then((r) =>
        r.ok ? r.json() : []
      )
      if (Array.isArray(resMl)) {
        resMl.forEach((item: { word?: string }) => {
          if (item.word && item.word.trim().length > 0 && item.word.toLowerCase() !== trimmed) {
            candidatePhrases.push(`${trimmed} ${item.word.trim()}`)
          }
        })
      }
    }

    const uniquePhrases = Array.from(new Set(candidatePhrases)).slice(0, 5)

    const results = await Promise.all(
      uniquePhrases.map(async (phrase) => {
        let translation = ''
        const example = `We decided to ${phrase} in order to improve our operational efficiency.`
        let exampleTranslation = ''
        // Translate collocation phrase
        try {
          const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(phrase)}`
          )
          if (transRes.ok) {
            const transData = await transRes.json()
            if (transData && transData[0] && transData[0][0] && transData[0][0][0]) {
              translation = transData[0][0][0]
            }
          }
        } catch {
          translation = `cụm từ liên quan đến ${trimmed}`
        }

        try {
          const transExRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(example)}`
          )
          if (transExRes.ok) {
            const transExData = await transExRes.json()
            if (transExData && transExData[0] && transExData[0][0] && transExData[0][0][0]) {
              exampleTranslation = transExData[0][0][0]
            }
          }
        } catch {
          exampleTranslation = 'Chúng tôi quyết định thực hiện việc này nhằm nâng cao hiệu quả hoạt động.'
        }

        return {
          phrase,
          translation: translation || phrase,
          category: 'Online Search' as const,
          example,
          exampleTranslation: exampleTranslation || 'Ví dụ dịch tự động.',
        }
      })
    )

    onlineColloCache.set(trimmed, results)
    return results
  } catch (err) {
    console.error('Error fetching online collocations:', err)
    return []
  }
}
