# Deployment Instructions for Gravity Tag Multiplayer

Follow these steps to successfully deploy your game to Heroku:

## Prerequisites

- Heroku CLI installed locally
- Git installed locally
- Node.js v18.x

## Steps for Deployment

### 1. Login to Heroku

```bash
heroku login
```

### 2. Set Heroku Environment Variables

```bash
# Make sure you're inside the project directory
heroku config:set NODE_ENV=production --app gravity-tag-multiplayer-ee093a27ee7b
```

### 3. Deploy to Heroku

```bash
# If you haven't already connected your app
git push heroku main
```

### 4. Check Logs for Errors

```bash
heroku logs --tail --app gravity-tag-multiplayer-ee093a27ee7b
```

### 5. Restart the Dyno

If needed, restart the application:

```bash
heroku restart --app gravity-tag-multiplayer-ee093a27ee7b
```

## Troubleshooting 503 Service Unavailable Errors

If you're still encountering 503 errors after deployment:

1. **Check Application Logs**:
   ```bash
   heroku logs --tail --app gravity-tag-multiplayer-ee093a27ee7b
   ```

2. **Ensure Your Application is Running**:
   ```bash
   heroku ps --app gravity-tag-multiplayer-ee093a27ee7b
   ```

3. **Check Dependency Issues**:
   The root package.json should include all necessary server dependencies.

4. **Verify Build Process**:
   Check if the client is building correctly during deployment:
   ```bash
   heroku builds:info --app gravity-tag-multiplayer-ee093a27ee7b
   ```

5. **Check for Memory Issues**:
   Your application might be running out of memory:
   ```bash
   heroku restart --app gravity-tag-multiplayer-ee093a27ee7b
   ```

6. **Troubleshoot Socket.IO Issues**:
   Ensure WebSocket connections are supported by your Heroku plan.

## Important Notes

- The free tier of Heroku dynos will "sleep" after 30 minutes of inactivity, causing slow initial loads.
- WebSocket connections may have limitations on certain Heroku plans.
- Remember to run `npm install` if you make changes to dependencies locally.
