export {}

declare module '#auth-utils' {
    interface Role {
        id: number
        name: string
        type: string
    }

    interface User {
        id: number
        username: string
        email: string
        role?: Role
    }

    interface SecureSessionData {
        accessToken?: string
        refreshToken?: string
    }
}
