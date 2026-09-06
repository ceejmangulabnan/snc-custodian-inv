export default defineNuxtRouteMiddleware(async () => {
    const session = useUserSession()

    if (!session.ready.value) {
        await session.fetch()
    }

    if (session.user.value?.role?.name !== 'Cashier') {
        const role = session.user.value?.role?.name
        return navigateTo(role === 'Administrator' ? '/admin' : '/')
    }
})