export default defineNuxtRouteMiddleware(async () => {
    const session = useUserSession()

    if (!session.ready.value) {
        await session.fetch()
    }

    if (session.user.value?.role?.name !== 'Administrator') {
        return navigateTo('/')
    }

    return
})
