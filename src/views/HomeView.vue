<script setup>
import { defineAsyncComponent, watchEffect } from 'vue';
import { useSessionStore } from '../stores/session';
import { useRouter } from 'vue-router';

const Login = defineAsyncComponent(() => import('../components/modals/Login.vue'));
const sessionStore = useSessionStore();
const router = useRouter();

watchEffect(() => {
  if (sessionStore.sessionState === 'loggedIn') {
    router.replace('/dashboard/subscriptions');
  }
});
</script>

<template>
  <Login v-if="sessionStore.sessionState === 'loggedOut'" :login="sessionStore.login" />
</template>
