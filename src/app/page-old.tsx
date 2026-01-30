"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Mic, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({ api: "/api/chat" })
  });
  const [isListening, setIsListening] = useState(false);
  const [OrbState, setOrbState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [error, setError] = useState<string>("");
  const [textInput, setTextInput] = useState("");

  // Helper to get text from message parts
  const getMessageText = (message: any): string => {
    if (!message.parts) return "";
    const textParts = message.parts.filter((p: any) => p.type === "text");
    return textParts.map((p: any) => p.text).join(" ");
  };

  // Voice Synthesis (The Mouth)
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.name.includes("Google US English")) || voices[0];
    utterance.rate = 1.0;
    setOrbState("speaking");
    utterance.onend = () => setOrbState("idle");
    window.speechSynthesis.speak(utterance);
  };

  // Voice Recognition (The Ears)
  const startListening = () => {
    setError("");

    if (!('webkitSpeechRecognition' in window)) {
      setError("Voice recognition not supported. Please use Chrome browser.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Voice recognition started");
      setIsListening(true);
      setOrbState("listening");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Recognized:", transcript);
      setIsListening(false);
      setOrbState("thinking");
      sendMessage({ role: "user", parts: [{ type: "text", text: transcript }] });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setOrbState("idle");

      if (event.error === 'not-allowed') {
        setError("Microphone permission denied. Please allow microphone access.");
      } else if (event.error === 'no-speech') {
        setError("No speech detected. Please try again.");
      } else {
        setError(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log("Voice recognition ended");
      setIsListening(false);
      if (OrbState === "listening") {
        setOrbState("idle");
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError("Failed to start voice recognition");
    }
  };

  // Send text message (for testing)
  const sendTextMessage = () => {
    if (!textInput.trim()) return;
    setOrbState("thinking");
    sendMessage({ role: "user", parts: [{ type: "text", text: textInput }] });
    setTextInput("");
  };

  // Auto-Speak the AI's response
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && status === "ready") {
      const text = getMessageText(lastMessage);
      if (text) speak(text);
    }
  }, [messages, status]);

  const isLoading = status === "submitted";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black text-white p-4">
      {/* --- THE ORB BACKGROUND GLOW --- */}
      <div className="relative flex items-center justify-center">
        {/* Glow effect behind the button */}
        <div
          className={cn(
            "absolute w-64 h-64 rounded-full transition-all duration-500 pointer-events-none",
            OrbState === "idle" && "bg-blue-500/20 blur-3xl",
            OrbState === "listening" && "bg-red-500/40 blur-3xl scale-110 animate-pulse",
            OrbState === "thinking" && "bg-purple-500/40 blur-3xl scale-105 animate-pulse",
            OrbState === "speaking" && "bg-emerald-500/30 blur-3xl scale-110"
          )}
        />

        {/* The actual button - no blur */}
        <button
          onClick={startListening}
          disabled={isLoading}
          className={cn(
            "relative z-10 flex items-center justify-center w-40 h-40 rounded-full border-4 shadow-2xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isListening && "border-red-500 bg-red-500/10",
            isLoading && "border-purple-500 bg-purple-500/10 cursor-wait",
            !isListening && !isLoading && "border-zinc-700 bg-zinc-900 hover:border-blue-500"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
          ) : (
            <Mic className={cn(
              "w-16 h-16 transition-colors",
              isListening ? "text-red-500 animate-pulse" : "text-white"
            )} />
          )}
        </button>
      </div>

      {/* --- STATUS TEXT --- */}
      <div className="mt-16 text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-light tracking-[0.3em] text-zinc-300">
          TIDES
        </h1>

        <p className="text-sm text-zinc-500 uppercase tracking-widest">
          {OrbState === "listening" && "Listening..."}
          {OrbState === "thinking" && "Processing..."}
          {OrbState === "speaking" && "Speaking..."}
          {OrbState === "idle" && "Ready"}
        </p>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="min-h-[120px] text-xl leading-relaxed text-zinc-100 px-6">
          {messages.length > 0
            ? getMessageText(messages[messages.length - 1])
            : "Click the microphone to start"}
        </div>

        {/* Text Input for Testing */}
        <div className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
            placeholder="Or type a message..."
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
          />
          <button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-zinc-500 space-y-2">
          <p>Try saying:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">"Do I have any packages?"</span>
            <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">"Book the tennis court"</span>
            <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">"Hello"</span>
          </div>
        </div>
      </div>

      {/* --- DEBUG: SYSTEM STATUS --- */}
      <div className="fixed bottom-4 left-4 p-4 bg-zinc-900/80 backdrop-blur rounded-xl border border-zinc-800 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            status === "ready" ? "bg-green-500" : "bg-yellow-500 animate-pulse"
          )} />
          <span>System {status.toUpperCase()}</span>
        </div>
        <div>State: {OrbState.toUpperCase()}</div>
        <div>Messages: {messages.length}</div>
        <div className="mt-2 text-[10px] text-zinc-600">
          {isListening && "🎤 MIC ACTIVE"}
        </div>
      </div>
    </div>
  );
}
