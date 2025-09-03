# Custom Domain Setup: ocpp.sankalpnarula.com

## 🎯 **Goal**
Configure `ocpp.sankalpnarula.com` as the custom domain for your OCPP Chaos Simulator frontend deployed on Cloudflare Workers.

## ✅ **Configuration Complete**
Your `wrangler.toml` is already configured with:
```toml
[[env.production.routes]]
pattern = "ocpp.sankalpnarula.com/*"
zone_name = "sankalpnarula.com"
```

## 🔧 **Setup Methods**

### **Method 1: Automatic (Recommended)**

When you deploy via GitHub Actions, Wrangler will automatically:
1. Create the subdomain route
2. Configure SSL certificates  
3. Set up the custom domain

**No manual steps required!** 🎉

### **Method 2: Manual Dashboard Setup**

If you prefer manual control:

#### **Step 1: Cloudflare DNS**
1. Go to **Cloudflare Dashboard** → `sankalpnarula.com`
2. Navigate to **DNS** → **Records**
3. **Add record**:
   ```
   Type: CNAME
   Name: ocpp
   Target: ocpp-chaos-simulator.YOUR_SUBDOMAIN.workers.dev
   Proxy: Enabled (🧡)
   TTL: Auto
   ```

#### **Step 2: Workers Custom Domain**
1. **Workers & Pages** → **ocpp-chaos-simulator**
2. **Settings** → **Triggers** → **Custom Domains**
3. **Add Custom Domain**: `ocpp.sankalpnarula.com`
4. **Activate**

## 🚀 **Deployment Process**

### **GitHub Actions (Automatic)**
```bash
# Your current workflow will:
1. Build frontend → npm run build:cloudflare
2. Deploy to Workers → wrangler deploy  
3. Configure domain → ocpp.sankalpnarula.com
4. Report success → GitHub Actions summary
```

### **Manual Deployment**
```bash
# Local deployment (if needed)
cd frontend
npm run build:cloudflare
npm run deploy

# Or step by step
wrangler login
wrangler deploy
```

## 🌐 **Domain Architecture**

```
sankalpnarula.com (Main domain)
├── www.sankalpnarula.com (Your main site)
├── api.sankalpnarula.com (Potential backend)
└── ocpp.sankalpnarula.com (OCPP Simulator) ← NEW
```

## 📊 **Expected Results**

### **✅ Success Indicators**
- Frontend accessible at: `https://ocpp.sankalpnarula.com`
- SSL certificate automatically provisioned
- Cloudflare global CDN enabled
- Worker deployment in all Cloudflare edge locations

### **📈 Performance Benefits**
- **Global Edge**: Deployed to 200+ locations worldwide
- **SSL/TLS**: Automatic HTTPS with Cloudflare certificates  
- **Caching**: Static assets cached at edge
- **Speed**: Sub-100ms response times globally

## 🛠️ **Configuration Details**

### **Current wrangler.toml**
```toml
name = "ocpp-chaos-simulator"
main = "_worker.js"
compatibility_date = "2024-01-15"

[build]
command = "npx @cloudflare/next-on-pages"

[env.production]
compatibility_flags = ["nodejs_compat"]

[[env.production.routes]]
pattern = "ocpp.sankalpnarula.com/*"
zone_name = "sankalpnarula.com"
```

### **GitHub Actions Integration**
Your deployment summary will show:
```
✅ Frontend (Cloudflare Workers)
- Status: Deployed successfully
- Platform: Cloudflare Workers  
- Domain: https://ocpp.sankalpnarula.com
```

## 🔍 **Verification Steps**

### **1. DNS Propagation**
```bash
# Check DNS resolution
dig ocpp.sankalpnarula.com

# Expected: CNAME record pointing to Cloudflare Workers
```

### **2. SSL Certificate**
```bash
# Check SSL certificate
curl -I https://ocpp.sankalpnarula.com

# Expected: HTTP/2 200 with Cloudflare SSL
```

### **3. Worker Response**
```bash
# Test the application
curl https://ocpp.sankalpnarula.com

# Expected: Your Next.js application HTML
```

## 🎯 **Next Steps After Deployment**

1. **✅ Push to main** → Triggers automatic deployment
2. **🔍 Verify domain** → Check `https://ocpp.sankalpnarula.com`
3. **📊 Monitor performance** → Cloudflare Analytics
4. **🔧 Configure features** → Add environment variables if needed

## 🚨 **Troubleshooting**

### **Domain Not Working?**
1. Check DNS propagation: `dig ocpp.sankalpnarula.com`
2. Verify Cloudflare proxy is enabled (🧡)
3. Check Workers deployment status in dashboard

### **SSL Issues?**
1. Ensure domain is proxied through Cloudflare
2. Check SSL/TLS encryption mode is "Full (strict)"
3. Wait 10-15 minutes for certificate provisioning

### **Deployment Failures?**
1. Verify `CLOUDFLARE_API_TOKEN` has Workers:Edit permissions
2. Check `CLOUDFLARE_ACCOUNT_ID` is correct
3. Ensure domain is added to your Cloudflare account

Your subdomain will be live at **`https://ocpp.sankalpnarula.com`** after the next deployment! 🚀
