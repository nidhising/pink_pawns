const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your frontend's URL
    methods: ['GET', 'POST'],
  },
});

const games = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createGame', () => {
    const roomId = uuidv4();
    socket.join(roomId);
    games[roomId] = {
      players: { white: socket.id, black: null },
      fen: 'start',
      moves: [],
    };
    socket.emit('gameCreated', { roomId, playerColor: 'w' });
  });

  socket.on('joinGame', (roomId) => {
    if (games[roomId]) {
      if (games[roomId].players.black) {
        socket.emit('error', 'Game is full');
        return;
      }
      socket.join(roomId);
      games[roomId].players.black = socket.id;

      io.to(roomId).emit('playerJoined', {
        roomId,
        players: games[roomId].players,
      });

      socket.emit('gameJoined', { roomId, playerColor: 'b' });
    } else {
      socket.emit('error', 'Game not found');
    }
  });

  socket.on('move', ({ roomId, move }) => {
    if (games[roomId]) {
      games[roomId].fen = move.after;
      games[roomId].moves.push(move);
      socket.to(roomId).emit('opponentMove', { move, moves: games[roomId].moves });
    }
  });

  socket.on('resign', (roomId) => {
    if (games[roomId]) {
        const winner = games[roomId].players.white === socket.id ? 'b' : 'w';
        io.to(roomId).emit('gameEnded', { winner, reason: 'Resignation' });
        delete games[roomId];
    }
  });

  socket.on('offerDraw', (roomId) => {
      socket.to(roomId).emit('drawOffered');
  });

  socket.on('acceptDraw', (roomId) => {
      if (games[roomId]) {
          io.to(roomId).emit('gameEnded', { winner: 'draw', reason: 'Agreement' });
          delete games[roomId];
      }
  });


  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomId in games) {
      const game = games[roomId];
      if (Object.values(game.players).includes(socket.id)) {
        // Notify other player
        socket.to(roomId).emit('gameEnded', { reason: 'Opponent disconnected' });
        // Clean up game
        delete games[roomId];
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});
