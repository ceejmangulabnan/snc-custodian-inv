<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  middleware: ['admin-only']
})

interface StrapiUser {
  id: number
  username: string
  email: string
  confirmed?: boolean
  blocked?: boolean
  role?: {
    id: number
    name: string
    type: string
  }
}

interface StrapiRole {
  id: number
  name: string
  type: string
}

const { user: sessionUser } = useUserSession()
const { get, post, put, delete: del } = useStrapi()
const toast = useToast()

const users = ref<StrapiUser[]>([])
const roles = ref<StrapiRole[]>([])
const isLoading = ref(false)
const loadError = ref('')

const modalOpen = ref(false)
const isSaving = ref(false)
const editingId = ref<number | null>(null)
const savingError = ref('')

const form = reactive({
  username: '',
  email: '',
  password: '',
  roleId: undefined as number | undefined
})

const columns: TableColumn<StrapiUser>[] = [
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { id: 'status', header: 'Status' },
  { id: 'actions', header: '' }
]

async function loadData() {
  isLoading.value = true
  loadError.value = ''

  try {
    const [userData, roleData] = await Promise.all([
      get<StrapiUser[]>('/users', { populate: 'role' }),
      get<{ roles: StrapiRole[] }>('/users-permissions/roles')
    ])

    users.value = userData
    roles.value = roleData.roles
  } catch (error) {
    loadError.value = (error as Error).message
  } finally {
    isLoading.value = false
  }
}

function roleName(user: StrapiUser): string {
  return user.role?.name || '—'
}

function isActive(user: StrapiUser): boolean {
  return !user.blocked
}

function openCreate() {
  editingId.value = null
  form.username = ''
  form.email = ''
  form.password = ''
  form.roleId = roles.value.find(r => r.type === 'custodian')?.id ?? roles.value[0]?.id
  savingError.value = ''
  modalOpen.value = true
}

function openEdit(user: StrapiUser) {
  editingId.value = user.id
  form.username = user.username
  form.email = user.email
  form.password = ''
  form.roleId = user.role?.id ?? undefined
  savingError.value = ''
  modalOpen.value = true
}

async function saveUser() {
  if (isSaving.value) {
    return
  }

  savingError.value = ''

  if (!form.username.trim() || !form.email.trim() || !form.roleId) {
    savingError.value = 'Username, email, and role are required.'
    return
  }

  if (editingId.value === null && form.password.length < 6) {
    savingError.value = 'Password must be at least 6 characters.'
    return
  }

  isSaving.value = true

  try {
    if (editingId.value === null) {
      await post('/users', {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.roleId
      })
      toast.add({ title: 'User created', color: 'success' })
    } else {
      await put(`/users/${editingId.value}`, {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.roleId,
        ...(form.password ? { password: form.password } : {})
      })
      toast.add({ title: 'User updated', color: 'success' })
    }

    modalOpen.value = false
    await loadData()
  } catch (error) {
    savingError.value = (error as Error).message
  } finally {
    isSaving.value = false
  }
}

async function toggleBlocked(user: StrapiUser) {
  if (user.id === sessionUser.value?.id) {
    toast.add({ title: 'You cannot block your own account.', color: 'warning' })
    return
  }

  try {
    await put(`/users/${user.id}`, { blocked: !user.blocked })
    toast.add({
      title: user.blocked ? 'User unblocked' : 'User blocked',
      color: 'success'
    })
    await loadData()
  } catch (error) {
    toast.add({ title: (error as Error).message, color: 'error' })
  }
}

async function removeUser(user: StrapiUser) {
  if (user.id === sessionUser.value?.id) {
    toast.add({ title: 'You cannot delete your own account.', color: 'warning' })
    return
  }

  try {
    await del(`/users/${user.id}`)
    toast.add({ title: 'User deleted', color: 'success' })
    await loadData()
  } catch (error) {
    toast.add({ title: (error as Error).message, color: 'error' })
  }
}

onMounted(loadData)
</script>

<template>
  <UContainer class="py-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Users
        </h1>
        <p class="mt-1 text-sm text-muted">
          Manage accounts and roles.
        </p>
      </div>

      <UButton
        color="primary"
        icon="i-lucide-user-plus"
        @click="openCreate"
      >
        New User
      </UButton>
    </div>

    <UAlert
      v-if="loadError"
      :title="loadError"
      color="error"
      class="mb-6"
    />

    <UCard>
      <UTable
        :data="users"
        :columns="columns"
        :loading="isLoading"
      >
        <template #username-cell="{ row }">
          <span class="font-medium">{{ row.original.username }}</span>
        </template>

        <template #role-cell="{ row }">
          <UBadge
            :color="row.original.role?.type === 'administrator' ? 'primary' : 'neutral'"
            variant="soft"
          >
            {{ roleName(row.original) }}
          </UBadge>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="isActive(row.original) ? 'success' : 'error'"
            variant="soft"
          >
            {{ isActive(row.original) ? 'Active' : 'Blocked' }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UTooltip text="Edit">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="soft"
                size="sm"
                @click="openEdit(row.original)"
              />
            </UTooltip>

            <UTooltip :text="isActive(row.original) ? 'Block' : 'Unblock'">
              <UButton
                :icon="isActive(row.original) ? 'i-lucide-ban' : 'i-lucide-check'"
                color="warning"
                variant="soft"
                size="sm"
                :disabled="row.original.id === sessionUser?.id"
                @click="toggleBlocked(row.original)"
              />
            </UTooltip>

            <UTooltip text="Delete">
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="soft"
                size="sm"
                :disabled="row.original.id === sessionUser?.id"
                @click="removeUser(row.original)"
              />
            </UTooltip>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="modalOpen">
      <UCard>
        <template #header>
          <h2 class="text-lg font-bold">
            {{ editingId === null ? 'New User' : 'Edit User' }}
          </h2>
        </template>

        <UForm
          :state="form"
          class="space-y-5"
          @submit="saveUser"
        >
          <UAlert
            v-if="savingError"
            :title="savingError"
            color="error"
          />

          <UFormField
            label="Username"
            name="username"
            required
          >
            <UInput
              v-model.trim="form.username"
              icon="i-lucide-user"
            />
          </UFormField>

          <UFormField
            label="Email"
            name="email"
            required
          >
            <UInput
              v-model.trim="form.email"
              type="email"
              icon="i-lucide-mail"
            />
          </UFormField>

          <UFormField
            label="Password"
            name="password"
            :required="editingId === null"
            :hint="editingId !== null ? 'Leave blank to keep unchanged' : undefined"
          >
            <UInput
              v-model="form.password"
              type="password"
              icon="i-lucide-lock"
              autocomplete="new-password"
            />
          </UFormField>

          <UFormField
            label="Role"
            name="roleId"
            required
          >
            <USelect
              v-model="form.roleId"
              :items="roles.map((role) => ({ label: role.name, value: role.id }))"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-2">
            <UButton
              color="neutral"
              variant="soft"
              :disabled="isSaving"
              @click="modalOpen = false"
            >
              Cancel
            </UButton>

            <UButton
              type="submit"
              color="primary"
              :loading="isSaving"
            >
              {{ editingId === null ? 'Create User' : 'Save Changes' }}
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </UContainer>
</template>
