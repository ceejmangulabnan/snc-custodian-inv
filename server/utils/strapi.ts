import type { H3Event } from 'h3'

const REFRESH_COOKIE_NAME = 'strapi_up_refresh'

type StrapiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface StrapiRequestOptions {
  method?: StrapiMethod
  body?: unknown
  query?: Record<string, unknown>
  headers?: Record<string, string>
  auth?: boolean
}

interface StrapiResponse<T = unknown> {
  status: number
  data: T
}

function getStrapiBaseUrl(): string {
  const { strapiUrl } = useRuntimeConfig()
  return `${strapiUrl}/api`
}

function readRefreshTokenFromHeaders(headers: Headers): string | null {
  for (const cookie of headers.getSetCookie()) {
    const match = cookie.match(new RegExp(`(?:^|;\\s*)${REFRESH_COOKIE_NAME}=([^;]+)`))
    if (match) {
      return decodeURIComponent(match[1] ?? '')
    }
  }
  return null
}

async function fetchStrapi<T = unknown>(
  event: H3Event,
  path: string,
  options: StrapiRequestOptions,
  token?: string
): Promise<StrapiResponse<T>> {
  const response = await $fetch.raw<T>(`${getStrapiBaseUrl()}${path}`, {
    method: (options.method ?? 'GET') as never,
    query: options.query,
    body: options.body as never,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    },
    retry: false,
    parseResponse: text => (text ? JSON.parse(text) : null)
  })

  return { status: response.status, data: response._data as T }
}

export async function refreshStrapiSession(
  event: H3Event
): Promise<{ accessToken: string, refreshToken: string } | null> {
  const session = await getUserSession(event)
  const refreshToken = session?.secure?.refreshToken

  if (!refreshToken) {
    return null
  }

  const response = await $fetch.raw<{ jwt?: string }>(`${getStrapiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { refreshToken },
    retry: false,
    parseResponse: text => (text ? JSON.parse(text) : null)
  })

  if (response.status !== 200 || !response._data?.jwt) {
    return null
  }
  const rotatedRefreshToken = readRefreshTokenFromHeaders(response.headers) ?? refreshToken

  await replaceUserSession(event, {
    ...session,
    secure: {
      accessToken: response._data.jwt,
      refreshToken: rotatedRefreshToken
    }
  })

  return { accessToken: response._data.jwt, refreshToken: rotatedRefreshToken }
}

export async function strapiRequest<T = unknown>(
  event: H3Event,
  path: string,
  options: StrapiRequestOptions = {}
): Promise<StrapiResponse<T>> {
  const session = await getUserSession(event)
  const token = session?.secure?.accessToken

  let response = await fetchStrapi<T>(event, path, options, token)

  if (response.status === 401 && options.auth !== false) {
    const refreshed = await refreshStrapiSession(event)
    if (refreshed) {
      response = await fetchStrapi<T>(event, path, options, refreshed.accessToken)
    }
  }

  return response
}

export { readRefreshTokenFromHeaders }
