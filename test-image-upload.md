# Image Upload Test Guide

## Test Steps

### 1. Set up Cloudinary Environment Variables
Add these to your `.env.local` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Test Image Upload API
```bash
# Test the upload endpoint (replace with your actual token)
curl -X POST http://localhost:3001/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg"
```

### 3. Test Admin Dashboard
1. Go to http://localhost:3001/dashboard/admin
2. Select "Mobile Banking (Telebirr)" as payment method
3. Upload an image
4. Complete a service operation
5. Check the history to see if the image appears

### 4. Check Console Logs
Look for these debug messages:
- "🔍 Payment image URL before creating operations:"
- "🔍 Created barber operation with image:"
- "🔍 Final admin service operations to send:"
- "🔍 Payment image URL from operation:"
- "🔍 Created admin service operation with payment image:"

### 5. Check Database
Verify that the `paymentImageUrl` field is saved in the database.

## Expected Results
- Image upload should work without upload preset
- Payment image URL should be saved to database
- History should show "📸 View" button for mobile banking payments
- Clicking "📸 View" should open the image in a new tab
