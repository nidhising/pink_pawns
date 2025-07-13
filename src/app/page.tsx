"use client";

import { useState, useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Crown, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Game from "@/components/Game";

// In a real app, use environment variables for the server URL
const SOCKET_SERVER_URL = "http://localhost:3001";

type GameState = "initial" | "creating" | "waiting" | "joining" | "playing";
type PlayerColor = "w" | "b";

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>("initial");
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // We defer the socket connection to useEffect to ensure it only runs on the client.
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
    });

    newSocket.on("gameCreated", ({ roomId, playerColor }: { roomId: string, playerColor: PlayerColor }) => {
      setRoomId(roomId);
      setPlayerColor(playerColor);
      setGameState("waiting");
    });
    
    newSocket.on("gameJoined", ({ roomId, playerColor }: { roomId: string, playerColor: PlayerColor }) => {
        setRoomId(roomId);
        setPlayerColor(playerColor);
        setGameState("playing");
    });

    newSocket.on("playerJoined", () => {
      setGameState("playing");
    });

    newSocket.on("error", (message: string) => {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setGameState("initial");
    });

    return () => {
      newSocket.disconnect();
    };
  }, [toast]);

  const handleCreateGame = () => {
    socket?.emit("createGame");
    setGameState("creating");
  };

  const handleJoinGame = () => {
    if (joinRoomId.trim()) {
      socket?.emit("joinGame", joinRoomId.trim());
      setGameState("joining");
    } else {
      toast({
        title: "Error",
        description: "Please enter a Game ID.",
        variant: "destructive",
      });
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Copied!",
      description: "Game ID copied to clipboard.",
    });
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background font-body p-4">
      <Toaster />
      <header className="text-center mb-8">
        <h1 className="text-6xl font-bold text-primary font-headline" style={{ textShadow: '2px 2px 4px hsla(var(--primary), 0.3)' }}>
          Pink Pawns
        </h1>
        <p className="text-muted-foreground mt-2">A cute real-time chess game</p>
      </header>

      <main className="w-full max-w-md lg:max-w-none">
        <AnimatePresence mode="wait">
          {gameState === "initial" && (
            <motion.div
              key="initial"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="space-y-4 max-w-md mx-auto"
            >
              <Button onClick={handleCreateGame} className="w-full h-14 text-xl hover:scale-105 transition-transform" size="lg">
                <Crown className="mr-2" /> Create Game
              </Button>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Enter Game ID"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="h-14 text-lg"
                />
                <Button onClick={handleJoinGame} className="h-14 text-xl hover:scale-105 transition-transform" size="lg">
                  <Users className="mr-2" /> Join
                </Button>
              </div>
            </motion.div>
          )}

          {(gameState === "waiting" || gameState === "creating" || gameState === "joining") && (
            <motion.div
              key="waiting"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md mx-auto"
            >
              {gameState === "waiting" ? (
                <>
                  <h2 className="text-2xl font-semibold mb-4">Game Created!</h2>
                  <p className="mb-4 text-muted-foreground">Share this Game ID with your friend:</p>
                  <div className="flex items-center justify-center space-x-2 p-3 bg-secondary rounded-md">
                    <span className="font-mono text-lg">{roomId}</span>
                    <Button variant="ghost" size="icon" onClick={handleCopyToClipboard}>
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center space-x-2 mt-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                     <p className="text-lg">Waiting for opponent...</p>
                  </div>
                </>
              ) : (
                 <div className="flex items-center justify-center space-x-2 mt-8 h-40">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                     <p className="text-lg">
                        {gameState === "creating" && "Creating your game..."}
                        {gameState === "joining" && "Joining game..."}
                    </p>
                  </div>
              )}
            </motion.div>
          )}

          {gameState === "playing" && socket && playerColor && (
             <motion.div
              key="playing"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="w-full"
            >
              <Game socket={socket} roomId={roomId} playerColor={playerColor} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
