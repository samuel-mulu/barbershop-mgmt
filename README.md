# Barbershop Management System

A modern, responsive web application for managing barbershop operations including branches, staff, services, and reports.

## 🚀 Features

- **Multi-role Dashboard**: Owner, Admin, Barber, and Washer dashboards
- **Branch Management**: Create and manage multiple barbershop branches
- **Staff Management**: Manage staff across different roles and branches
- **Service Operations**: Track pending and completed services
- **Reports & Analytics**: View detailed reports for staff performance
- **Modern UI**: Responsive design with glass morphism effects
- **Ethiopian Calendar**: Localized date display
- **Real-time Updates**: Live data updates using SWR

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Lucide React Icons
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **State Management**: SWR for data fetching
- **UI Components**: Radix UI, Custom Components

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Vercel account (for deployment)

## 🔧 Local Development

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd barbershop-mgmt
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?retryWrites=true&w=majority

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🚀 Vercel Deployment

### 1. Prepare for Deployment

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository
2. **Environment Variables**: Prepare your environment variables

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts to configure your project
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables
5. Deploy

### 3. Environment Variables Setup in Vercel

In your Vercel project dashboard, add these environment variables:

```
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 4. MongoDB Atlas Configuration

1. **Network Access**: Add `0.0.0.0/0` to allow connections from anywhere (or Vercel's IP ranges)
2. **Database User**: Create a database user with read/write permissions
3. **Connection String**: Use the connection string from MongoDB Atlas

## 📱 Application Structure

```
app/
├── api/                    # API routes
│   ├── auth/              # Authentication endpoints
│   ├── branches/          # Branch management
│   ├── users/             # User management
│   └── ...
├── dashboard/             # Dashboard pages
│   ├── admin/            # Admin dashboard
│   ├── barber/           # Barber dashboard
│   ├── washer/           # Washer dashboard
│   └── owner/            # Owner dashboard
├── components/           # Reusable components
├── lib/                  # Utility functions
├── models/               # MongoDB models
└── utils/                # Helper functions
```

## 🔐 Authentication

The application uses JWT-based authentication with the following roles:
- **Owner**: Full access to all features
- **Admin**: Branch-specific management
- **Barber**: Service operations and earnings
- **Washer**: Service operations and earnings

## 📊 Features by Role

### Owner Dashboard
- Manage multiple branches
- View staff across all branches
- Access comprehensive reports
- Create and manage services

### Admin Dashboard
- Manage branch-specific staff
- View service operations
- Track pending and completed services
- Manage service pricing

### Barber/Washer Dashboard
- View assigned services
- Track earnings
- Update service status
- View operation history

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Glass Morphism**: Modern visual effects
- **Dark/Light Mode**: Adaptive theming
- **Smooth Animations**: Enhanced user experience
- **Ethiopian Calendar**: Localized date display
- **Real-time Updates**: Live data synchronization

## 🔧 Build Commands

```bash
# Development
npm run dev

# Production Build
npm run build

# Start Production Server
npm start

# Linting
npm run lint
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret | Yes |

## 🚨 Security Considerations

- **Environment Variables**: Never commit sensitive data to version control
- **MongoDB Security**: Use strong passwords and restrict network access
- **JWT Secrets**: Use cryptographically secure random strings
- **Input Validation**: All user inputs are validated
- **Authentication**: JWT tokens with expiration

## 📞 Support

For support or questions:
- Create an issue in the GitHub repository
- Contact the development team

## 📄 License

This project is licensed under the MIT License.

---

**Note**: Make sure to replace placeholder values (like `your_username`, `your_password`, etc.) with your actual credentials before deployment.
