import { Configuration, FrontendApi, IdentityApi } from '@ory/client'
import { getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Get Kratos session cookie
  const kratosSession = getCookie(event, 'ory_kratos_session')
  
  // Get Hydra access token cookie
  const accessToken = getCookie(event, 'hydra_access_token')

  if (!kratosSession && !accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'No active session found',
    })
  }

  try {
    let userId: string | null = null
    let userEmail: string | null = null

    // Try to get user ID and email from Kratos session
    if (kratosSession) {
      try {
        const kratosConfig = new Configuration({
          basePath: config.kratosPublicUrl,
        })
        const frontendApi = new FrontendApi(kratosConfig)
        
        const requestCookies = getHeader(event, 'cookie') || ''
        const sessionResponse = await frontendApi.toSession(undefined, {
          headers: {
            Cookie: requestCookies || `ory_kratos_session=${kratosSession}`,
          },
        })

        if (sessionResponse.data?.identity?.id) {
          userId = sessionResponse.data.identity.id
          userEmail = sessionResponse.data.identity.traits?.email || sessionResponse.data.identity.traits?.email_address || null
        }
      } catch (kratosError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor/setup.post.ts] Kratos session check failed:', kratosError)
        }
      }
    }

    // If Kratos session failed, try Hydra token
    if (!userId && accessToken) {
      try {
        const userinfoResponse = await $fetch(`${config.hydraPublicUrl}/userinfo`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }) as any

        if (userinfoResponse?.sub) {
          userId = userinfoResponse.sub
          userEmail = userinfoResponse.email || null
        }
      } catch (hydraError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor/setup.post.ts] Hydra token check failed:', hydraError)
        }
      }
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Unable to identify user',
      })
    }

    if (!userEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User email not found',
        message: 'Unable to find user email address',
      })
    }

    // Use Kratos Settings Flow to setup TOTP
    // This will create a TOTP setup flow with QR code
    try {
      const kratosConfig = new Configuration({
        basePath: config.kratosPublicUrl,
      })
      const frontendApi = new FrontendApi(kratosConfig)
      
      const requestCookies = getHeader(event, 'cookie') || ''
      
      // Create settings flow for TOTP setup
      const settingsFlow = await frontendApi.createBrowserSettingsFlow({
        returnTo: `${config.public.siteUrl}/dashboard/settings/security`,
      }, {
        headers: requestCookies ? { Cookie: requestCookies } : undefined,
      })
      
      if (import.meta.dev) {
        console.log('[auth/two-factor/setup.post.ts] Settings flow created:', {
          hasData: !!settingsFlow.data,
          flowId: settingsFlow.data?.id,
          hasUi: !!settingsFlow.data?.ui,
          nodesCount: settingsFlow.data?.ui?.nodes?.length || 0,
        })
      }
      
      if (!settingsFlow.data?.id) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create settings flow',
          message: 'Settings flow was created but no flow ID was returned',
        })
      }
      
      if (settingsFlow.data?.id) {
        // Get CSRF token from flow
        const csrfToken = settingsFlow.data.ui?.nodes?.find(
          (node: any) => node.attributes?.name === 'csrf_token'
        )?.attributes?.value
        
        // Find TOTP node in the flow
        const totpNode = settingsFlow.data.ui?.nodes?.find(
          (node: any) => node.group === 'totp' && node.attributes?.name === 'totp_unlink'
        )
        
        // Check if TOTP is already configured
        const hasTotp = totpNode !== undefined
        
        if (hasTotp) {
          // TOTP already configured - return existing flow
          return {
            success: true,
            message: 'TOTP is already configured',
            flowId: settingsFlow.data.id,
            csrfToken,
            configured: true,
          }
        }
        
        // Check if TOTP setup node exists in the flow
        // If not, we need to initiate TOTP setup by submitting with method 'totp'
        // But first, let's check if QR code already exists in the flow
        const existingQrNode = settingsFlow.data.ui?.nodes?.find(
          (node: any) => node.group === 'totp' && node.type === 'img' && node.attributes?.id === 'totp_qr'
        )
        
        if (existingQrNode) {
          // QR code already exists in the flow
          const totpQrCode = existingQrNode.attributes?.src
          const totpSecretNode = settingsFlow.data.ui?.nodes?.find(
            (node: any) => node.group === 'totp' && node.type === 'text' && node.attributes?.id === 'totp_secret_key'
          )
          const totpSecret = totpSecretNode?.attributes?.text?.text || totpSecretNode?.attributes?.text?.context?.secret || totpSecretNode?.attributes?.value
          
          if (import.meta.dev) {
            console.log('[auth/two-factor/setup.post.ts] QR code found in existing flow')
            console.log('[auth/two-factor/setup.post.ts] QR code available:', !!totpQrCode)
            console.log('[auth/two-factor/setup.post.ts] Secret available:', !!totpSecret)
          }
          
          return {
            success: true,
            message: 'TOTP setup ready',
            flowId: settingsFlow.data.id,
            csrfToken,
            qrCode: totpQrCode,
            secret: totpSecret,
            configured: false,
          }
        }
        
        // Initiate TOTP setup by submitting settings flow with totp method
        // This will generate QR code and secret
        // Note: Even if validation fails (e.g., totp_code missing), Kratos still returns QR code and secret
        if (csrfToken) {
          let totpSetupResponse: any = null
          let totpError: any = null
          
          try {
            // Use direct $fetch to POST to Kratos settings endpoint
            // This bypasses the SDK which might have issues with the endpoint
            const flowUrl = `${config.kratosPublicUrl}/self-service/settings?flow=${settingsFlow.data.id}`
            
            if (import.meta.dev) {
              console.log('[auth/two-factor/setup.post.ts] Calling flow URL:', flowUrl)
            }
            
            try {
              const response = await $fetch(flowUrl, {
                method: 'POST',
                headers: requestCookies ? { Cookie: requestCookies } : undefined,
                body: {
                  method: 'totp',
                  csrf_token: csrfToken,
                },
              })
              
              totpSetupResponse = { data: response }
              
              if (import.meta.dev) {
                console.log('[auth/two-factor/setup.post.ts] Settings flow update succeeded')
              }
            } catch (fetchError: any) {
              // $fetch might throw error even when response contains QR code
              // Check if error has response data
              if (import.meta.dev) {
                console.error('[auth/two-factor/setup.post.ts] $fetch error:', {
                  statusCode: fetchError.statusCode || fetchError.status,
                  message: fetchError.message,
                  hasResponse: !!fetchError.response,
                  hasData: !!fetchError.data,
                  responseData: fetchError.response?._data || fetchError.data,
                })
              }
              
              // Check if error has response data
              if (fetchError.response?._data) {
                totpSetupResponse = { data: fetchError.response._data }
              } else if (fetchError.data) {
                totpSetupResponse = { data: fetchError.data }
              } else if (fetchError.response) {
                totpSetupResponse = { data: fetchError.response }
              } else {
                // If it's a 404, check if it's because endpoint is disabled
                // In that case, we might need to use Admin API instead
                if (fetchError.statusCode === 404 || fetchError.status === 404) {
                  if (import.meta.dev) {
                    console.error('[auth/two-factor/setup.post.ts] 404 error - endpoint might be disabled')
                  }
                  // Re-throw to be handled by outer catch
                  throw fetchError
                }
                // Re-throw if we can't extract response
                throw fetchError
              }
            }
          } catch (error: any) {
            // @ory/client might throw error even when response contains QR code
            // Store error but continue to check response
            totpError = error
            
            if (import.meta.dev) {
              console.error('[auth/two-factor/setup.post.ts] Error:', {
                statusCode: error.statusCode || error.status,
                message: error.message,
                errorId: error.response?.data?.error?.id || error.data?.error?.id,
                errorReason: error.response?.data?.error?.reason || error.data?.error?.reason,
              })
            }
            
            // Check if error has response data
            if (error.response?.data) {
              totpSetupResponse = { data: error.response.data }
            } else if (error.data) {
              totpSetupResponse = { data: error.data }
            } else if (error.body) {
              totpSetupResponse = { data: error.body }
            } else if (error.response) {
              totpSetupResponse = { data: error.response._data || error.response }
            }
          }
          
          // Use response from either success or error
          const responseData = totpSetupResponse?.data
          
          if (import.meta.dev) {
            console.log('[auth/two-factor/setup.post.ts] Response data check:', {
              hasTotpSetupResponse: !!totpSetupResponse,
              hasResponseData: !!responseData,
              responseDataType: typeof responseData,
              responseDataKeys: responseData ? Object.keys(responseData) : [],
            })
          }
          
          if (responseData) {
            // Check for session refresh error
            if (responseData.error?.id === 'session_refresh_required') {
              throw createError({
                statusCode: 403,
                statusMessage: 'Session refresh required',
                message: 'Your session has expired. Please refresh the page and try again.',
                data: {
                  error: responseData.error,
                  redirect_browser_to: responseData.redirect_browser_to,
                },
              })
            }
            
            // Check if response has error (like 404 - endpoint disabled)
            if (responseData.error && !responseData.ui) {
              if (import.meta.dev) {
                console.error('[auth/two-factor/setup.post.ts] Kratos returned error:', responseData.error)
                console.error('[auth/two-factor/setup.post.ts] Endpoint disabled - endpoint is disabled in Kratos config')
              }
              
              // If endpoint is disabled (404), we cannot use settings flow
              // User needs to enable TOTP in Kratos configuration
              // This is a configuration issue, not a code issue
              throw createError({
                statusCode: 503,
                statusMessage: 'TOTP endpoint disabled',
                message: 'The TOTP setup endpoint is disabled in your Kratos configuration. Please enable TOTP in your Kratos config file:\n\nselfservice:\n  methods:\n    totp:\n      enabled: true\n      config:\n        issuer: "SnapLink"\n\nAfter enabling, restart your Kratos service.',
                data: {
                  error: responseData.error,
                  kratosError: true,
                  solution: 'Enable TOTP in Kratos config: selfservice.methods.totp.enabled = true',
                  configLocation: 'kratos.yml or kratos.yaml',
                },
              })
            }
            
            // Find QR code and secret in the response
            // QR code is in a node with type "img" and group "totp"
            const totpQrNode = responseData.ui?.nodes?.find(
              (node: any) => node.group === 'totp' && node.type === 'img' && node.attributes?.id === 'totp_qr'
            )
            
            // Secret is in a node with type "text" and group "totp"
            const totpSecretNode = responseData.ui?.nodes?.find(
              (node: any) => node.group === 'totp' && node.type === 'text' && node.attributes?.id === 'totp_secret_key'
            )
            
            // QR code is in attributes.src (data URI)
            const totpQrCode = totpQrNode?.attributes?.src
            
            // Secret is in attributes.text.text or attributes.text.context.secret
            const totpSecret = totpSecretNode?.attributes?.text?.text || totpSecretNode?.attributes?.text?.context?.secret || totpSecretNode?.attributes?.value
            
            if (import.meta.dev) {
              console.log('[auth/two-factor/setup.post.ts] TOTP setup response, flow ID:', responseData.id)
              console.log('[auth/two-factor/setup.post.ts] QR node found:', !!totpQrNode)
              console.log('[auth/two-factor/setup.post.ts] QR code available:', !!totpQrCode)
              console.log('[auth/two-factor/setup.post.ts] Secret node found:', !!totpSecretNode)
              console.log('[auth/two-factor/setup.post.ts] Secret available:', !!totpSecret)
            }
            
            // Return QR code and secret if found (even if there was a validation error)
            if (totpQrCode) {
              return {
                success: true,
                message: 'TOTP setup initiated',
                flowId: responseData.id || settingsFlow.data.id,
                csrfToken: responseData.ui?.nodes?.find(
                  (node: any) => node.attributes?.name === 'csrf_token'
                )?.attributes?.value || csrfToken,
                qrCode: totpQrCode,
                secret: totpSecret,
                configured: false,
              }
            }
            
            // If no QR code but response has UI nodes, it might be in a different format
            // Return flow ID for retry
            if (responseData.ui?.nodes && responseData.ui.nodes.length > 0) {
              if (import.meta.dev) {
                console.log('[auth/two-factor/setup.post.ts] Response has UI nodes but no QR code, returning flow ID for retry')
              }
              return {
                success: true,
                message: 'TOTP setup flow created',
                flowId: responseData.id || settingsFlow.data.id,
                csrfToken: responseData.ui?.nodes?.find(
                  (node: any) => node.attributes?.name === 'csrf_token'
                )?.attributes?.value || csrfToken,
                configured: false,
              }
            }
          }
          
          // If we got here and there was an error, handle it
          if (totpError) {
            if (import.meta.dev) {
              console.error('[auth/two-factor/setup.post.ts] Failed to setup TOTP:', totpError)
              console.error('[auth/two-factor/setup.post.ts] Error type:', typeof totpError)
              console.error('[auth/two-factor/setup.post.ts] Error keys:', Object.keys(totpError))
              console.error('[auth/two-factor/setup.post.ts] Error response:', JSON.stringify(totpError.response?.data || totpError.data || totpError.body || totpError, null, 2))
            }
            
            // Check for session refresh error
            // @ory/client might throw errors with body instead of response.data
            const errorData = totpError.response?.data || totpError.data || totpError.body || {}
            if (errorData.error?.id === 'session_refresh_required' || totpError.statusCode === 403) {
              throw createError({
                statusCode: 403,
                statusMessage: 'Session refresh required',
                message: 'Your session has expired. Please refresh the page and try again.',
                data: {
                  error: errorData.error,
                  redirect_browser_to: errorData.redirect_browser_to,
                },
              })
            }
            
            // Even if there's an error, Kratos might still return QR code and secret in the response
            // Check if QR code and secret exist in the error response
            const errorResponseNodes = errorData.ui?.nodes || []
            
            if (import.meta.dev) {
              console.log('[auth/two-factor/setup.post.ts] Error response nodes count:', errorResponseNodes.length)
              console.log('[auth/two-factor/setup.post.ts] Looking for TOTP nodes in error response...')
              const totpNodes = errorResponseNodes.filter((node: any) => node.group === 'totp')
              console.log('[auth/two-factor/setup.post.ts] TOTP nodes found:', totpNodes.length)
              totpNodes.forEach((node: any, index: number) => {
                console.log(`[auth/two-factor/setup.post.ts] TOTP node ${index}: type=${node.type}, id=${node.attributes?.id}, name=${node.attributes?.name}`)
              })
            }
            
            const errorQrNode = errorResponseNodes.find(
              (node: any) => node.group === 'totp' && node.type === 'img' && node.attributes?.id === 'totp_qr'
            )
            const errorSecretNode = errorResponseNodes.find(
              (node: any) => node.group === 'totp' && node.type === 'text' && node.attributes?.id === 'totp_secret_key'
            )
            
            const errorQrCode = errorQrNode?.attributes?.src
            const errorSecret = errorSecretNode?.attributes?.text?.text || errorSecretNode?.attributes?.text?.context?.secret
            
            if (import.meta.dev) {
              console.log('[auth/two-factor/setup.post.ts] Error QR node found:', !!errorQrNode)
              console.log('[auth/two-factor/setup.post.ts] Error QR code available:', !!errorQrCode)
              console.log('[auth/two-factor/setup.post.ts] Error secret node found:', !!errorSecretNode)
              console.log('[auth/two-factor/setup.post.ts] Error secret available:', !!errorSecret)
            }
            
            // If QR code exists in error response, return it (this is normal - Kratos returns QR code even if validation fails)
            if (errorQrCode) {
              if (import.meta.dev) {
                console.log('[auth/two-factor/setup.post.ts] QR code found in error response (this is normal)')
                console.log('[auth/two-factor/setup.post.ts] QR code available:', !!errorQrCode)
                console.log('[auth/two-factor/setup.post.ts] Secret available:', !!errorSecret)
              }
              
              return {
                success: true,
                message: 'TOTP setup initiated',
                flowId: errorData.id || settingsFlow.data.id,
                csrfToken: errorData.ui?.nodes?.find(
                  (node: any) => node.attributes?.name === 'csrf_token'
                )?.attributes?.value || csrfToken,
                qrCode: errorQrCode,
                secret: errorSecret,
                configured: false,
              }
            }
            
            // If other error and no QR code, return the flow ID so frontend can retry
            if (import.meta.dev) {
              console.log('[auth/two-factor/setup.post.ts] No QR code found, returning flow ID for retry')
            }
            return {
              success: true,
              message: 'TOTP setup flow created',
              flowId: settingsFlow.data.id,
              csrfToken,
              configured: false,
            }
          }
          
          // If we got here and totpSetupResponse is null, it means we couldn't get a response
          if (!totpSetupResponse) {
            if (import.meta.dev) {
              console.error('[auth/two-factor/setup.post.ts] No response from TOTP setup attempt')
            }
            throw createError({
              statusCode: 500,
              statusMessage: 'Failed to setup TOTP',
              message: 'No response received from TOTP setup',
            })
          }
        } else {
          if (import.meta.dev) {
            console.error('[auth/two-factor/setup.post.ts] No CSRF token found in settings flow')
          }
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to setup TOTP',
            message: 'CSRF token not found in settings flow',
          })
        }
      } else {
        if (import.meta.dev) {
          console.error('[auth/two-factor/setup.post.ts] Settings flow created but no flow ID')
        }
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create settings flow',
          message: 'Settings flow was created but no flow ID was returned',
        })
      }
    } catch (flowError: any) {
      if (import.meta.dev) {
        console.error('[auth/two-factor/setup.post.ts] Failed to create settings flow:', flowError)
        console.error('[auth/two-factor/setup.post.ts] Flow error type:', typeof flowError)
        console.error('[auth/two-factor/setup.post.ts] Flow error keys:', Object.keys(flowError))
        console.error('[auth/two-factor/setup.post.ts] Flow error statusCode:', flowError.statusCode || flowError.status)
        console.error('[auth/two-factor/setup.post.ts] Flow error message:', flowError.message)
        console.error('[auth/two-factor/setup.post.ts] Flow error response:', JSON.stringify(flowError.response?.data || flowError.data || flowError, null, 2))
      }
      
      // Check for session refresh error in flow creation
      const errorData = flowError.response?.data || flowError.data || {}
      if (errorData.error?.id === 'session_refresh_required' || flowError.statusCode === 403) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Session refresh required',
          message: 'Your session has expired. Please refresh the page and try again.',
          data: {
            error: errorData.error,
            redirect_browser_to: errorData.redirect_browser_to,
          },
        })
      }
      
      throw createError({
        statusCode: flowError.statusCode || 500,
        statusMessage: 'Failed to create 2FA setup flow',
        message: flowError.message || 'Failed to create 2FA setup flow',
        data: {
          originalError: flowError.message,
          errorType: typeof flowError,
        },
      })
    }
    
    // This should never be reached, but just in case
    if (import.meta.dev) {
      console.error('[auth/two-factor/setup.post.ts] Reached end of TOTP setup without returning')
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to setup 2FA',
      message: 'Unable to create TOTP setup flow - unexpected error',
    })
  }
  catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/two-factor/setup.post.ts] Error:', error.statusCode || error.status || error.message)
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to setup 2FA',
      message: error.message || 'Failed to setup 2FA',
    })
  }
})

