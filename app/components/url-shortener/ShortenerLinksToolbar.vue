<script setup lang="ts">
const searchModel = defineModel<string>('search', { default: '' })
const perPageModel = defineModel<number>('perPage', { default: 10 })
</script>

<template>
  <TairoContentWrapper>
    <template #left>
      <TairoInput
        v-model="searchModel"
        icon="lucide:search"
        placeholder="Search links..."
        rounded="lg"
      />
    </template>
    <template #right>
      <TairoSelect
        v-model="perPageModel"
        icon="solar:list-linear"
        rounded="lg"
        size="sm"
        class="w-32"
      >
        <BaseSelectItem :value="10">10 per page</BaseSelectItem>
        <BaseSelectItem :value="25">25 per page</BaseSelectItem>
        <BaseSelectItem :value="50">50 per page</BaseSelectItem>
      </TairoSelect>
    </template>
    <slot />
  </TairoContentWrapper>
</template>
