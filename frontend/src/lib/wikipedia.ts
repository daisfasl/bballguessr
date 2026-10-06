// Wikipedia's REST summary endpoint sends access-control-allow-origin: *, so the browser calls it directly
export async function getWikipediaSummary(title: string): Promise<string> {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
    if (!res.ok) {
        throw new Error()
    }
    const body = await res.json() as { extract?: string }
    if (!body.extract) {
        throw new Error()
    }
    return body.extract
}

export function wikipediaUrl(title: string): string {
    return `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
}

export function youtubeHighlightsUrl(name: string): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} NBA highlights`)}`
}
