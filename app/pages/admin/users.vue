<template>
    <div class="space-y-6">
        <!-- Page header -->
        <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div class="flex items-start gap-4">
                <div
                    class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-[0_10px_30px_rgba(59,130,246,0.35)]"
                >
                    <UIcon name="i-lucide-users" class="size-7" />
                </div>

                <div>
                    <h1
                        class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                    >
                        Manage Users
                    </h1>

                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Create, update, and manage user accounts.
                    </p>
                </div>
            </div>

            <UButton
                color="primary"
                size="lg"
                icon="i-lucide-plus"
                class="rounded-2xl shadow-lg shadow-blue-500/20"
                @click="openCreate"
            >
                Add User
            </UButton>
        </div>

        <div
            v-if="pending"
            class="flex items-center justify-center rounded-3xl border border-green-100 bg-white p-12 dark:border-slate-700 dark:bg-slate-900"
        >
            <span class="text-sm text-slate-500 dark:text-slate-400">
                Loading users...
            </span>
        </div>

        <UAlert
            v-else-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            title="Failed to load users"
            :description="error.message"
        />

        <div
            v-else
            class="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
            <UTable
                :data="users ?? []"
                :columns="userColumns"
                :empty="'No users found.'"
                class="flex-1"
            >
                <template #role-cell="{ row }">
                    <UBadge
                        :color="
                            row.original.role?.name === 'Administrator'
                                ? 'success'
                                : 'neutral'
                        "
                        variant="subtle"
                    >
                        {{ row.original.role?.name ?? '—' }}
                    </UBadge>
                </template>

                <template #actions-cell="{ row }">
                    <UDropdownMenu
                        :items="getActionItems(row.original)"
                        :ui="{
                            content: 'w-48',
                            itemLeadingIcon: 'size-4',
                        }"
                    >
                        <UButton
                            icon="i-lucide-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                        />
                    </UDropdownMenu>
                </template>
            </UTable>
        </div>

        <!-- Create / Edit user modal -->
        <UModal v-model:open="formOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                        >
                            <UIcon
                                :name="isEditing ? 'i-lucide-pen' : 'i-lucide-user-plus'"
                                class="size-5"
                            />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                {{ isEditing ? 'Edit User' : 'Add User' }}
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                <template v-if="isEditing">
                                    Editing
                                    <span
                                        class="font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        {{ selectedUser?.username }}
                                    </span>
                                </template>
                                <template v-else>
                                    Create a new user account.
                                </template>
                            </p>
                        </div>
                    </div>

                    <UAlert
                        v-if="formError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="formError"
                        class="mt-5"
                    />

                    <UForm class="mt-6 space-y-4" :state="form">
                        <UFormField label="Username">
                            <UInput
                                v-model="form.username"
                                icon="i-lucide-user"
                                placeholder="Enter username"
                                class="w-full"
                            />
                        </UFormField>

                        <UFormField label="Email">
                            <UInput
                                v-model="form.email"
                                icon="i-lucide-mail"
                                placeholder="user@example.com"
                                class="w-full"
                            />
                        </UFormField>

                        <UFormField
                            :label="isEditing ? 'New Password (optional)' : 'Password'"
                        >
                            <UInput
                                v-model="form.password"
                                type="password"
                                icon="i-lucide-lock"
                                placeholder="Min. 6 characters"
                                class="w-full"
                            />
                        </UFormField>

                        <UFormField label="Role">
                            <USelect
                                v-model="form.roleId"
                                :items="roleOptions"
                                icon="i-lucide-shield"
                                class="w-full"
                            />
                        </UFormField>

                        <div class="grid grid-cols-2 gap-8">
                            <UFormField
                                label="Confirmed"
                                orientation="horizontal"
                                class="flex items-center"
                            >
                                <USwitch v-model="form.confirmed" />
                            </UFormField>

                            <UFormField
                                v-if="isEditing"
                                label="Blocked"
                                orientation="horizontal"
                                class="flex items-center"
                            >
                                <USwitch v-model="form.blocked" />
                            </UFormField>
                        </div>
                    </UForm>

                    <div class="mt-6 flex justify-end gap-3">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="formOpen = false"
                        >
                            Cancel
                        </UButton>

                        <UButton
                            color="success"
                            icon="i-lucide-check"
                            :loading="saving"
                            @click="saveUser"
                        >
                            {{ isEditing ? 'Save' : 'Create User' }}
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Delete user modal -->
        <UModal v-model:open="deleteOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-red-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-red-900/50 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-red-500 via-red-600 to-rose-600 text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)]"
                        >
                            <UIcon name="i-lucide-trash" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Delete User
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Are you sure you want to delete
                                <span
                                    class="font-medium text-slate-700 dark:text-slate-300"
                                >
                                    {{ userToDelete?.username }}
                                </span>
                                ? This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <UAlert
                        v-if="deleteError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="deleteError"
                        class="mt-5"
                    />

                    <div
                        v-if="userToDelete"
                        class="mt-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/30"
                    >
                        <UIcon
                            name="i-lucide-user"
                            class="size-5 text-red-500"
                        />

                        <div class="min-w-0">
                            <p
                                class="truncate text-sm font-semibold text-slate-800 dark:text-slate-200"
                            >
                                {{ userToDelete.email || 'No email' }}
                            </p>

                            <p
                                class="text-xs text-slate-500 dark:text-slate-400"
                            >
                                ID {{ userToDelete.id }} ·
                                {{ userToDelete.role?.name ?? 'No role' }}
                            </p>
                        </div>
                    </div>

                    <div class="mt-6 flex justify-end gap-3">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="deleteOpen = false"
                        >
                            Cancel
                        </UButton>

                        <UButton
                            color="error"
                            icon="i-lucide-trash"
                            :loading="deleting"
                            @click="confirmDelete"
                        >
                            Delete
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { DropdownMenuItem } from '@nuxt/ui/runtime/components/DropdownMenu.vue.js'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
})

