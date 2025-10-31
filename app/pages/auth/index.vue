<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  title: 'Authentication',
})

// Redirect to login page
await navigateTo('/auth/login')
</script>

<template>
  <div>
    <!-- This page will redirect to login -->
  </div>
</template>

