# **App Name**: Pink Pawns

## Core Features:

- Cute Chessboard: Display a chessboard UI using react-chessboard, styled with a soft pink theme and rounded corners.
- Create Game: Enable users to create a new game, generating a unique UUID-based room ID. Make sure users can copy game ID
- Join Game: Allow players to join an existing game room by pasting the game link or game id into an input field. Implement UI with "Waiting for opponent" screen while connecting.
- Chess Engine: Utilize chess.js to validate moves, manage turn control, and detect check/checkmate scenarios. Provide a basic alert for invalid moves.
- Real-time Sync: Implement real-time move synchronization between players using Socket.IO. Ensure that moves are instantly reflected on both players' boards.
- In-Game Actions: Display player names, indicate the current turn, and include resign/draw buttons for in-game actions.
- Move History: Keep a record of the moves played, updating and showing this log to each player in real-time.

## Style Guidelines:

- Primary color: Soft Pink (#FFB6C1) to create a cute and inviting aesthetic.
- Background color: Pastel Pink (#FFE4E1) for a light and gentle backdrop.
- Accent color: Rose (#FF69B4) for interactive elements and highlights.
- Body and headline font: 'Poppins', a modern rounded sans-serif.
- Use minimalistic icons related to chess moves, styled in a soft pink color palette.
- Center the chessboard with other interactive components (buttons, input field) in a single-column layout. Implement breakpoints so the single-column is enforced on mobile viewports as well.
- Incorporate fade-in animations using Framer Motion for a smooth user experience when transitioning between screens and states.