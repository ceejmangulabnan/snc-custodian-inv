export default defineNuxtRouteMiddleware(() => {
  const { user } = useUserSession()

  if (user.value?.role?.type !== 'administrator') {
    return navigateTo('/')
  }
})
