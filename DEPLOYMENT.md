# Vercel Deployment Guide

This guide will walk you through deploying your Barbershop Management System to Vercel.

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository
2. **Check Dependencies**: Make sure all dependencies are in `package.json`
3. **Environment Variables**: Prepare your environment variables

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Visit Vercel**: Go to [vercel.com](https://vercel.com) and sign in
2. **Create New Project**: Click "New Project"
3. **Import Repository**: Select your GitHub repository
4. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

5. **Environment Variables**: Add the following variables:
   ```
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?retryWrites=true&w=majority
   JWT_SECRET=your_secure_jwt_secret_here
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

6. **Deploy**: Click "Deploy"

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (run from project root)
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? [Select your account]
# - Link to existing project? N
# - What's your project's name? barbershop-mgmt
# - In which directory is your code located? ./
# - Want to override the settings? N
```

### 3. Configure MongoDB Atlas

1. **Network Access**:
   - Go to MongoDB Atlas Dashboard
   - Navigate to Network Access
   - Add IP Address: `0.0.0.0/0` (allows connections from anywhere)
   - Or add Vercel's IP ranges for better security

2. **Database User**:
   - Go to Database Access
   - Create a new user with read/write permissions
   - Use a strong password

3. **Connection String**:
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with your database name

### 4. Environment Variables Setup

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add each variable:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your_very_long_random_secret_string_here
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=another_very_long_random_secret_string_here
```

### 5. Generate Secure Secrets

For JWT_SECRET and NEXTAUTH_SECRET, generate secure random strings:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use an online generator (less secure but convenient)
# https://generate-secret.vercel.app/64
```

### 6. Post-Deployment Configuration

1. **Test Your Application**:
   - Visit your deployed URL
   - Test all major functionalities
   - Check console for any errors

2. **Custom Domain** (Optional):
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Update DNS records as instructed

3. **Environment Variables**:
   - Update `NEXTAUTH_URL` to your custom domain if using one

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs in Vercel dashboard
   # Common fixes:
   - Ensure all dependencies are in package.json
   - Check for TypeScript errors
   - Verify environment variables are set
   ```

2. **MongoDB Connection Issues**:
   - Verify MongoDB URI is correct
   - Check network access settings in MongoDB Atlas
   - Ensure database user has correct permissions

3. **Authentication Issues**:
   - Verify JWT_SECRET is set
   - Check NEXTAUTH_URL matches your deployment URL
   - Ensure NEXTAUTH_SECRET is set

4. **API Route Errors**:
   - Check function timeout settings in vercel.json
   - Verify API routes are in the correct directory structure
   - Check for CORS issues

### Debugging Steps

1. **Check Vercel Logs**:
   - Go to your project dashboard
   - Click on the latest deployment
   - Check "Functions" tab for API route logs
   - Check "Build" tab for build logs

2. **Local Testing**:
   ```bash
   # Test build locally
   npm run build
   
   # Test production server
   npm start
   ```

3. **Environment Variable Testing**:
   ```bash
   # Add console.log to check environment variables
   console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
   ```

## 📊 Performance Optimization

### Vercel-Specific Optimizations

1. **Function Timeout**:
   - API routes have a 10-second timeout by default
   - Increase in vercel.json if needed:
   ```json
   {
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

2. **Edge Functions** (Optional):
   - Consider using Edge Functions for better performance
   - Move static API routes to Edge Functions

3. **Caching**:
   - Implement proper caching headers
   - Use SWR for client-side caching

## 🔒 Security Best Practices

1. **Environment Variables**:
   - Never commit sensitive data to Git
   - Use Vercel's environment variable encryption
   - Rotate secrets regularly

2. **MongoDB Security**:
   - Use strong passwords
   - Restrict network access when possible
   - Enable MongoDB Atlas security features

3. **JWT Security**:
   - Use long, random secrets
   - Set appropriate expiration times
   - Implement proper token refresh

## 📱 Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] All pages are accessible
- [ ] Authentication works correctly
- [ ] Database operations function properly
- [ ] API routes respond correctly
- [ ] Mobile responsiveness works
- [ ] Environment variables are set correctly
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active
- [ ] Performance is acceptable

## 🆘 Support

If you encounter issues:

1. **Check Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
2. **MongoDB Atlas Support**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
3. **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
4. **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**Note**: Keep your environment variables secure and never share them publicly. Consider using Vercel's preview deployments for testing before deploying to production. 