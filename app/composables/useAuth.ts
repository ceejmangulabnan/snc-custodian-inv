export function useAuth() {
  const session = useUserSession()

  const isAdmin = computed(() => session.user.value?.role?.type === 'administrator')
  const isCustodian = computed(() => session.user.value?.role?.type === 'custodian')
  const isAuthenticated = computed(() => session.loggedIn.value)

  async function login(identifier: string, password: string) {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { identifier, password }
    })
    await session.fetch()
  }

  async function logout() {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    await session.clear()
  }

  return {
    ready: session.ready,
    loggedIn: session.loggedIn,
    user: session.user,
    isAdmin,
    isCustodian,
    isAuthenticated,
    login,
    logout
  }
}
