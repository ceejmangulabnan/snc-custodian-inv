export default defineNuxtRouteMiddleware(async (to) => {
    const session = useUserSession()

    if (!session.ready.value) {
        await session.fetch()
    }

    if (!session.loggedIn.value && to.path !== '/auth/login') {
        return navigateTo('/auth/login')
    }

    if (session.loggedIn.value && to.path === '/auth/login') {
        const role = session.user.value?.role?.name
        return navigateTo(
            role === 'Administrator'
                ? '/admin/inventory'
                : role === 'Cashier'
                  ? '/cashier'
                  : '/'
        )
    }

    if (session.loggedIn.value) {
        const role = session.user.value?.role?.name
        const onCashierRoute = to.path.startsWith('/cashier')

        // Cashier users may only access /cashier/* routes.
        if (role === 'Cashier' && !onCashierRoute) {
            return navigateTo('/cashier')
        }

        // Non-cashier users are not allowed on /cashier/* routes.
        if (role !== 'Cashier' && onCashierRoute) {
            return navigateTo(role === 'Administrator' ? '/admin' : '/')
        }
    }
})
