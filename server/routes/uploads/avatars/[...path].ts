import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { join, isAbsolute as pathIsAbsolute, resolve } from 'path'

export default defineEventHandler(async (event) => {
  // Check if user is authenticated (optional - avatars are generally public)
  const accessToken = getCookie(event, 'kc_access')

  const config = useRuntimeConfig()
  const pathParam = getRouterParam(event, 'path')

  if (process.env.NODE_ENV === 'development') {
    console.log('[uploads/avatars/[...path].ts] Route called with pathParam:', pathParam)
  }

  if (!pathParam) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[uploads/avatars/[...path].ts] No pathParam provided')
    }
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found',
    })
  }

  // Extract filename from path (e.g., "7b225299-514e-4d26-b9a8-bd8cef8196cc.jpg")
  const fileName = pathParam.split('/').pop() || pathParam
  const storagePath = config.avatarStoragePath || 'avatars'
  const absoluteStoragePath = pathIsAbsolute(storagePath) ? storagePath : resolve(process.cwd(), storagePath)
  const filePath = join(absoluteStoragePath, fileName)

  if (process.env.NODE_ENV === 'development') {
    console.log('[uploads/avatars/[...path].ts] Looking for file:', filePath)
    console.log('[uploads/avatars/[...path].ts] Storage path:', storagePath)
    console.log('[uploads/avatars/[...path].ts] File name:', fileName)
  }

  if (!existsSync(filePath)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[uploads/avatars/[...path].ts] File not found at:', filePath)
    }
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found',
    })
  }

  try {
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on extension
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    }
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream'
    
    // Set headers and return the file
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[uploads/avatars/[...path].ts] Serving file:', fileName)
    }
    
    return fileBuffer
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[uploads/avatars/[...path].ts] Error reading file:', error.message)
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Error reading file',
    })
  }
})

