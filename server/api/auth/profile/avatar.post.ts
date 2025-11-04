import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { join, isAbsolute as pathIsAbsolute, resolve } from 'path'
import { Configuration, IdentityApi } from '@ory/client'
import { getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Check for Kratos session cookie or Hydra access token
  const kratosSession = getCookie(event, 'ory_kratos_session')
  const accessToken = getCookie(event, 'hydra_access_token')

  let userId: string | null = null

  // Try to get user ID from Kratos session first
  if (kratosSession) {
    try {
      const requestCookies = getHeader(event, 'cookie') || ''
      const sessionResponse = await $fetch<{
        id?: string
        identity?: any
      }>(`${config.kratosPublicUrl}/sessions/whoami`, {
        headers: {
          Cookie: requestCookies,
        },
      })

      if (sessionResponse?.id && sessionResponse?.identity) {
        userId = sessionResponse.identity.id
      }
    } catch (kratosError: any) {
      if (import.meta.dev) {
        console.log('[auth/profile/avatar.post.ts] Kratos session check failed:', kratosError.message)
      }
    }
  }

  // If no Kratos session, try Hydra token
  if (!userId && accessToken) {
    try {
      // Get user info from Hydra's /userinfo endpoint
      const hydraUserInfo = await $fetch(`${config.hydraPublicUrl}/userinfo`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }) as any

      if (hydraUserInfo?.sub) {
        userId = hydraUserInfo.sub
      }
    } catch (hydraError: any) {
      if (import.meta.dev) {
        console.log('[auth/profile/avatar.post.ts] Hydra token check failed:', hydraError.message)
      }
    }
  }

  // If no valid authentication found, return 401
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {

    // Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided',
      })
    }

    // Find the avatar file
    const avatarFile = formData.find((field) => field.name === 'avatar' && field.filename)

    if (!avatarFile || !avatarFile.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No avatar file provided',
      })
    }

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!avatarFile.type || !validMimeTypes.includes(avatarFile.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.',
      })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (avatarFile.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File size exceeds 5MB limit',
      })
    }

    // Create storage directory if it doesn't exist
    const storagePath = config.avatarStoragePath || 'avatars'
    const absoluteStoragePath = pathIsAbsolute(storagePath) ? storagePath : resolve(process.cwd(), storagePath)

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Storage path:', storagePath)
      console.log('[auth/profile/avatar.post.ts] Absolute storage path:', absoluteStoragePath)
    }

    if (!existsSync(absoluteStoragePath)) {
      await mkdir(absoluteStoragePath, { recursive: true })
      if (process.env.NODE_ENV === 'development') {
        console.log('[auth/profile/avatar.post.ts] Created storage directory:', absoluteStoragePath)
      }
    }

    // Generate unique filename using GUID
    const fileExtension = avatarFile.filename?.split('.').pop() || 'jpg'
    const guid = randomUUID()
    const fileName = `${guid}.${fileExtension}`
    const filePath = join(absoluteStoragePath, fileName)

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Saving file as:', fileName)
    }

    // Save file to disk
    await writeFile(filePath, avatarFile.data)

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] File saved successfully to:', filePath)
    }

    // Generate avatar URL (must be full URI for Kratos validation)
    // avatarBaseUrl might be relative path like "/uploads/avatars" or full URL
    let avatarUrl: string
    const avatarBaseUrl = config.avatarBaseUrl || '/uploads/avatars'
    
    if (avatarBaseUrl.startsWith('http://') || avatarBaseUrl.startsWith('https://')) {
      // Full URL already provided (e.g., "http://localhost:3000/uploads/avatars")
      avatarUrl = `${avatarBaseUrl.replace(/\/$/, '')}/${fileName}`
    } else {
      // Relative path - need to add base URL
      // Use NUXT_PUBLIC_SITE_URL or APP_URL from config, fallback to localhost
      const siteUrl = config.public.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || process.env.APP_URL || 'http://localhost:3000'
      const cleanPath = avatarBaseUrl.startsWith('/') ? avatarBaseUrl : `/${avatarBaseUrl}`
      avatarUrl = `${siteUrl}${cleanPath.replace(/\/$/, '')}/${fileName}`
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Avatar URL:', avatarUrl)
    }

    // Get Kratos Identity using Kratos Admin API
    const kratosAdmin = new IdentityApi(new Configuration({
      basePath: config.kratosAdminUrl,
    }))

    // Get current identity
    const { data: currentIdentity } = await kratosAdmin.getIdentity({ id: userId }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/profile/avatar.post.ts] Failed to get identity from Kratos:', error)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    })

    // Update identity with avatar URL
    const updatedTraits = {
      ...currentIdentity.traits,
      avatar: avatarUrl,
    }

    await kratosAdmin.updateIdentity({
      id: userId,
      updateIdentityBody: {
        schema_id: currentIdentity.schema_id,
        traits: updatedTraits,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/profile/avatar.post.ts] Failed to update identity:', error)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update avatar',
      })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Avatar updated successfully in Kratos')
    }

    return {
      success: true,
      message: 'Avatar updated successfully',
      avatar: avatarUrl,
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/profile/avatar.post.ts] Error:', error.statusCode || error.status)
      console.error('[auth/profile/avatar.post.ts] Full error:', error)
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload avatar',
    })
  }
})
