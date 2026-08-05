export default defineNuxtRouteMiddleware(async (to) => {
  const session = useUserSession()

  if (!session.ready.value) {
    await session.fetch()
  }

  if (!session.loggedIn.value && to.path !== '/auth/login') {
    return navigateTo('/auth/login')
  }

  if (session.loggedIn.value && to.path === '/auth/login') {
    return navigateTo('/')
  }
})
