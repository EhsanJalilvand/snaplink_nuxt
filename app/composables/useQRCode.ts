/**
 * Composable for generating QR code URLs
 */
export const useQRCode = () => {
  /**
   * Generates a QR code URL from a given URL string
   * @param url - The URL to encode (can be with or without protocol)
   * @param size - The size of the QR code (default: 300)
   * @returns The QR code image URL
   */
  function getQRCodeUrl(url: string, size: number = 300): string {
    // Ensure full URL is encoded properly - always include protocol
    let fullUrl = url.trim()
    
    // If URL doesn't start with http:// or https://, add https://
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `https://${fullUrl}`
    }
    
    // Encode the entire URL to ensure path and all parts are preserved
    // encodeURIComponent properly encodes all special characters including slashes
    const encodedUrl = encodeURIComponent(fullUrl)
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`
  }

  return {
    getQRCodeUrl,
  }
}

