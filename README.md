# Authentication System

Centralized authentication system used for the College Project. This repository contains:

- `Backend/` — Node.js + Express authentication API (MongoDB, JWT, bcrypt, validation and security middleware).
- `Frontend/` — (separate) frontend application that consumes the backend API.

This top-level README documents common information and quick start steps. Backend-specific docs and API details are in [Backend/README.md](Backend/README.md).

**Quick links**
- Backend docs: [Backend/README.md](Backend/README.md)
- Backend source: [Backend/src](Backend/src)

**Supported on:** macOS, Linux, Windows (with Node.js and MongoDB installed)


## Common prerequisites

- Node.js 18+ (recommended)
- npm (or yarn)
- MongoDB (local or remote) — connection string configured via environment variables

## Quick start (backend)

1. Open a terminal and change into the backend folder:

```bash
cd Backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in `Backend/` (copy from `.env.example` if present) and set required variables (see Backend docs for full list).

4. Start the server:

```bash
# development (with nodemon if available)
npm run dev

# production
npm start
```

5. Run tests from the root or backend folder:

```bash
cd Backend
npm test
```

## Environment variables (common)

The backend relies on environment variables to configure database connectivity, secrets and behavior. Typical variables:

- `NODE_ENV` — `development|production`
- `PORT` — HTTP port (e.g. `5000`)
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWTs (required)
- `JWT_EXPIRE` — expiration for JWTs (e.g. `7d`)
- `BCRYPT_SALT_ROUNDS` — salt rounds for bcrypt (recommended `10-12`)
- `FRONTEND_URL` — allowed CORS origin for the frontend

See [Backend/README.md](Backend/README.md#environment-variables) for the full variable list.

## Contributing

If you plan to contribute:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a PR with a clear description

## License

This project is licensed under the MIT License.

---
If you want, I can also update the `Frontend/README.md` (if you provide frontend details) or run the backend tests locally and report results. Which would you like next?