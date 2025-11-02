import { existsSync } from 'fs'
import { unlink } from 'fs/promises'
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

    // Get admin token
    const adminTokenUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.delete.ts] Getting admin token with client_id:', config.keycloakClientId || 'my-client')
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
        console.error('[auth/profile/avatar.delete.ts] Failed to get admin token:', error)
        console.error('[auth/profile/avatar.delete.ts] Admin token error details:', error.data || error.message)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Service temporarily unavailable',
      })
    }) as any

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.delete.ts] Admin token retrieved successfully')
    }

    // Get current user data to retrieve avatar URL
    const getUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}`

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.delete.ts] Getting user data for userId:', userId)
    }

    const currentUser = await $fetch(getUserUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/profile/avatar.delete.ts] Failed to get user:', error)
        console.error('[auth/profile/avatar.delete.ts] Get user error details:', error.data || error.message)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }) as any

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.delete.ts] User data retrieved successfully, current attributes:', Object.keys(currentUser.attributes || {}))
    }

    // Delete the physical file if it exists
    const avatarUrl = currentUser.attributes?.avatar?.[0]
    if (avatarUrl) {
      try {
        // Extract filename from URL (e.g., "/uploads/avatars/userid-123.jpg")
        const urlParts = avatarUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const storagePath = config.avatarStoragePath || '.app/public/uploads/avatars'
        const absoluteStoragePath = pathIsAbsolute(storagePath) ? storagePath : resolve(process.cwd(), storagePath)
        const filePath = join(absoluteStoragePath, fileName)

        if (existsSync(filePath)) {
          await unlink(filePath)
          if (process.env.NODE_ENV === 'development') {
            console.log('[auth/profile/avatar.delete.ts] Physical file deleted:', filePath)
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[auth/profile/avatar.delete.ts] File not found at:', filePath)
          }
        }
      } catch (fileError: any) {
        // Log but don't fail the request if file deletion fails
        if (process.env.NODE_ENV === 'development') {
          console.error('[auth/profile/avatar.delete.ts] Failed to delete physical file:', fileError.message)
        }
      }
    }

    // Remove avatar from user attributes
    const attributes = currentUser.attributes || {}
    delete attributes.avatar

    const updateUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}`

    const updateData: any = {
      ...currentUser,
      attributes,
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.delete.ts] Updating user to remove avatar attribute')
    }

    await $fetch(updateUserUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: updateData,
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/profile/avatar.delete.ts] Failed to update user:', error)
        console.error('[auth/profile/avatar.delete.ts] Error details:', error.data || error.message)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to remove avatar',
      })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile/avatar.delete.ts] Avatar removed successfully')
    }

    return {
      success: true,
      message: 'Avatar removed successfully',
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/profile/avatar.delete.ts] Error:', error.statusCode || error.status)
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to remove avatar',
    })
  }
})
