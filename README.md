# StreamGuard Frontend

React + Vite client for StreamGuard workflow: authentication, upload, realtime processing progress, filtering, and playback.

## Features
- Register + login flow
- Protected dashboard shell
- Upload video (role-gated by backend)
- Realtime progress updates with Socket.io
- Video library filters (`status`, `sensitivity`, `search`, `sort`)
- Secure streaming with tokenized stream URL

## Setup
1. Install dependencies:
```bash
npm install
```
2. Create `.env` (optional):
```env
API_BASE_URL=http://localhost:5000
```
3. Start dev server:
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Project Structure
- `src/context` auth session state
- `src/services` REST + socket clients
- `src/pages` auth/dashboard/upload/videos UI
- `src/components` shell + route guard
- `src/types` shared TypeScript models

## Workflow
1. Login/register
2. Upload video
3. Watch live status/progress updates in dashboard/video library
4. Filter/search video records
5. Play stream in video card player

## Assumptions
- Backend is available at `http://localhost:5000` unless overridden.
- Streaming endpoint expects auth via query token for HTML5 `<video>` URL compatibility.
- Sensitivity status is simulated by backend pipeline stages.
