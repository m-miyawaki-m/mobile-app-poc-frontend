<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonInput,
  IonToast,
} from '@ionic/vue';
import { add } from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';
import { useItemsStore } from '@/stores/items';

const router = useRouter();
const auth = useAuthStore();
const store = useItemsStore();

const showError = ref(false);
const errorText = computed(() => store.error ?? '');

const isModalOpen = ref(false);
const newName = ref('');
const newQuantity = ref<number | null>(null);

onMounted(async () => {
  await store.fetchAll();
  if (store.error) showError.value = true;
});

function openCreate() {
  newName.value = '';
  newQuantity.value = null;
  isModalOpen.value = true;
}

async function submitCreate() {
  if (!newName.value || newQuantity.value === null) return;
  try {
    await store.create({ name: newName.value, quantity: newQuantity.value });
    isModalOpen.value = false;
  } catch {
    showError.value = true;
  }
}

async function deleteItem(id: string) {
  try {
    await store.remove(id);
  } catch {
    showError.value = true;
  }
}

async function onLogout() {
  await auth.logout();
  await router.replace('/login');
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>アイテム</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onLogout">ログアウト</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list v-if="store.items.length > 0">
        <ion-item-sliding v-for="item in store.items" :key="item.id">
          <ion-item>
            <ion-label>
              <h2>{{ item.name }}</h2>
              <p>quantity: {{ item.quantity }}</p>
            </ion-label>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option color="danger" @click="deleteItem(item.id)">削除</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-else-if="!store.loading" class="ion-padding ion-text-center">
        アイテムがありません。
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openCreate">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal :is-open="isModalOpen" @did-dismiss="isModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>新規アイテム</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="isModalOpen = false">キャンセル</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">名前</ion-label>
            <ion-input v-model="newName" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">数量</ion-label>
            <ion-input v-model.number="newQuantity" type="number" min="0" />
          </ion-item>
          <ion-button
            expand="block"
            class="ion-margin-top"
            :disabled="!newName || newQuantity === null"
            @click="submitCreate"
          >
            保存
          </ion-button>
        </ion-content>
      </ion-modal>

      <ion-toast
        :is-open="showError"
        :message="errorText"
        :duration="3000"
        color="danger"
        @did-dismiss="showError = false"
      />
    </ion-content>
  </ion-page>
</template>
