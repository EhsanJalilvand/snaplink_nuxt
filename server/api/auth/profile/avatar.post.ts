import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { join, isAbsolute as pathIsAbsolute, resolve } from 'path'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Get access token from cookie
  const accessToken = getCookie(event, 'kc_access')

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {
    // Parse token to get user ID
    const tokenParts = accessToken.split('.')
    if (tokenParts.length !== 3) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
      })
    }

    const payload = Buffer.from(tokenParts[1], 'base64').toString('utf-8')
    const tokenParsed = JSON.parse(payload)
    const userId = tokenParsed.sub

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
      })
    }

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
    // Get absolute path - if storagePath is already absolute, use it directly, otherwise resolve from workspace root
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

    // Generate avatar URL
    const baseUrl = config.avatarBaseUrl || '/uploads/avatars'
    const avatarUrl = `${baseUrl}/${fileName}`

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Avatar URL:', avatarUrl)
    }

    // Get admin token
    const adminTokenUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Getting admin token with client_id:', config.keycloakClientId || 'my-client')
    }

    const adminTokenResponse = await $fetch(adminTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.keycloakClientId || 'my-client',
        client_secret: config.keycloakClientSecret || '0fA6K2dgvnr2ZZlt6mW0GcPad7ThGqvp',
      }),
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/profile/avatar.post.ts] Failed to get admin token:', error)
        console.error('[auth/profile/avatar.post.ts] Admin token error details:', error.data || error.message)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Service temporarily unavailable',
      })
    }) as any

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Admin token retrieved successfully')
    }

    // Get current user data
    const getUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}`

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Getting user data for userId:', userId)
    }

    const currentUser = await $fetch(getUserUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/profile/avatar.post.ts] Failed to get user:', error)
        console.error('[auth/profile/avatar.post.ts] Get user error details:', error.data || error.message)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }) as any

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] User data retrieved successfully, current attributes:', Object.keys(currentUser.attributes || {}))
    }

    // Update user attributes with avatar URL
    const attributes = currentUser.attributes || {}
    attributes.avatar = [avatarUrl] // Store URL as attribute

    const updateUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}`

    const updateData: any = {
      ...currentUser,
      attributes,
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Updating user with avatar attribute')
      console.log('[auth/profile/avatar.post.ts] Update data structure:', {
        hasAttributes: !!(updateData.attributes),
        avatarArrayLength: updateData.attributes?.avatar?.length || 0,
        avatarUrl: updateData.attributes?.avatar?.[0],
      })
    }

    const updateResponse = await $fetch(updateUserUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: updateData,
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/profile/avatar.post.ts] Failed to update user:', error)
        console.error('[auth/profile/avatar.post.ts] Error details:', error.data || error.message)
        console.error('[auth/profile/avatar.post.ts] Error status:', error.statusCode)
        console.error('[auth/profile/avatar.post.ts] Error response:', JSON.stringify(error.data || {}, null, 2))
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update avatar',
      })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.post.ts] Avatar updated successfully in Keycloak')
      console.log('[auth/profile/avatar.post.ts] Update response:', updateResponse)
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
