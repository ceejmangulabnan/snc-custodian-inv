<script setup lang="ts">
//@ts-nocheck
const showMessage = ref(false)
</script>

<template>
  <UContainer class="py-12">
    <UCard class="mx-auto max-w-xl">
      <template #header>
        <div>
          <h1 class="text-2xl font-bold">
            Nuxt 4 + Nuxt UI
          </h1>

          <p class="mt-1 text-sm text-muted">
            Your project was installed successfully.
          </p>
        </div>
      </template>

      <div class="space-y-4">
        <p>
          You can now start building your application using Nuxt UI
          components.
        </p>

        <UButton @click="showMessage = true">
          Test Nuxt UI
        </UButton>

        <UAlert
          v-if="showMessage"
          title="Installation successful"
          description="Nuxt UI components are working correctly."
          color="success"
        />
      </div>
    </UCard>
  </UContainer>
</template>