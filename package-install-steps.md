# Installation Steps for Offline Capability

## Required Package Installation

```bash
npm install localforage
# or
yarn add localforage
```

## Optional Type Definitions (TypeScript)

```bash
npm install --save-dev @types/localforage
# or
yarn add --dev @types/localforage
```

## Package.json Dependencies Added

```json
{
  "dependencies": {
    "localforage": "^1.10.0"
  },
  "devDependencies": {
    "@types/localforage": "^0.0.34"
  }
}
```

## Quick Test Commands

```bash
# Start development server
npm run dev

# In browser console, test offline functionality:
# 1. Open Network tab in DevTools
# 2. Check "Offline" checkbox
# 3. Try creating sales/products
# 4. Check console for queue logs
# 5. Uncheck "Offline" to test sync
```

✅ All files have been created and the system is ready to use!
