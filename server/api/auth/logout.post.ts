export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const token = session?.secure?.accessToken

  if (token) {
    const { strapiUrl } = useRuntimeConfig()

    try {
      await $fetch(`${strapiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { scope: 'all' },
        retry: false
      })
    } catch {
      // Best effort: the local session is cleared regardless.
    }
  }

  await clearUserSession(event)

  return { success: true }
})
