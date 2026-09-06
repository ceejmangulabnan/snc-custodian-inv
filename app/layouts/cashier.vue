<template>
    <div
        class="min-h-screen bg-[#f4f8f6] text-slate-900 dark:bg-slate-950 dark:text-white"
    >
        <!-- Top bar -->
        <header
            class="sticky top-0 z-30 border-b border-green-100 bg-white/85 backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/85"
        >
            <div
                class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
            >
                <!-- Brand -->
                <div class="flex min-w-0 items-center gap-3">
                    <div
                        class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-lg shadow-green-500/30"
                    >
                        <UIcon name="i-lucide-store" class="size-5" />
                    </div>

                    <div class="hidden min-w-0 sm:block">
                        <p
                            class="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white"
                        >
                            SNC Cashier
                        </p>

                        <p
                            class="truncate text-xs text-slate-500 dark:text-slate-400"
                        >
                            Point of Sale
                        </p>
                    </div>
                </div>

                <!-- Right side -->
                <div class="flex shrink-0 items-center gap-2">
                    <span
                        class="hidden items-center gap-2 rounded-2xl border border-green-100 bg-green-50/70 px-3 py-1.5 text-xs font-medium text-slate-600 md:flex dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
                    >
                        <UIcon name="i-lucide-user" class="size-4" />
                        <span class="truncate">{{ displayName }}</span>
                    </span>

                    <UColorModeButton
                        color="neutral"
                        variant="ghost"
                        aria-label="Toggle theme"
                    />

                    <UButton
                        color="error"
                        variant="ghost"
                        icon="i-lucide-log-out"
                        aria-label="Logout"
                        @click="openLogoutModal"
                    />
                </div>
            </div>
        </header>

        <!-- Main content -->
        <main>
            <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <slot />
            </div>
        </main>

        <!-- Logout confirmation modal -->
        <UModal v-model:open="logoutOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] bg-white/90 shadow-[0_20px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:bg-slate-900/90"
                >
                    <!-- BACKGROUND EFFECT -->
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-red-50/70 via-white to-green-50/40 dark:from-red-950/30 dark:via-slate-900 dark:to-green-950/30"
                    />

                    <!-- TOP DECOR -->
                    <div
                        class="absolute right-0 top-0 h-40 w-40 rounded-full bg-red-500/10 blur-3xl"
                    />
                    <div
                        class="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-green-500/10 blur-3xl"
                    />

                    <div class="relative p-7">
                        <!-- ICON -->
                        <div
                            class="mx-auto flex size-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_10px_40px_rgba(239,68,68,0.35)]"
                        >
                            <UIcon name="i-lucide-log-out" class="size-10" />
                        </div>

                        <!-- CONTENT -->
                        <div class="mt-5 text-center">
                            <h2
                                class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Logout Session?
                            </h2>

                            <p
                                class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
                            >
                                You are about to sign out from the
                                <span
                                    class="font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    SNC Cashier </span
                                >.
                                <br />
                                You can login again anytime.
                            </p>
                        </div>

                        <!-- USER CARD -->
                        <div
                            class="mt-6 rounded-3xl border border-green-100 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/70"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/20"
                                >
                                    <UIcon
                                        name="i-lucide-user"
                                        class="size-5"
                                    />
                                </div>

                                <div class="min-w-0 flex-1 text-left">
                                    <p
                                        class="truncate text-sm font-semibold text-slate-900 dark:text-white"
                                    >
                                        {{ displayName }}
                                    </p>

                                    <p
                                        class="truncate text-xs capitalize text-slate-500 dark:text-slate-400"
                                    >
                                        {{ displayRole }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- ACTIONS -->
                        <div class="mt-7 flex gap-3">
                            <UButton
                                block
                                color="neutral"
                                variant="soft"
                                size="lg"
                                class="rounded-2xl"
                                :disabled="isLoggingOut"
                                @click="logoutOpen = false"
                            >
                                Stay Logged In
                            </UButton>

                            <UButton
                                block
                                color="error"
                                size="lg"
                                icon="i-lucide-log-out"
                                class="rounded-2xl shadow-lg shadow-red-500/20"
                                :loading="isLoggingOut"
                                @click="confirmLogout"
                            >
                                Logout
                            </UButton>
                        </div>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
//@ts-nocheck
const logoutOpen = ref(false)
const isLoggingOut = ref(false)

const { fetch: refreshSession, session } = useUserSession()

const displayName = computed(() => {
    return session.value.user?.username
})

const displayRole = computed(() => {
    return session.value.user?.role?.name
})

const openLogoutModal = () => {
    logoutOpen.value = true
}

const confirmLogout = async () => {
    if (isLoggingOut.value) {
        return
    }

    isLoggingOut.value = true

    try {
        await $fetch('/api/auth/logout', { method: 'POST' })
        await refreshSession()
        await navigateTo('/auth/login')
        logoutOpen.value = false
    } catch (error) {
        console.error('Logout failed:', error)
    } finally {
        isLoggingOut.value = false
    }
}
</script>