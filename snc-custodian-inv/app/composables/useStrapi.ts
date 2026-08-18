interface StrapiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
    query?: Record<string, unknown>
}

function extractErrorMessage(error: unknown): string {
    const err = error as {
        statusMessage?: string
        data?: { statusMessage?: string; message?: string }
    }

    return (
        err?.data?.statusMessage ??
        err?.data?.message ??
        err?.statusMessage ??
        'Request failed.'
    )
}

// Composable for making requests to strapi endpoints.
// This handles auto session clearing for 401
export function useStrapi() {
    const { clear } = useUserSession()
    // Use the request-scoped fetch so SSR requests forward the session
    // cookie (plain $fetch drops it, causing the proxy to 401).
    const fetchFn = useRequestFetch()

    async function request<T = unknown>(
        path: string,
        options: StrapiRequestOptions = {}
    ): Promise<T> {
        try {
            return (await fetchFn<T>(`/api/strapi${path}`, {
                method: options.method,
                query: options.query,
                body: options.body as Record<string, unknown> | undefined,
            })) as T
        } catch (error) {
            const status = (
                error as { statusCode?: number; response?: { status?: number } }
            )?.response?.status

            if (status === 401) {
                await clear()
                await navigateTo('/auth/login')
            }

            throw new Error(extractErrorMessage(error), { cause: error })
        }
    }

    return {
        get<T = unknown>(path: string, query?: Record<string, unknown>) {
            return request<T>(path, { method: 'GET', query })
        },
        post<T = unknown>(path: string, body?: unknown) {
            return request<T>(path, { method: 'POST', body })
        },
        put<T = unknown>(path: string, body?: unknown) {
            return request<T>(path, { method: 'PUT', body })
        },
        delete<T = unknown>(path: string) {
            return request<T>(path, { method: 'DELETE' })
        },
    }
}
