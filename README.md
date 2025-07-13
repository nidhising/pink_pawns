# Pink Pawns

This is a real-time chess app built with Next.js, Tailwind CSS, and Socket.IO. It's structured as a monorepo with a `frontend` and `backend` workspace.

## Getting Started

First, install all dependencies for both workspaces:

```bash
npm run install-all
```

Then, you can run both the frontend and backend concurrently:

```bash
npm run dev
```

This will start:
1.  **The Socket.IO server** in the `backend` workspace, usually on `http://localhost:3001`.
2.  **The Next.js frontend** in the `frontend` workspace, usually on `http://localhost:9002`.

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

You can create a new game, copy the game ID, and open a new browser tab or window to join the game with that ID.
