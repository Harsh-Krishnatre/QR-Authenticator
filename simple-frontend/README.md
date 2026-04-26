# Simple Frontend - SecureAuth Login

This frontend is now a Vite React application with route-based pages for each step of the login flow.

## Flow

1. `/` - Email verification page
2. `/scan` - QR scanner page
3. `/pattern` - Number-color pattern page
4. `/profile` - Authenticated session summary

Route guards prevent users from moving forward until the current step succeeds.

## Run

```bash
./run.sh 3000
```

The script installs dependencies if needed and starts the Vite dev server on the requested port.

## Project Structure

- `src/App.jsx` - Router and guarded routes
- `src/context/AuthFlowContext.jsx` - Shared auth flow state
- `src/pages/` - One page component per step
- `src/components/` - Shared layout, guards, progress, and pattern editor
- `src/lib/api.js` - Backend API helper

## Configuration

To change the backend API URL, edit `API_BASE_URL` in `src/lib/api.js`.

## Build

```bash
npm run build
```
