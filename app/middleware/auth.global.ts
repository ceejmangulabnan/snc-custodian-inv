// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
    const session = useUserSession()

    if (!session.ready.value) {
        await session.fetch()
    }

    const isLoggedIn = session.loggedIn.value
    const role = session.user.value?.role?.name || ''

    // 1. Unauthenticated users are redirected to login
    if (!isLoggedIn) {
        if (to.path !== '/auth/login') {
            return navigateTo('/auth/login')
        }
        return
    }

    // --- RBAC ---

    // 2. Prevent accessing the login page if already logged in
    if (to.path === '/auth/login') {
        if (role === 'Administrator') return navigateTo('/admin/inventory')
        if (role === 'Cashier') return navigateTo('/cashier')

        // if role === 'Custodian'
        return navigateTo('/')
    }

    // 3. Route checks
    const onAdminRoute = to.path.startsWith('/admin')
    const onCashierRoute = to.path.startsWith('/cashier')

    // -----------------------------------------
    // ROLE: ADMINISTRATOR
    // -----------------------------------------
    if (role === 'Administrator') {
        // Admin can access everything. Do nothing and let them pass.
        return
    }

    // -----------------------------------------
    // ROLE: CASHIER
    // -----------------------------------------
    if (role === 'Cashier') {
        if (!onCashierRoute) {
            return navigateTo('/cashier')
        }
        return
    }

    // -----------------------------------------
    // ROLE: CUSTODIAN (Default fallback)
    // -----------------------------------------
    // Custodians can access everything except /admin
    if (onAdminRoute) {
        return navigateTo('/')
    }
})
