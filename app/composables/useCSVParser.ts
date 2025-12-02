export const useCSVParser = () => {
  const parseCSV = async (
    file: File,
    expectedColumns: string[]
  ): Promise<Record<string, string>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())

          if (lines.length === 0) {
            reject(new Error('CSV file is empty'))
            return
          }

          // Parse header
          const header = lines[0].split(',').map(h => h.trim().toLowerCase())

          // Parse rows
          const data: Record<string, string>[] = []

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',')
            const row: Record<string, string> = {}

            header.forEach((col, index) => {
              row[col] = values[index]?.trim() || ''
            })

            // Map common variations
            if (row['url']) row['destinationUrl'] = row['url']
            if (row['destination']) row['destinationUrl'] = row['destination']
            if (row['dest']) row['destinationUrl'] = row['dest']

            data.push(row)
          }

          resolve(data)
        } catch (error: any) {
          reject(new Error(`Failed to parse CSV: ${error.message}`))
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
  }
}
