<script setup lang="ts">
const { user, isAdmin, isCustodian } = useAuth()

const roleLabel = computed(() => {
  if (isAdmin.value) {
    return 'Administrator'
  }

  if (isCustodian.value) {
    return 'Custodian'
  }

  return user.value?.role?.type || ''
})
</script>

<template>
  <UContainer class="py-8">
    <UCard class="mx-auto max-w-2xl">
      <template #header>
        <div>
          <h1 class="text-2xl font-bold">
            Welcome, {{ user?.username }}
          </h1>

          <p class="mt-1 text-sm text-muted">
            Signed in as
            <span class="font-semibold capitalize">{{ roleLabel }}</span>
          </p>
        </div>
      </template>

      <div class="space-y-4">
        <p>
          This is the SNC Custodian Inventory dashboard. Use the sidebar to
          manage items, categories, and transactions.
        </p>

        <UAlert
          v-if="isAdmin"
          title="Administrator access"
          description="You can manage user accounts and roles from the Users page."
          color="success"
        />
      </div>
    </UCard>
  </UContainer>
</template>
