<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
} from '@ionic/vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const username = ref(import.meta.env.VITE_LOGIN_USERNAME ?? '');
const password = ref(import.meta.env.VITE_LOGIN_PASSWORD ?? '');
const errorMessage = ref<string | null>(null);
const showError = ref(false);
const loggingIn = ref(false);

async function onLogin() {
  errorMessage.value = null;
  loggingIn.value = true;
  try {
    await auth.login(username.value, password.value);
    await router.replace('/items');
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : String(e);
    showError.value = true;
  } finally {
    loggingIn.value = false;
  }
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>ログイン</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="stacked">ユーザー名</ion-label>
        <ion-input v-model="username" autocomplete="username" />
      </ion-item>
      <ion-item>
        <ion-label position="stacked">パスワード</ion-label>
        <ion-input v-model="password" type="password" autocomplete="current-password" />
      </ion-item>
      <ion-button
        expand="block"
        class="ion-margin-top"
        :disabled="loggingIn || !username || !password"
        @click="onLogin"
      >
        {{ loggingIn ? '送信中...' : 'ログイン' }}
      </ion-button>
      <ion-toast
        :is-open="showError"
        :message="errorMessage ?? ''"
        :duration="3000"
        color="danger"
        @did-dismiss="showError = false"
      />
    </ion-content>
  </ion-page>
</template>
