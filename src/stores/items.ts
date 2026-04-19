import { defineStore } from 'pinia';
import { request } from '@/api/client';
import type { paths } from '@/api/generated/openapi';

type ItemsListResponse =
  paths['/items']['get']['responses']['200']['content']['application/json'];
type Item = ItemsListResponse[number];
type NewItem =
  paths['/items']['post']['requestBody']['content']['application/json'];

interface ItemsState {
  items: Item[];
  loading: boolean;
  error: string | null;
}

export const useItemsStore = defineStore('items', {
  state: (): ItemsState => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAll(): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        this.items = await request<ItemsListResponse>('GET', '/items');
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e);
      } finally {
        this.loading = false;
      }
    },

    async create(input: NewItem): Promise<void> {
      this.error = null;
      try {
        await request('POST', '/items', input);
        await this.fetchAll();
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e);
        throw e;
      }
    },

    async remove(id: string): Promise<void> {
      this.error = null;
      try {
        await request('DELETE', `/items/${id}`);
        await this.fetchAll();
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e);
        throw e;
      }
    },
  },
});
