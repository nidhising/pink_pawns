"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
    
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("gameCreated", ({ roomId, playerColor }: { roomId: string, playerColor: PlayerColor }) => {
      console.log("Event: gameCreated", { roomId, playerColor });
      setRoomId(roomId);
      setPlayerColor(playerColor);
      setGameState("waiting");
    });
    
    socket.on("gameJoined", ({ roomId, playerColor }: { roomId: string, playerColor: PlayerColor }) => {
        console.log("Event: gameJoined", { roomId, playerColor });
        setRoomId(roomId);
        setPlayerColor(playerColor);
        setGameState("playing");
    });

    socket.on("playerJoined", () => {
      console.log("Event: playerJoined");
      setGameState("playing");
    });

    socket.on("error", (message: string) => {
      console.error("Event: error", message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setGameState("initial");
    });

    return () => {
      socket.off("connect");
      socket.off("gameCreated");
      socket.off("gameJoined");
      socket.off("playerJoined");
      socket.off("error");
    };
  }, [socket, toast]);

  const handleCreateGame = () => {
    console.log("Create Game clicked");
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
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background font-body p-4">
      <Toaster />
       <div className="hidden lg:block absolute top-6 right-6 z-10">
        <iframe
            style={{borderRadius: "12px"}}
            src="https://open.spotify.com/embed/playlist/7zf6Lywzjh04EL4VSXtD27?utm_source=generator&theme=0"
            width="300"
            height="152"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
      </div>
      <header className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-4"
        >
          <img
            src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHB0ZGw3dG0wZmltZXpnd2ljd3htZnEwMnI5a2E1anZkeTR3dTB4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sQCeaQAU0F5Eht2med/giphy.gif"
            alt="Floating unicorn"
            className="w-32 h-32"
          />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl font-bold text-primary font-headline" style={{ textShadow: '2px 2px 4px hsla(var(--primary), 0.3)' }}
        >
          Pink Pawns
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-muted-foreground mt-2"
        >
          A cute real-time chess game
        </motion.p>
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
              <div className="mt-8 lg:hidden">
                <iframe
                  style={{borderRadius: "12px"}}
                  src="https://open.spotify.com/embed/playlist/7zf6Lywzjh04EL4VSXtD27?utm_source=generator&theme=0"
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                ></iframe>
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
      <footer className="mt-12 text-center text-muted-foreground">
        <p>Made with ❤️ ☕ 🥐 by Nidhi Singh</p>
      </footer>
    </div>
  );
}
