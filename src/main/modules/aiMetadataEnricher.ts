/**
 * AI Metadata Enrichment Agent
 * Supports Google Gemini API (Free Tier) & Groq API (Free Tier)
 * Cleans titles, extracts Sanskrit shloka references, topics, and synopses.
 */

export interface AIEnrichmentResult {
  cleanTitle: string
  titleHindi?: string
  scripture: string
  canto?: string
  chapter?: string
  verse?: string
  philosophyTopic: string
  synopsis: string
  keyTakeaways: string[]
  festival?: string
  speaker: string
}

export async function enrichWithGemini(
  rawTitle: string,
  rawDescription: string,
  geminiApiKey: string
): Promise<AIEnrichmentResult | null> {
  try {
    const prompt = `You are a Sanskrit and Vedic scholar assisting in archiving discourses by Dr. Laxmidhar Behera (HG Lila Purushottam Das).
Given this raw YouTube title and description:
Title: "${rawTitle}"
Description: "${rawDescription.substring(0, 500)}"

Respond ONLY with a JSON object in this exact schema (no markdown, no backticks):
{
  "cleanTitle": "Clean title without YouTube noise/hashtags/pipes",
  "titleHindi": "Devanagari title if applicable, or empty string",
  "scripture": "e.g. Srimad Bhagavatam, Bhagavad Gita, Sri Caitanya Bhagavata, or General Discourse",
  "canto": "e.g. 1, 10, or empty string",
  "chapter": "e.g. 4, or empty string",
  "verse": "e.g. BG 4.34, SB 10.2.13, or empty string",
  "philosophyTopic": "Core philosophical topic discussed",
  "synopsis": "1-2 sentence overview of the lecture",
  "keyTakeaways": ["point 1", "point 2"],
  "festival": "Festival name if applicable (e.g. Balaram Jayanti, Janmashtami), or empty string",
  "speaker": "Dr. Laxmidhar Behera (HG Lila Purushottam Das)"
}`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    })

    if (!res.ok) {
      console.warn('Gemini enrichment request failed:', res.statusText)
      return null
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null

    return JSON.parse(text) as AIEnrichmentResult
  } catch (e: any) {
    console.warn('Error enriching with Gemini:', e.message)
    return null
  }
}

export async function enrichWithGroq(
  rawTitle: string,
  rawDescription: string,
  groqApiKey: string
): Promise<AIEnrichmentResult | null> {
  try {
    const systemPrompt = `You are a Vedic metadata specialist archiving discourses by Dr. Laxmidhar Behera (HG Lila Purushottam Das). Respond ONLY with valid JSON.`
    const userPrompt = `Parse this lecture title: "${rawTitle}" and description: "${rawDescription.substring(0, 400)}".
JSON Format:
{
  "cleanTitle": "Clean title without noise",
  "titleHindi": "Devanagari title or empty",
  "scripture": "Bhagavad Gita / Srimad Bhagavatam / etc",
  "canto": "Canto or empty",
  "chapter": "Chapter or empty",
  "verse": "Verse or empty",
  "philosophyTopic": "Subject",
  "synopsis": "Summary",
  "keyTakeaways": ["key point 1"],
  "festival": "Festival or empty",
  "speaker": "Dr. Laxmidhar Behera (HG Lila Purushottam Das)"
}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    })

    if (!res.ok) return null
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) return null
    return JSON.parse(text) as AIEnrichmentResult
  } catch (e: any) {
    console.warn('Error enriching with Groq:', e.message)
    return null
  }
}
