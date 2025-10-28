export default defineEventHandler(async (event) => {
  try {
    // Check if user has auth token
    const authToken = getCookie(event, 'auth_token')
    
    if (!authToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Not authenticated',
      })
    }

    // Test data for development
    if (authToken === 'fake-jwt-token') {
      return {
        success: true,
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@admin.com',
          firstName: 'Admin',
          lastName: 'User',
          emailVerified: true,
          roles: ['admin', 'user']
        }
      }
    } else {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
      })
    }
  } catch (error: any) {
    console.error('Get user error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get user info',
    })
  }
})