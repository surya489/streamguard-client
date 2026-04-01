# StreamGuard Frontend

## 1. Project Summary
I built this frontend using React + Vite for a video moderation workflow.
It covers authentication, upload, realtime processing updates, video listing, admin controls, and playback.

## 2. Assignment Coverage (Frontend)
- User-friendly video upload with progress indicators: Implemented
- Dynamic display of processing status and progress: Implemented
- Comprehensive list of uploaded videos with status indicators: Implemented
- Integrated video playback for processed content: Implemented
- Cross-platform and intuitive UI behavior: Implemented (responsive layout + mobile sidebar)

## 3. Tech Stack
- React 19
- TypeScript
- Vite
- React Router
- Socket client
- Lucide icons

## 3.1 What I Used and Why
- React + TypeScript:
  I used this combination to keep UI state predictable and reduce runtime bugs with strong typing.
- Vite:
  I used Vite for fast local startup and smooth iteration while building multiple pages and admin flows.
- React Router:
  I used nested routes for clean separation between auth pages and protected dashboard modules.
- Context API (Auth + Toast):
  I used Auth context for centralized token/user state and Toast context for consistent feedback UX.
- Socket Client:
  I used sockets to update processing status in realtime without requiring manual page refresh.
- Fetch/XHR:
  I used `fetch` for standard API calls and `XMLHttpRequest` for upload progress percentage tracking.
- Custom CSS system:
  I used a token-based CSS theme to keep the visual language consistent across dashboard, admin, and auth pages.

## 4. How It Works
1. I authenticate the user with login/register.
2. I store session token in auth context.
3. Upload page sends `multipart/form-data` to backend `POST /api/video/upload`.
4. Upload page shows overlay loader + upload percentage.
5. Dashboard and Videos pages connect to socket and consume realtime events.
6. Videos page shows status/sensitivity/progress and allows in-page playback from stream URL.
7. Admin pages support user monitoring and role actions.

## 5. Folder Structure
- `src/pages` screen-level pages
- `src/components` shell and shared UI
- `src/context` auth and toast state
- `src/services` API and socket clients
- `src/types` shared TypeScript models
- `src/utils` helper utilities
- `src/config` environment configuration

## 6. Environment Variables
Use this exact format in `.env` files.

Frontend (`streamguard-client/.env`):
```env
API_BASE_URL=API_BASE_URL
```

Frontend value examples:
```env
API_BASE_URL=YOUR_LOCAL_BACKEND_URL
# or
API_BASE_URL=YOUR_DEPLOYED_LINK
```

## 7. Setup and Run
```bash
npm install
npm run dev
```

App runs by default at:
- `http://localhost:5173` (or next available Vite port)

## 8. Build and Preview
```bash
npm run build
npm run preview
```

## 9. Scripts
- `npm run dev` start development server
- `npm run build` compile + production build
- `npm run lint` run ESLint
- `npm run preview` preview built app

## 10. Realtime Events Used
- `video:progress`
- `video:completed`
- `admin:user-created`
- `admin:user-role-updated`
- `admin:video-uploaded`

## 11. Major Frontend Features
- Authentication pages with validation and password show/hide
- Protected app shell with responsive sidebar/hamburger
- Dashboard with modern cards, activity section, and recent uploads
- Upload page with file validation, overlay loader, and progress %
- Videos page with filter controls, status chips, and stream playback
- Admin users table with role menu, filters, pagination, and profile links
- Admin user detail page with summary cards and user-specific videos
- Toast-based API feedback handling

## 11.1 Sensitivity Output (How I Handle It)
- Possible values:
  - `SAFE`
  - `FLAGGED`
  - `PENDING` (shown in UI until processing completes)
- How it works in UI:
  - I receive sensitivity through realtime `video:progress` / `video:completed` events.
  - I update local video state immediately, so badges/chips change without refresh.
  - I map each value to clear visual indicators:
    - `SAFE` -> green chip
    - `FLAGGED` -> red chip
    - `PENDING` -> neutral chip
- Where it appears:
  - Dashboard recent uploads
  - Videos page cards
  - Admin user detail sensitivity summary

## 12. API Usage (Frontend Side)
- `POST /api/auth/register`
  I call this from the signup screen to create a new user account with role-aware backend defaults.
- `POST /api/auth/login`
  I call this from login, receive JWT token, then hydrate auth context and route to dashboard.
- `GET /api/user/me`
  I call this to fetch current profile details and keep sidebar/profile pages in sync.
- `PUT /api/user/profile`
  I call this to update editable profile fields (name/email) with frontend validation.
- `PUT /api/user/password`
  I call this from secure password modal with current/new/confirm validation flow.
- `POST /api/video/upload`
  I call this from upload page using `multipart/form-data`; I display upload overlay + percent and success/error toast.
- `GET /api/video`
  I call this to render dashboard and video library; I pass filters for status/sensitivity/search/sort/all.
- `GET /api/video/stream/:id`
  I bind this URL to HTML5 `<video>` for protected playback with tokenized access.
- `GET /api/user` (admin)
  I call this in admin users page to render user table, counts, and management data.
- `PUT /api/user/role` (admin)
  I call this from role action menu to change selected user role with confirmation.

## 12.1 API Flow
- `/api/auth/login`:
  Converts credentials into a session token; this token powers all protected pages.
- `/api/video/upload`:
  Starts the moderation lifecycle; upload response + socket events together drive the realtime UX.
- `/api/video`:
  Serves as the data backbone for dashboard metrics, recent uploads, and full library listing.
- `/api/video/stream/:id`:
  Completes the journey by enabling secure media playback once processing is available.
- `/api/user/role`:
  Demonstrates RBAC control flow and admin-level operational management.

## 13. Notes
- I currently target backend local environment by default.
- Backend storage is currently local `uploads/` path.
- AWS-related backend code is kept for future switch-back, but not active now.

## 14. Testing
- Frontend automated test files are not added yet in this submission.
- I validated this frontend using:
  - type-safe build (`npm run build`)
  - route-level/manual flow checks (auth, upload, videos, admin, profile)
- This helps me verify:
  - no TypeScript build break
  - no production bundling errors
  - end-to-end UI flow behavior against backend APIs

## 15. Troubleshooting
- If API fails, I verify `API_BASE_URL` in `.env`.
- If upload fails, I verify backend is running and upload route is reachable.
- If socket updates do not appear, I verify backend socket server and token auth.
- If video playback fails, I verify stream endpoint and backend file availability.

