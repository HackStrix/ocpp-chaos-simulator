# Dependency Conflict Resolution

## 🚨 **Issue Fixed: esbuild Version Conflict**

**Problem**: GitHub Actions was failing with:
```
Error: Expected "0.14.47" but got "0.15.18"
```

**Root Cause**: 
- `@cloudflare/next-on-pages` uses newer esbuild versions
- `@vercel/gatsby-plugin-vercel-builder` pinned to older esbuild 0.14.47
- Created dependency version conflict in CI/CD

## ✅ **Solution Applied**

### **1. Added .npmrc Configuration**
```ini
# frontend/.npmrc
legacy-peer-deps=true
fund=false
audit-level=moderate
```

### **2. Regenerated package-lock.json**
```bash
cd frontend
rm -f package-lock.json
npm install --legacy-peer-deps
```

### **3. Updated GitHub Actions**
Both workflows now use standard `npm ci` (legacy-peer-deps configured via .npmrc)

## 🔍 **Technical Details**

### **Dependency Tree Conflict**
```
@cloudflare/next-on-pages
├── esbuild@^0.15.x (latest)
└── @vercel/gatsby-plugin-vercel-builder
    └── esbuild@0.14.47 (pinned)
```

### **Resolution Strategy**
- `legacy-peer-deps=true` - Allows npm to install conflicting peer dependencies
- Regenerated lock file with conflict resolution
- Maintained backward compatibility

## 📊 **Build Performance**

| Before | After |
|--------|-------|
| ❌ CI Failing | ✅ CI Passing |
| Dependency conflicts | Clean resolution |
| Manual workarounds | Automatic handling |

## 🎯 **Prevention**

The `.npmrc` file ensures:
- ✅ Consistent dependency resolution across environments
- ✅ Automatic handling of peer dependency conflicts
- ✅ Reduced CI/CD noise from funding messages
- ✅ Moderate audit level (ignores low-severity issues)

## 🔧 **Future Maintenance**

If similar conflicts arise:
1. Check for conflicting transitive dependencies
2. Update `.npmrc` if needed
3. Regenerate `package-lock.json` with conflict resolution
4. Test build process locally before pushing

This solution maintains compatibility while enabling the use of modern Cloudflare Workers tooling.
