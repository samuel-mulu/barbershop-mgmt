# Cloudinary Setup Guide

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Getting Cloudinary Credentials

1. **Sign up for Cloudinary**: Go to [cloudinary.com](https://cloudinary.com) and create a free account

2. **Get your credentials**:
   - Go to your Dashboard
   - Copy your Cloud Name, API Key, and API Secret

3. **No Upload Preset Required**:
   - We're using server-side uploads, so no upload preset is needed
   - The API will handle all uploads securely

## Example Configuration

```env
CLOUDINARY_CLOUD_NAME=mybarbershop
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Security Notes

- Keep your API Secret secure and never expose it in client-side code
- Use environment variables for all Cloudinary credentials
- Consider using signed uploads for additional security in production

## Testing

After setting up the environment variables:

1. Start your development server: `npm run dev`
2. Go to the admin dashboard
3. Select "Mobile Banking (Telebirr)" as payment method
4. Try uploading an image to test the integration