const strapi = useStrapi()
const toast = useToast()
const { session } = useUserSession()

interface StrapiRole {
    id: number
    name: string
    type: string
}

interface StrapiUser {
    id: number
    username?: string
    email?: string
    confirmed?: boolean
    blocked?: boolean
    role?: StrapiRole
}

interface UserForm {
    username: string
    email: string
    password: string
    roleId: number | undefined
    confirmed: boolean
    blocked: boolean
}

/*
|--------------------------------------------------------------------------
| Strapi data
|--------------------------------------------------------------------------
*/

const {
    data: users,
    pending,
    error,
    refresh: refreshUsers,
} = await useAsyncData('users', () =>
    strapi.get<StrapiUser[]>('/users', { populate: 'role' })
)

const { data: roles } = await useAsyncData('user-roles', () =>
    strapi.get<{ roles: StrapiRole[] }>('/users-permissions/roles')
)

const roleOptions = computed(() =>
    (roles.value?.roles ?? []).map((role) => ({
        label: role.name,
        value: role.id,
    }))
)

/*
|--------------------------------------------------------------------------
| Table
|--------------------------------------------------------------------------
*/

const userColumns: TableColumn<StrapiUser>[] = [
    { accessorKey: 'id', header: 'ID', enableSorting: false },
    { accessorKey: 'username', header: 'Username' },
    { accessorKey: 'email', header: 'Email' },
    { id: 'role', header: 'Role', enableSorting: false },
    {
        id: 'actions',
        header: 'Actions',
        meta: {
            class: {
                td: 'text-right pr-4',
                th: 'text-right pr-4',
            },
        },
    },
]

const isCurrentUser = (user: StrapiUser) => {
    return user.id === session.value?.user?.id
}

