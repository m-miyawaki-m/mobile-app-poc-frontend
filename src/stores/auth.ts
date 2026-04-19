import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';
import { CapacitorHttp } from '@capacitor/core';
import type { paths } from '@/api/generated/openapi';

const STORAGE_KEY = 'mobile-app-poc.auth';
const BASE_URL = import.meta.env.VITE_API_BASE;

type LoginResponse =
  paths['/auth/login']['post']['responses']['200']['content']['application/json'];

interface AuthState {
  token: string | null;
  expiresAt: number | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    expiresAt: null,
  }),
  getters: {
    isAuthenticated(state): boolean {
      if (!state.token || !state.expiresAt) return false;
      return Date.now() < state.expiresAt;
    },
  },
  actions: {
    async login(username: string, password: string): Promise<void> {
      const response = await CapacitorHttp.request({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        headers: { 'Content-Type': 'application/json' },
        data: { username, password },
      });

      if (response.status >= 400) {
        throw new Error(`ログイン失敗 (${response.status})`);
      }

      const data = response.data as LoginResponse;
      this.token = data.token;
      this.expiresAt = Date.now() + data.expiresIn * 1000;

      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify({
          token: this.token,
          expiresAt: this.expiresAt,
        }),
      });
    },

    async logout(): Promise<void> {
      this.token = null;
      this.expiresAt = null;
      await Preferences.remove({ key: STORAGE_KEY });
    },

    async loadFromStorage(): Promise<void> {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (!value) return;
      try {
        const parsed = JSON.parse(value) as AuthState;
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          this.token = parsed.token;
          this.expiresAt = parsed.expiresAt;
        } else {
          await Preferences.remove({ key: STORAGE_KEY });
        }
      } catch {
        await Preferences.remove({ key: STORAGE_KEY });
      }
    },
  },
});
