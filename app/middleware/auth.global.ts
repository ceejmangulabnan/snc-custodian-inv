// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
    const session = useUserSession()

    if (!session.ready.value) {
        await session.fetch()
    }

    const isLoggedIn = session.loggedIn.value
    // Using optional chaining to safely get the role, defaulting to empty string if missing
    const role = session.user.value?.role?.name || ''

    // 1. Unauthenticated users -> Must go to Login
    if (!isLoggedIn) {
        if (to.path !== '/auth/login') {
            return navigateTo('/auth/login')
        }
        return // Allow access to login page
    }

    // --- EVERYTHING BELOW ASSUMES THE USER IS LOGGED IN ---

    // 2. Prevent accessing the login page if already logged in
    if (to.path === '/auth/login') {
        if (role === 'Administrator') return navigateTo('/admin/inventory')
        if (role === 'Cashier') return navigateTo('/cashier')
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
        // If Cashier is NOT on a cashier route, force them to /cashier
        if (!onCashierRoute) {
            return navigateTo('/cashier')
        }
        return // Allow them to pass if they are on /cashier/*
    }

    // -----------------------------------------
    // ROLE: CUSTODIAN (Default fallback)
    // -----------------------------------------
    // Custodians cannot access /admin or /cashier
    if (onAdminRoute || onCashierRoute) {
        return navigateTo('/')
    }
})