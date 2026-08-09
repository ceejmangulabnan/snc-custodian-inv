export default defineNuxtRouteMiddleware(async () => {
    const session = useUserSession()

    if (!session.ready) {
        await session.fetch()
    }

    if (session.user.value?.role?.name !== 'Administrator') {
        return navigateTo('/')
    }

    return
})
