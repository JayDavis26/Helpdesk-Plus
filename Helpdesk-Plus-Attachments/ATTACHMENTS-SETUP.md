# Helpdesk+ attachments setup

## Backend
1. Open a terminal in `backend`.
2. Run `npm.cmd install` on Windows (or `npm install` on macOS/Linux).
3. Start with `node server.js`.

The backend loads `backend/.env` explicitly. Keep `.env` private and do not commit it to GitHub. The connection credential included at the user's request should be rotated if it is real because it has been shared in a chat.

## Frontend
1. Open a second terminal in `frontend`.
2. Run `npm.cmd install`.
3. Run `npm.cmd run dev`.

The create-ticket form accepts up to 5 attachments, 10 MB each. The actual files are saved under `backend/uploads`, while metadata is stored with the ticket in MongoDB. Supported extensions: PDF, PNG/JPG/GIF/WEBP, TXT, CSV, DOC/DOCX, XLS/XLSX, PPT/PPTX, ZIP, and LOG.
