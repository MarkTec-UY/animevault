/**
 * Sanitize HTML content - remove dangerous tags but preserve formatting tags
 * Converts <br> tags to <br /> and removes dangerous tags like script, style, etc.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ""

  // List of allowed tags (formatting only - no attributes)
  const allowedTags = ['strong', 'b', 'em', 'i', 'u', 'br']

  return html
    .replace(/<br\s*\/?>/gi, '<br />') // Normalize <br> tags
    .split('<')
    .map((part, index) => {
      if (index === 0) return part // First part has no tag
      
      const tagMatch = part.match(/^\/?\w+/)
      if (!tagMatch) return '<' + part // Not a valid tag
      
      const tagName = tagMatch[0].toLowerCase().replace(/^\/?/, '')
      if (allowedTags.includes(tagName)) {
        return '<' + part // Keep allowed tags
      }
      
      // Remove disallowed tags but keep content
      const closeIndex = part.indexOf('>')
      return closeIndex !== -1 ? part.substring(closeIndex + 1) : part
    })
    .join('')
    .trim()
}

/**
 * Truncate text to a maximum length and add ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "…"
}
