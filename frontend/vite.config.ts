import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Forward all /api/* requests to the local .NET 8 API.
      // Change the port below if dotnet run picks a different one.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false, // accept the self-signed dev HTTPS cert
      },
    },
  },
})
