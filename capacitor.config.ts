import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vanistudio.beherasir',
  appName: 'Vani Vault - Dr. Laxmidhar Behera',
  webDir: 'web-portal',
  backgroundColor: '#0f1117',

  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
}

export default config
