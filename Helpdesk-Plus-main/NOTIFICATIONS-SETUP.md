# Helpdesk+ notification system

## What was added
- `frontend/src/notification.js`: reusable notification helper and notification-center component.
- `frontend/src/notification.css`: styling for the bell, unread counter, recent-notifications panel, and toast messages.
- `frontend/src/App.jsx`: imports the component and sends notifications after ticket creation, updates, assignment, comments, resolution, closure, and reopening.
- `frontend/src/App.css`: positions the notification center in the dashboard.

## Run Helpdesk+
1. Open a terminal in `Helpdesk-Plus-main/frontend`.
2. Run `npm install` (or `npm ci` if you want to use the lock file).
3. Run `npm run dev`.
4. In another terminal, open `Helpdesk-Plus-main/backend`.
5. Run `npm install`, configure the database connection in the backend as needed, then run `npm start` if that script is configured. If not, run `node server.js`.
6. Open the frontend URL printed by Vite and sign in to test ticket notifications.

Notifications are currently frontend-session notifications: they appear as toast messages and are kept in the notification panel while the page remains open. They are not yet saved in MongoDB and do not push notifications to users who are offline or using another browser.
