"use client";

import { useState, useEffect, useMemo } from "react";
import type { Socket } from "socket.io-client";
import { Chess } from "chess.js";
import type { Move } from "chess.js";
import { motion } from "framer-motion";
import { Chessboard } from "react-chessboard";
import type { Piece, Square } from "react-chessboard/dist/chessboard/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface GameProps {
  socket: Socket;
  roomId: string;
  playerColor: "w" | "b";
}

export default function Game({ socket, roomId, playerColor }: GameProps) {
  const game = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(game.fen());
  const [moves, setMoves] = useState<Move[]>([]);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [status, setStatus] = useState("Game starts. It's White's turn.");
  const [gameOver, setGameOver] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    socket.on("opponentMove", ({ move, moves: serverMoves }: { move: Move, moves: Move[] }) => {
      const validMove = game.move(move);
      if (validMove) {
        setFen(game.fen());
        setMoves(serverMoves);
        updateStatus();
      }
    });
    
    socket.on("gameEnded", ({ reason, winner }: { reason: string, winner?: 'w' | 'b' | 'draw' }) => {
        setGameOver(true);
        let message = `Game over: ${reason}.`;
        if (winner) {
            if (winner === 'draw') {
                message = `Game ended in a draw by ${reason.toLowerCase()}.`
            } else {
                message = winner === playerColor ? "You won!" : "You lost.";
                message += ` by ${reason.toLowerCase()}.`
            }
        }
        setStatus(message);
    });

    socket.on("drawOffered", () => {
        // For simplicity, we can use a toast to notify about the draw offer.
        // A more complex implementation would use a dialog.
        toast({ 
            title: "Draw Offered", 
            description: "Your opponent has offered a draw. You can accept in the game actions.",
            duration: 10000 
        });
    });

    return () => {
      socket.off("opponentMove");
      socket.off("gameEnded");
      socket.off("drawOffered");
    };
  }, [socket, game, playerColor, toast]);

  function updateStatus() {
    let newStatus = `Turn: ${game.turn() === 'w' ? 'White' : 'Black'}`;

    if (game.isCheckmate()) {
      newStatus = `Checkmate! ${game.turn() === 'b' ? 'White' : 'Black'} wins.`;
      setGameOver(true);
    } else if (game.isDraw()) {
      newStatus = 'The game is a draw.';
      setGameOver(true);
    } else if (game.isCheck()) {
      newStatus += ' - Check!';
    }
    
    setTurn(game.turn());
    setStatus(newStatus);
  }

  function onDrop(sourceSquare: Square, targetSquare: Square, piece: Piece) {
    if (game.turn() !== playerColor || gameOver) {
        return false;
    }
    
    try {
      const moveAttempt = {
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to a queen for simplicity
      };
      const moveResult = game.move(moveAttempt);

      if (moveResult === null) {
        toast({ title: "Invalid Move", variant: "destructive" });
        return false; // illegal move
      }

      setFen(game.fen());
      const newMoves = [...moves, moveResult];
      setMoves(newMoves);
      updateStatus();
      
      socket.emit("move", { roomId, move: moveResult });
      return true;
    } catch (e) {
      toast({ title: "Invalid Move", description: "An error occurred while making the move.", variant: "destructive" });
      return false;
    }
  }

  const handleResign = () => {
      socket.emit("resign", roomId);
  };

  const handleOfferDraw = () => {
      socket.emit("offerDraw", roomId);
  };

  return (
    <motion.div 
      className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
        <div className="relative w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px] aspect-square">
            {gameOver && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center text-white p-8 bg-primary/80 backdrop-blur-sm rounded-xl">
                        <h2 className="text-3xl font-bold mb-2">Game Over</h2>
                        <p className="text-lg">{status}</p>
                    </div>
                </div>
            )}
            <Chessboard
                position={fen}
                onPieceDrop={onDrop}
                boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                customDarkSquareStyle={{ backgroundColor: "hsl(var(--border))" }}
                customLightSquareStyle={{ backgroundColor: "hsl(var(--background))" }}
                customDropSquareStyle={{ boxShadow: 'inset 0 0 1px 4px hsl(var(--primary))' }}
                boardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                }}
            />
        </div>

      <Card className="w-full max-w-[400px] lg:w-[300px]">
        <CardHeader>
          <CardTitle>Game Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <p>Room ID: <span className="font-mono bg-secondary px-2 py-1 rounded-md text-sm">{roomId}</span></p>
                <p>You are playing as: <span className="capitalize font-bold">{playerColor === 'w' ? 'White' : 'Black'}</span></p>
                <p className={turn === playerColor ? 'font-bold text-primary' : ''}>
                    {turn === playerColor ? "Your Turn" : "Opponent's Turn"}
                </p>
                <p className="text-sm text-muted-foreground h-10">{status}</p>
            </div>
            
            <div className="flex gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={gameOver}>Resign</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to resign?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone and you will lose the game.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResign} className="bg-destructive hover:bg-destructive/90">Resign</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" size="sm" onClick={handleOfferDraw} disabled={gameOver}>Offer Draw</Button>
            </div>

          <div>
            <h3 className="font-semibold mb-2">Move History</h3>
            <ScrollArea className="h-48 w-full rounded-md border p-2">
              <ol className="space-y-1">
                {moves.length === 0 && <li className="text-sm text-muted-foreground">No moves yet.</li>}
                {moves.map((move, index) => (
                  <li key={index} className="text-sm font-mono px-2 py-1 rounded-md even:bg-secondary">
                    {index % 2 === 0 ? `${Math.floor(index / 2) + 1}.` : ''} {move.san}
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
