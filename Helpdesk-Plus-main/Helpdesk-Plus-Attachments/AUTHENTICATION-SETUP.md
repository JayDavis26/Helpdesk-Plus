# Helpdesk+ Authentication Setup

## 1. Configure backend/.env
Copy `.env.example` to `.env` and set:
- `MONGO_URI`: your MongoDB Atlas connection string.
- `AUTH_TOKEN_SECRET`: a private random string with at least 32 characters.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: optional, but set both to provision an administrator account. Admin password must be at least 12 characters.

Do not commit `.env` to GitHub. Do not use the example credentials as real credentials.

## 2. Start backend
From the `backend` folder:
```bash
npm install
node server.js
```

## 3. Start frontend
From the `frontend` folder:
```bash
npm install
npm run dev
```

## How sign-in works
- Users must create an account before signing in.
- Login checks the email and password against the MongoDB `users` collection.
- Passwords are stored as salted scrypt hashes, not plain text.
- Public account creation always creates a regular User; the page does not allow a visitor to choose Administrator or Support Agent.
- An initial Administrator is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` at backend startup if that email is not already registered. Keep the credentials secret.
- The email is checked for valid syntax, but inbox ownership is not verified. True email verification requires an email delivery provider and a verification link.
- This adds server-side authentication for the login/register flow. Existing ticket API endpoints are not yet protected by authentication middleware; add that before deploying publicly.
