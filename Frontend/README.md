# Frontend - Product Management System

A modern React frontend for the Product Management system with proper code organization and component structure.

## 📁 Project Structure

```
Frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Login.js         # Login form component
│   │   ├── Register.js      # Registration form component
│   │   ├── Header.js        # App header with user info
│   │   ├── ProductList.js   # Product listing component
│   │   ├── ProductCard.js   # Individual product card
│   │   ├── ProductForm.js   # Product creation form
│   │   └── *.css           # Component-specific styles
│   ├── context/            # React Context for state management
│   │   └── AuthContext.js  # Authentication context
│   ├── services/           # API communication layer
│   │   └── apiService.js   # Backend API service
│   ├── utils/              # Utility functions and constants
│   │   ├── constants.js    # App constants
│   │   └── helpers.js      # Helper functions
│   ├── App.js              # Main app component
│   ├── App.css             # Global styles
│   └── index.js            # App entry point
├── package.json
└── README.md
```

## 🚀 Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Make sure your backend is running on `http://localhost:5000`**

3. **Start the frontend:**

```bash
npm start
```

The app will open at `http://localhost:3000`

## ✨ Features

### Authentication

- **Login/Register** with email and password
- **Role-based access control** (Admin, Employee, Customer)
- **JWT token authentication** with automatic persistence
- **Protected routes** based on user roles

### Product Management

- **View all products** with detailed information
- **Create new products** (Admin/Employee only)
- **Delete products** (Admin/Employee only)
- **Real-time updates** after operations
- **Responsive design** for all screen sizes

### User Experience

- **Modern UI/UX** with clean design
- **Loading states** and error handling
- **Form validation** and user feedback
- **Mobile responsive** layout

## 🎯 Usage

### For Admins/Employees:

1. **Login** with admin/employee credentials
2. **Create products** using the "Add Product" button
3. **Delete products** by clicking the × button on product cards
4. **Manage** the entire product catalog

### For Customers:

1. **Login** with customer credentials
2. **View products** in the catalog
3. **Browse** product details and information

## 🔧 Technical Details

### Architecture

- **Component-based** React architecture
- **Context API** for global state management
- **Service layer** for API communication
- **Utility functions** for common operations

### State Management

- **AuthContext** manages authentication state
- **Local storage** for token persistence
- **Component state** for UI interactions

### API Integration

- **RESTful API** communication
- **JWT token** authentication
- **Error handling** and user feedback
- **Loading states** for better UX

## 🎨 Styling

- **CSS Modules** for component-specific styles
- **Responsive design** with mobile-first approach
- **Modern UI** with clean typography and spacing
- **Consistent color scheme** and branding

## 🔒 Security

- **JWT token** authentication
- **Role-based access control**
- **Protected API endpoints**
- **Input validation** and sanitization
