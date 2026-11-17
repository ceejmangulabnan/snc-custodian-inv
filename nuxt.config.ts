// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
    modules: [
        '@nuxt/eslint',
        '@nuxt/ui',
        '@nuxt/fonts',
        'nuxt-auth-utils',
        'motion-v/nuxt',
    ],

    motionV: {
        directives: true,
    },

    colorMode: {
        preference: 'light',
        fallback: 'light',
    },

    runtimeConfig: {
        strapiUrl: 'http://localhost:1337',
    },

    devtools: {
        enabled: true,

        timeline: {
            enabled: true,
        },
    },

    css: ['~/assets/css/main.css'],

    icon: {
        clientBundle: {
            scan: true,
            sizeLimitKb: 256,
        },
    },

    routeRules: {
        '/auth/login': { prerender: true },
    },

    compatibilityDate: '2026-06-30',

    eslint: {
        config: {
            stylistic: {
                commaDangle: 'never',
                braceStyle: '1tbs',
            },
        },
    },
})
