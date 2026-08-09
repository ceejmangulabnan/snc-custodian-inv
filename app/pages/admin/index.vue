<template>
    <div class="bg-red-400">
        <h1>This is the Admin Dashboard Page</h1>
    </div>
</template>
<script setup lang="ts">
definePageMeta({
    layout: 'admin',
    middleware: 'admin',
})
</script>
