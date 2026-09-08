# TenetFlow

🚀 **Live Demo:** [https://wazeefa1.vercel.app/](https://wazeefa1.vercel.app/)

TenetFlow is a multi-tenant project management application designed to allow organizations to seamlessly manage their projects and users with robust, role-based access control.

---

## Features Implemented

- ✅ **Multi-Tenant Architecture:** Ensures data isolation across different organizations (tenants).
- ✅ **Role-Based Access Control (RBAC):** Flexible permission system distinguishing between `SUPER_ADMIN`, `ADMIN`, and standard `AGENT` roles.
- ✅ **Authentication & Authorization:** Secure JWT-based authentication.
- ✅ **Project & User Management:** Complete CRUD capabilities for managing projects and assigning users.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database / ORM:** PostgreSQL, Prisma
- **Validation:** Zod
- **Infrastructure:** Docker (for PostgreSQL)

---

## Getting Started

Follow these steps to run the application locally on your machine.

### Prerequisites
- Node.js (v18 or higher)
- Docker & Docker Compose (for the PostgreSQL database)

### 1. Database Setup
Start the local PostgreSQL database using Docker:
```bash
docker-compose up -d
```

### 2. Backend Setup
Navigate to the `backend` directory, install dependencies, and run the server:
```bash
cd backend
npm install

# Create a .env file based on the provided .env.example (if applicable)
# Run Prisma migrations to set up the schema
npx prisma migrate dev

# Start the backend server
npm run dev
```

### 3. Frontend Setup
In a new terminal window, navigate to the `frontend` directory, install dependencies, and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```

---

## Test Credentials

To quickly test the application without registering, use the following seeded test accounts:

**Super Admin Account:**
- **Email:** `superadmin@example.com`
- **Password:** `password123` *(Assuming default seed password)*

---

## Assumptions & Design Choices

First off, the provided requirements were incredibly clear and easy to understand, which helped a ton in tracking the overall flow of the app. While building this out based on those requirements, I did have to make a few assumptions to keep things moving. I wanted to document the major ones here:

**1. The "Delete" Option**
I went back and forth on how to handle deleting data (like users or tasks). At first, I thought about just hard-deleting records from the database. But I realized that doing that would completely mess up the history of past projects—if a user is gone, all their past project records would break. So, I decided to assume a "soft delete" approach. Instead of actually deleting the data, we just mark it as inactive. That way, the UI stays clean, but we keep all the historical data intact.

**2. Roles and Permissions**
I assumed we'd eventually need more than just a basic user role, so I set up a dynamic role-based access control (RBAC) system. The `ADMIN` role automatically gets full permissions without having to hardcode every single rule.

**3. API Errors**
I assumed the frontend shouldn't have to deal with messy database errors, so I set up a centralized error handler. It catches things like Prisma validation errors and turns them into clean HTTP responses (like 400 or 404).

---

## Future Improvements

If I had more time to expand on this project, I would implement the following:
- **Comprehensive Unit Testing:** Add tests for critical API routes and React components using Jest and React Testing Library.
- **Pagination & Sorting:** Implement server-side pagination for the projects and users tables to handle large datasets more efficiently.
- **Caching Layer:** Integrate Redis to cache frequently accessed data, such as permissions and tenant details, to reduce database load.
