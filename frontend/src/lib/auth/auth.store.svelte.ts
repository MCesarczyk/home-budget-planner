import type { User } from './types';
import {
	fetchMe,
	login as apiLogin,
	logout as apiLogout,
} from './utils';

class AuthState {
	user = $state<User | null>(null);
	loading = $state(true);

	get isAuthenticated(): boolean {
		return this.user !== null;
	}

	async refresh(): Promise<void> {
		this.loading = true;
		try {
			this.user = await fetchMe();
		} catch {
			this.user = null;
		} finally {
			this.loading = false;
		}
	}

	async login(username: string, password: string): Promise<void> {
		await apiLogin(username, password);
		this.user = await fetchMe();
	}

	async logout(): Promise<void> {
		// Logging out must always clear the local session, even if the network
		// call fails — otherwise the UI is stuck "signed in" with no recourse.
		try {
			await apiLogout();
		} catch {
			// ignore — clearing local state below is what matters
		}
		this.user = null;
	}
}

export const auth = new AuthState();
