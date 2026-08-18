export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)

    if (session?.secure?.refreshToken) {
        await strapiRequest(event, '/auth/logout', {
            method: 'POST',
            body: { refreshToken: session.secure.refreshToken },
        }).catch(() => {})
    }

    await clearUserSession(event)

    return { ok: true }
})
