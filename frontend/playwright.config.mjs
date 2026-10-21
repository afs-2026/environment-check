import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests',workers:1,retries:0,timeout:30000,use:{baseURL:'http://127.0.0.1:15173',browserName:'chromium',headless:true},reporter:[['list']]});
