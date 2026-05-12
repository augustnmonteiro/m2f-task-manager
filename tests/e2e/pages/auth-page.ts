import { type Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async signUp(email: string, password: string) {
    await this.page.getByRole('button', { name: /sign up/i }).click();
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /create account/i }).click();
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /log in/i }).click();
  }

  async expectAuthFormVisible() {
    await expect(this.page.getByRole('heading', { name: /task notifier/i })).toBeVisible();
  }
}
