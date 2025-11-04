import { existsSync } from 'fs'
import { unlink } from 'fs/promises'
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
        console.log('[auth/profile/avatar.delete.ts] Kratos session check failed:', kratosError.message)
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
        console.log('[auth/profile/avatar.delete.ts] Hydra token check failed:', hydraError.message)
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

    // Get Kratos Identity using Kratos Admin API
    const kratosAdmin = new IdentityApi(new Configuration({
      basePath: config.kratosAdminUrl,
    }))

    // Get current identity
    const { data: currentIdentity } = await kratosAdmin.getIdentity({ id: userId }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/profile/avatar.delete.ts] Failed to get identity from Kratos:', error)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    })

    // Delete the physical file if it exists
    const avatarUrl = currentIdentity.traits?.avatar
    if (avatarUrl && typeof avatarUrl === 'string') {
      try {
        // Extract filename from URL (e.g., "/uploads/avatars/userid-123.jpg")
        const urlParts = avatarUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const storagePath = config.avatarStoragePath || 'avatars'
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

    // Remove avatar from identity traits
    const updatedTraits = { ...currentIdentity.traits }
    delete updatedTraits.avatar

    // Update identity in Kratos
    await kratosAdmin.updateIdentity({
      id: userId,
      updateIdentityBody: {
        schema_id: currentIdentity.schema_id,
        traits: updatedTraits,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/profile/avatar.delete.ts] Failed to update identity:', error)
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
