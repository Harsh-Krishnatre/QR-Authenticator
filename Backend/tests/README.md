# Test payloads and example requests

This folder contains example JSON payloads and a script to exercise the authentication API endpoints locally.

How to use
- Start the backend server (ensure `PORT` is set or default is 3000 in your environment).
- From the `Backend` folder run the script:

```bash
./scripts/test-requests.sh
```

Or invoke with a custom base URL:

```bash
./scripts/test-requests.sh http://localhost:4000/api/v1/auth
```

Notes
- The `submit_pattern.json` file contains a placeholder for `hashedSecretCode` — after registering in `test` environment, copy the `hashedSecretCode` returned by `/register` into the payload before running the `submit-pattern` request.
- The cleanup endpoint is intended to be admin-protected in production; the example simply demonstrates the request shape.
