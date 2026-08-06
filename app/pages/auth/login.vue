<template>
    <div
        class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f8f6] px-4 py-10"
    >
        <!-- BACKGROUND -->
        <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.18),transparent_35%)]"
        />

        <div
            class="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div
            class="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl"
        />

        <!-- LOGIN CARD -->
        <div
            class="relative w-full max-w-md overflow-hidden rounded-[36px] border border-white/70 bg-white/80 shadow-[0_25px_90px_rgba(15,23,42,0.16)] backdrop-blur-2xl"
        >
            <!-- HEADER -->
            <div
                class="border-b border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-white px-8 py-10 text-center"
            >
                <div
                    class="mx-auto mb-6 flex size-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white shadow-[0_15px_50px_rgba(16,185,129,0.35)]"
                >
                    <UIcon name="i-lucide-id-card" class="size-10" />
                </div>

                <h1 class="text-3xl font-bold tracking-tight text-slate-900">
                    School UI Template
                </h1>

                <p class="mt-2 text-sm leading-relaxed text-slate-500">
                    Sign in to access the UI Template dashboard.
                </p>
            </div>

            <!-- FORM -->
            <div class="p-8">
                <UForm :state="form" class="space-y-5" @submit="submitLogin">
                    <!-- General error -->
                    <div
                        v-if="errors.general"
                        class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <UIcon
                            name="i-lucide-circle-alert"
                            class="mt-0.5 size-5 shrink-0"
                        />

                        <p class="leading-5">
                            {{ errors.general }}
                        </p>
                    </div>
                    <UFormField
                        label="Email or Username"
                        name="identifier"
                        :error="errors.identifier"
                        required
                    >
                        <UInput
                            v-model.trim="form.identifier"
                            icon="i-lucide-user"
                            size="xl"
                            placeholder="Enter email or username"
                            autocomplete="username"
                            class="w-full"
                            :disabled="isLoading"
                            @blur="validateIdentifier"
                            @input="clearFieldError('identifier')"
                        />
                    </UFormField>

                    <UFormField
                        label="Password"
                        name="password"
                        :error="errors.password"
                        required
                    >
                        <UInput
                            v-model="form.password"
                            icon="i-lucide-lock"
                            :type="showPassword ? 'text' : 'password'"
                            size="xl"
                            placeholder="Enter password"
                            autocomplete="current-password"
                            class="w-full"
                            :disabled="isLoading"
                            @blur="validatePassword"
                            @input="clearFieldError('password')"
                        >
                            <template #trailing>
                                <UTooltip
                                    :text="
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    "
                                >
                                    <UButton
                                        type="button"
                                        color="neutral"
                                        variant="ghost"
                                        size="sm"
                                        :icon="
                                            showPassword
                                                ? 'i-lucide-eye-off'
                                                : 'i-lucide-eye'
                                        "
                                        :aria-label="
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        "
                                        :disabled="isLoading"
                                        @click="showPassword = !showPassword"
                                    />
                                </UTooltip>
                            </template>
                        </UInput>
                    </UFormField>

                    <UButton
                        type="submit"
                        block
                        size="xl"
                        icon="i-lucide-log-in"
                        :loading="isLoading"
                        :disabled="!canSubmit"
                        class="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25"
                    >
                        {{ isLoading ? 'Signing in...' : 'Sign In' }}
                    </UButton>
                </UForm>

                <!-- FOOTER -->
                <div
                    class="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4 text-center"
                >
                    <p class="text-xs leading-relaxed text-slate-500">
                        Secure access for administrators, staff, and encoders.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
//@ts-nocheck
definePageMeta({
    layout: false,
})

interface LoginForm {
    identifier: string
    password: string
    rememberMe: boolean
}

interface LoginErrors {
    identifier: string
    password: string
    general: string
}

const form = reactive({
    identifier: '',
    password: '',
})

const errors = reactive<LoginErrors>({
    identifier: undefined,
    password: undefined,
    general: undefined,
})

const toast = useToast()

const showPassword = ref(false)
const isLoading = ref(false)

const canSubmit = computed(() => {
    return Boolean(form.identifier.trim() && form.password && !isLoading.value)
})

const clearFieldError = (field: 'identifier' | 'password') => {
    errors[field] = undefined
    errors.general = undefined
}

const validateIdentifier = (): boolean => {
    const identifier = form.identifier.trim()

    if (!identifier) {
        errors.identifier = 'Email address or username is required.'
        return false
    }

    if (identifier.length < 3) {
        errors.identifier =
            'Email address or username must contain at least 3 characters.'
        return false
    }

    errors.identifier = ''
    return true
}

const validatePassword = (): boolean => {
    if (!form.password) {
        errors.password = 'Password is required.'
        return false
    }

    if (form.password.length < 6) {
        errors.password = 'Password must contain at least 6 characters.'
        return false
    }

    errors.password = ''
    return true
}

const validateForm = (): boolean => {
    const identifierIsValid = validateIdentifier()
    const passwordIsValid = validatePassword()

    return identifierIsValid && passwordIsValid
}

const submitLogin = async () => {
    errors.general = ''

    if (!validateForm() || isLoading.value) {
        return
    }

    isLoading.value = true

    try {
        await $fetch('/api/auth/login', {
            method: 'POST',
            body: {
                identifier: form.email,
                password: form.password,
            },
        })

        await navigateTo('/')
    } catch (error) {
        console.error('Login error:', error)

        errors.general =
            'Unable to sign in. Please verify your email address and password.'
    } finally {
        isLoading.value = false
    }
}
</script>
