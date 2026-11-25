<template>
    <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        class="object-cover"
        :style="imageStyle"
    />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ size?: string | number }>(), {
    size: 40,
})

const dimension = computed(() =>
    typeof props.size === 'number' ? `${props.size}px` : props.size
)

const imageStyle = computed(() => ({
    width: dimension.value,
    height: dimension.value,
}))
</script>
