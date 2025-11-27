/**
 * Composable for parsing CSV files for bulk link creation
 */

interface BulkLinkInput {
  id: string
  url: string
  title?: string
  description?: string
  isValid: boolean
  error?: string
}

export const useCSVParser = () => {
  /**
   * Validates a URL string
   */
  function validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || !url.trim()) {
      return { isValid: false, error: 'URL is required' }
    }
    
    try {
      const urlObj = new URL(url)
      // Ensure it has http or https protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'URL must use http or https protocol' }
      }
      return { isValid: true }
    } catch {
      // Try adding https:// if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        try {
          new URL(`https://${url}`)
          return { isValid: false, error: 'URL must include protocol (http:// or https://)' }
        } catch {
          return { isValid: false, error: 'Invalid URL format' }
        }
      }
      return { isValid: false, error: 'Invalid URL format' }
    }
  }

  /**
   * Parses CSV content string
   */
  function parseCSVContent(content: string): BulkLinkInput[] {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    if (lines.length === 0) return []

    // Detect delimiter (comma, semicolon, or tab)
    const firstLine = lines[0]
    let delimiter = ','
    if (firstLine.includes(';')) delimiter = ';'
    else if (firstLine.includes('\t')) delimiter = '\t'

    // Parse header
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase())
    const urlIndex = headers.findIndex(h => h === 'url' || h === 'link' || h === 'destination')
    const titleIndex = headers.findIndex(h => h === 'title' || h === 'name')
    const descriptionIndex = headers.findIndex(h => h === 'description' || h === 'desc')

    if (urlIndex === -1) {
      // If no URL column found, assume first column is URL (limit to 100)
      return lines.slice(1, 101).map((line, index) => {
        const values = line.split(delimiter).map(v => v.trim())
        const url = values[0] || ''
        const validation = validateUrl(url)
        return {
          id: String(index + 1),
          url,
          title: values[1] || '',
          description: values[2] || '',
          isValid: validation.isValid,
          error: validation.error,
        }
      })
    }

    // Parse data rows (limit to 100)
    return lines.slice(1, 101).map((line, index) => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
      const url = values[urlIndex] || ''
      const validation = validateUrl(url)
      return {
        id: String(index + 1),
        url,
        title: titleIndex >= 0 ? (values[titleIndex] || '') : '',
        description: descriptionIndex >= 0 ? (values[descriptionIndex] || '') : '',
        isValid: validation.isValid,
        error: validation.error,
      }
    })
  }

  /**
   * Parses a CSV file
   */
  async function parseCSV(file: File): Promise<BulkLinkInput[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const parsed = parseCSVContent(content)
          resolve(parsed)
        } catch (error) {
          reject(new Error('Failed to parse CSV file'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read CSV file'))
      }
      
      reader.readAsText(file)
    })
  }

  return {
    parseCSV,
    parseCSVContent,
    validateUrl,
  }
}

