<script setup>
import TransformCard from './ServiceSettings/TransformCard.vue';

defineProps({
  settings: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div class="space-y-8">
    <TransformCard :settings="settings" />
  </div>
</template>
