# cPanel Deployment Guide for UniversalPDFConverter

This guide will help you deploy this Next.js application on cPanel with CloudLinux OS.

## Prerequisites
- cPanel account with Node.js support (version 18.x or higher recommended)
- Git Version Control enabled in cPanel
- Domain pointed to your cPanel account

## Deployment Steps

### 1. Setup Node.js Application in cPanel

1. Log into your cPanel account
2. Navigate to **"Setup Node.js App"** (under Software section)
3. Click **"Create Application"**
4. Configure the application:
   - **Node.js version**: Select 18.x or higher
   - **Application mode**: Production
   - **Application root**: Select your repository folder (e.g., `universalpdfconverter` or `public_html/yourfolder`)
   - **Application URL**: Your domain (e.g., yourdomain.com)
   - **Application startup file**: `server.js`
   - **Port**: Leave the default port assigned by cPanel

### 2. Install Dependencies

1. In the Node.js App section, you'll see an option to run commands
2. Click on the application you just created
3. Click **"Run NPM Install"** or use the command terminal to run:
   ```bash
   npm install
   ```

### 3. Build the Application

In the cPanel Node.js app terminal or via SSH, run:
```bash
npm run build
```

This will create an optimized production build of your Next.js application.

### 4. Configure Environment Variables (if needed)

If you have any environment variables:
1. In cPanel Node.js App manager, look for **"Environment Variables"** section
2. Add your variables (e.g., `NODE_ENV=production`)

### 5. Start the Application

1. In cPanel Node.js App section, click **"Start App"** or **"Restart App"**
2. The application will start using the `server.js` file
3. Your app should now be accessible via your domain

### 6. Set Up Git Auto-Deploy (Optional)

To automatically deploy when you push to your repository:

1. Go to **"Git Version Control"** in cPanel
2. Click **"Manage"** on your repository
3. Enable **"Pull on Deploy"**
4. Add a deploy script:
   ```bash
   #!/bin/bash
   npm install
   npm run build
   /usr/sbin/cloudlinux-selector restart --json --interpreter nodejs --app-root ~/public_html/yourfolder
   ```

## Troubleshooting

### Application won't start
- Check Node.js version (should be 18.x or higher)
- Verify all dependencies are installed: `npm install`
- Check cPanel error logs in Node.js App section
- Ensure the port is not being used by another application

### Build fails
- Make sure you have enough disk space
- Check if all dependencies are properly installed
- Look at the build logs for specific errors

### 404 errors or routing issues
- Ensure the `.htaccess` file is in the application root
- Verify the domain is properly pointed to the application root
- Check that the Node.js app is running in cPanel

### Port conflicts
- cPanel assigns a specific port to your Node.js app
- The app will automatically use the port from `process.env.PORT`
- Don't manually set a port; let cPanel handle it

## Files Created for cPanel Deployment

- `server.js` - Custom Node.js server for cPanel
- `.htaccess` - Apache configuration for routing
- Updated `next.config.ts` - Standalone output configuration
- Updated `package.json` - Added `start:server` script

## Important Notes

- Always run `npm run build` after making changes to your code
- Restart the Node.js app in cPanel after rebuilding
- Monitor your disk space usage as builds can consume space
- Keep your Node.js version updated in cPanel

## Support

If you encounter issues:
1. Check cPanel error logs (Node.js App section)
2. Review Next.js build output
3. Contact your hosting provider for cPanel-specific issues
4. Check Next.js documentation: https://nextjs.org/docs

## Performance Tips

- Enable caching in your domain's htaccess
- Use CDN for static assets if available
- Monitor your application's memory usage in cPanel
- Consider using cPanel's optimization features

---

**Note**: This application uses Next.js 15 with React 19, which requires Node.js 18.x or higher. Make sure your cPanel Node.js version meets this requirement.
