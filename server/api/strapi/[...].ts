// Catch-all endpoint for requests to strapi -- Handled on the frontend by the useStrapi composable
export default defineEventHandler(async (event) => {
    await requireUserSession(event)

    // Route params
    const segments = event.context.params?._ ?? ''
    const path = `/${segments}`
    const method = event.method

    const hasBody = !['GET', 'HEAD', 'DELETE'].includes(method.toUpperCase())
    const body = hasBody ? await readBody(event).catch(() => null) : null

    const { status, data } = await strapiRequest(event, path, {
        method:
            method === 'PATCH' ||
            method === 'POST' ||
            method === 'PUT' ||
            method === 'DELETE'
                ? method
                : 'GET',
        body: body ?? undefined,
        query: getQuery(event),
    })

    if (status >= 400) {
        const message =
            (data as { error?: { message?: string; detail?: string } })?.error
                ?.message ??
            (data as { error?: { message?: string; detail?: string } })?.error
                ?.detail ??
            'Strapi request failed.'

        throw createError({ statusCode: status, statusMessage: message })
    }

    return data
})
