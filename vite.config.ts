
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Removed 'base: ./' for better compatibility with Vercel's root handling
});