function getActionItems(user: StrapiUser): DropdownMenuItem[] {
    const items: DropdownMenuItem[] = [
        {
            label: 'Edit',
            icon: 'i-lucide-pen',
            class: 'flex gap-2 items-center',
            onSelect: () => openEdit(user),
        },
    ]

    if (!isCurrentUser(user)) {
        items.push({
            label: 'Delete',
            icon: 'i-lucide-trash',
            color: 'error',
            class: 'flex gap-2 items-center',
            onSelect: () => openDelete(user),
        })
    }

    return items
}

/*
|--------------------------------------------------------------------------
| Create / Edit
|--------------------------------------------------------------------------
*/

const formOpen = ref(false)
const selectedUser = ref<StrapiUser | null>(null)
const saving = ref(false)
const formError = ref('')

const isEditing = computed(() => !!selectedUser.value)

const form = ref<UserForm>({
    username: '',
    email: '',
    password: '',
    roleId: undefined,
    confirmed: false,
    blocked: false,
})

function resetForm() {
    form.value = {
        username: '',
        email: '',
        password: '',
        roleId: undefined,
        confirmed: false,
        blocked: false,
    }
    formError.value = ''
}

function openCreate() {
    selectedUser.value = null
    resetForm()
    formOpen.value = true
}

function openEdit(user: StrapiUser) {
    selectedUser.value = user
    form.value = {
        username: user.username ?? '',
        email: user.email ?? '',
        password: '',
        roleId: user.role?.id ?? undefined,
        confirmed: user.confirmed ?? false,
        blocked: user.blocked ?? false,
    }
    formError.value = ''
    formOpen.value = true
}

async function saveUser() {
    if (saving.value) return

    formError.value = ''

    if (!form.value.username.trim() || !form.value.email.trim()) {
        formError.value = 'Username and email are required.'
        return
    }

    if (!isEditing.value && form.value.password.length < 6) {
        formError.value = 'Password must be at least 6 characters.'
        return
    }

    if (!form.value.roleId) {
        formError.value = 'Please select a role.'
        return
    }

    saving.value = true

    try {
        if (isEditing.value) {
            const body: Record<string, unknown> = {
                username: form.value.username.trim(),
                email: form.value.email.trim(),
                role: form.value.roleId,
                confirmed: form.value.confirmed,
                blocked: form.value.blocked,
            }

            if (form.value.password) {
                body.password = form.value.password
            }

            await strapi.put(`/users/${selectedUser.value?.id}`, body)
            toast.add({
                title: 'User saved successfully',
                description: `Changes saved for user: ${form.value.username.trim()}`,
            })
        } else {
            await strapi.post('/users', {
                username: form.value.username.trim(),
                email: form.value.email.trim(),
                password: form.value.password,
                role: form.value.roleId,
                confirmed: form.value.confirmed,
            })
            toast.add({
                title: 'User created successfully',
                description: `User ${form.value.username.trim()} was created`,
            })
        }

        formOpen.value = false
        await refreshUsers()
    } catch (err) {
        formError.value =
            (err as Error).message ?? 'Failed to save user. Please try again.'
    } finally {
        saving.value = false
    }
}

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

const deleteOpen = ref(false)
const userToDelete = ref<StrapiUser | null>(null)
const deleting = ref(false)
const deleteError = ref('')

function openDelete(user: StrapiUser) {
    userToDelete.value = user
    deleteError.value = ''
    deleteOpen.value = true
}

async function confirmDelete() {
    if (deleting.value || !userToDelete.value) return

    deleting.value = true
    deleteError.value = ''

    try {
        await strapi.delete(`/users/${userToDelete.value.id}`)
        toast.add({
            title: 'User Deleted Successfully',
            description: `User ${userToDelete.value.username} was deleted successfully`,
        })
        deleteOpen.value = false
        await refreshUsers()
    } catch (err) {
        deleteError.value =
            (err as Error).message ?? 'Failed to delete user. Please try again.'
    } finally {
        deleting.value = false
    }
}
</script>
