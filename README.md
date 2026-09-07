# TenetFlow

## Assumptions & Design Choices

First off, the provided requirements were incredibly clear and easy to understand, which helped a ton in tracking the overall flow of the app. While building this out based on those requirements, I did have to make a few assumptions to keep things moving. I wanted to document the major ones here:

**1. The "Delete" Option**
I went back and forth on how to handle deleting data (like users or tasks). At first, I thought about just hard-deleting records from the database. But I realized that doing that would completely mess up the history of past projects—if a user is gone, all their past project records would break. So, I decided to assume a "soft delete" approach. Instead of actually deleting the data, we just mark it as inactive. That way, the UI stays clean, but we keep all the historical data intact.

**2. Roles and Permissions**
I assumed we'd eventually need more than just a basic user role, so I set up a dynamic role-based access control (RBAC) system. The `ADMIN` role automatically gets full permissions without having to hardcode every single rule.

**3. API Errors**
I assumed the frontend shouldn't have to deal with messy database errors, so I set up a centralized error handler. It catches things like Prisma validation errors and turns them into clean HTTP responses (like 400 or 404).
