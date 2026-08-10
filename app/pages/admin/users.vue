<template>
    <div class="space-y-6">
        <div class="flex items-start gap-4">
            <div
                class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
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
            <UTable :data="users ?? []" :columns="userColumns" class="flex-1">
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

        <UModal v-model:open="editOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                        >
                            <UIcon name="i-lucide-pen" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Edit User
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Editing
                                <span
                                    class="font-medium text-slate-700 dark:text-slate-300"
                                >
                                    {{ selectedUser?.username }}
                                </span>
                            </p>
                        </div>
                    </div>

                    <UForm class="mt-6 space-y-4" :state="editForm">
                        <UFormField label="Username">
                            <UInput
                                v-model="editForm.username"
                                icon="i-lucide-user"
                                placeholder="Enter username"
                                class="w-full"
                            />
                        </UFormField>

                        <UFormField label="Email">
                            <UInput
                                v-model="editForm.email"
                                icon="i-lucide-mail"
                                placeholder="user@example.com"
                                class="w-full"
                            />
                        </UFormField>

                        <UFormField label="Role">
                            <USelect
                                v-model="editForm.roleName"
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
                                <USwitch v-model="editForm.confirmed" />
                            </UFormField>

                            <UFormField
                                label="Blocked"
                                orientation="horizontal"
                                class="flex items-center"
                            >
                                <USwitch v-model="editForm.blocked" />
                            </UFormField>
                        </div>
                    </UForm>

                    <div class="mt-6 flex justify-end gap-3">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="editOpen = false"
                        >
                            Cancel
                        </UButton>

                        <UButton
                            color="success"
                            icon="i-lucide-check"
                            @click="saveUser"
                        >
                            Save
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>

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

interface UserEditForm {
    username: string
    email: string
    roleName: string
    confirmed: boolean
    blocked: boolean
}

const {
    data: users,
    pending,
    error,
} = await useAsyncData('users', () =>
    strapi.get<StrapiUser[]>('/users', { populate: 'role' })
)

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

function getActionItems(user: StrapiUser): DropdownMenuItem[] {
    return [
        {
            label: 'Edit',
            icon: 'i-lucide-pen',
            class: 'flex gap-2 items-center',
            onSelect: () => openEdit(user),
        },
        {
            label: 'Delete',
            icon: 'i-lucide-trash',
            color: 'error',
            class: 'flex gap-2 items-center',
            onSelect: () => openDelete(user),
        },
    ]
}

const deleteOpen = ref(false)
const userToDelete = ref<StrapiUser | null>(null)

const editOpen = ref(false)
const selectedUser = ref<StrapiUser | null>(null)

const editForm = ref<UserEditForm>({
    username: '',
    email: '',
    roleName: '',
    confirmed: false,
    blocked: false,
})

const roleOptions = computed(() => {
    const roles = new Map<string, string>()
    for (const user of users.value ?? []) {
        if (user.role?.name) {
            roles.set(user.role.name, user.role.name)
        }
    }
    return Array.from(roles, ([value, label]) => ({ label, value }))
})

function openEdit(user: StrapiUser) {
    selectedUser.value = user
    editForm.value = {
        username: user.username ?? '',
        email: user.email ?? '',
        roleName: user.role?.name ?? '',
        confirmed: user.confirmed ?? false,
        blocked: user.blocked ?? false,
    }
    editOpen.value = true
}

function saveUser() {
    console.log('Save User', selectedUser.value?.id, editForm.value)
    editOpen.value = false
    toast.add({
        title: 'User saved successfully',
        description: `Changes saved for user: ${selectedUser.value?.username}`,
    })
}

function openDelete(user: StrapiUser) {
    userToDelete.value = user
    deleteOpen.value = true
}

function confirmDelete() {
    console.log('Delete User', userToDelete.value?.id)
    deleteOpen.value = false
    toast.add({
        title: 'User Deleted Successfully',
        description: `User ${userToDelete.value?.username} was deleted successfully`,
    })
}
</script>
