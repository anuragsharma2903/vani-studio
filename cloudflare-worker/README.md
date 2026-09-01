# ☁️ Cloudflare R2 Audio Streaming & On-Demand Worker

This worker allows you to stream your master audio files and download on-demand trimmed clips from **Cloudflare R2** with **$0 egress bandwidth fees**.

---

## 🚀 Quick 2-Minute Setup Guide

### Step 1: Create a Free R2 Bucket on Cloudflare
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and navigate to **R2**.
2. Click **Create bucket** -> Name it `audio-repository` (or any name).
3. Click **Manage R2 API Tokens** -> **Create API Token**:
   - Permissions: **Object Read & Write**
   - Copy your **Account ID**, **Access Key ID**, and **Secret Access Key**.

### Step 2: Configure the Desktop App
1. Open the Desktop App and navigate to **Settings & Diagnostics**.
2. Scroll to **Cloudflare R2 Storage Settings**:
   - Paste your **Account ID**, **Access Key ID**, **Secret Access Key**, and **Bucket Name**.
   - Click **Test Connection** (turns green when verified).
   - Toggle **Enable Cloudflare R2 Sync**.

### Step 3: Deploy the Cloudflare Worker (Optional for Web Streaming)
From your terminal:
```bash
cd cloudflare-worker
npx wrangler deploy
```

Now your audio repository can be streamed globally and downloaded with zero bandwidth fees!
