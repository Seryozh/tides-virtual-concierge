"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Mic, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [unitNumber, setUnitNumber] = useState<string>("101"); // Demo unit
  const [language, setLanguage] = useState<"en" | "es">("en"); // Language selection

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: { sessionId, unitNumber, language } // Pass session context and language
    }),
    onFinish: (message) => {
      console.log("Chat finished:", message);
    },
    onError: (err) => {
      console.error("Chat error:", err);
      setError("Chat connection failed");
    }
  });

  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [OrbState, setOrbState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [error, setError] = useState<string>("");
  const [textInput, setTextInput] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to get text from message parts
  const getMessageText = (message: any): string => {
    if (!message.parts) return "";
    const textParts = message.parts.filter((p: any) => p.type === "text");
    return textParts.map((p: any) => p.text).join(" ");
  };

  // 🎙️ NEW: Record audio using MediaRecorder API
  const startRecording = async () => {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsListening(true);
      setOrbState("listening");
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Microphone permission denied or not available");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
      setOrbState("thinking");
      console.log("Recording stopped");
    }
  };

  // 🎤 NEW: Transcribe audio using Whisper API
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language); // Pass selected language

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const { text } = await response.json();
      console.log("Transcribed:", text);

      // Send transcribed text to chat
      sendMessage({ role: "user", parts: [{ type: "text", text }] });
    } catch (err) {
      console.error("Transcription error:", err);
      setError("Failed to transcribe audio");
      setOrbState("idle");
    }
  };

  // 🔊 NEW: Speak using ElevenLabs API
  const speakWithElevenLabs = async (text: string) => {
    try {
      setOrbState("speaking");

      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }), // Pass language for voice selection
      });

      if (!response.ok) {
        throw new Error('Synthesis failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setOrbState("idle");
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.error("Audio playback error");
        setOrbState("idle");
      };

      await audio.play();
    } catch (err) {
      console.error("ElevenLabs synthesis error:", err);
      setError("Voice synthesis failed");
      setOrbState("idle");
    }
  };

  // 🔄 FALLBACK: Browser Speech Synthesis (if ElevenLabs not configured)
  const speakWithBrowser = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.name.includes("Google US English")) || voices[0];
    utterance.rate = 1.0;
    setOrbState("speaking");
    utterance.onend = () => setOrbState("idle");
    window.speechSynthesis.speak(utterance);
  };

  // Auto-Speak the AI's response
  const lastSpokenMessageId = useRef<string | null>(null);
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && status === "ready" && lastMessage.id !== lastSpokenMessageId.current) {
      const text = getMessageText(lastMessage);
      if (text) {
        lastSpokenMessageId.current = lastMessage.id;
        // Try ElevenLabs first, fallback to browser TTS
        speakWithElevenLabs(text).catch(() => speakWithBrowser(text));
      }
    }
  }, [messages, status]);

  // Send text message (for testing)
  const sendTextMessage = () => {
    if (!textInput.trim()) return;
    setOrbState("thinking");
    sendMessage({ role: "user", parts: [{ type: "text", text: textInput }] });
    setTextInput("");
  };

  const isLoading = status === "submitted";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black text-white p-4">
      {/* Unit Number & Language Selector (Top Right) */}
      <div className="fixed top-4 right-4 flex items-center gap-4 bg-zinc-900/80 backdrop-blur rounded-lg p-3 border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Unit:</span>
          <input
            type="text"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            placeholder="101"
          />
        </div>
        <div className="h-4 w-px bg-zinc-700" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "es")}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
          </select>
        </div>
      </div>

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

        {/* The actual button - Press and Hold to Record */}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
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
          {OrbState === "listening" && (language === "es" ? "🎤 Mantén presionado para grabar..." : "🎤 Hold to record...")}
          {OrbState === "thinking" && (language === "es" ? "Procesando..." : "Processing...")}
          {OrbState === "speaking" && (language === "es" ? "Hablando..." : "Speaking...")}
          {OrbState === "idle" && (language === "es" ? "Mantén presionado para hablar" : "Press and hold to speak")}
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
            : (language === "es" ? "Mantén presionado el micrófono para hablar" : "Press and hold the microphone to speak")}
        </div>

        {/* Text Input for Testing */}
        <div className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
            placeholder={language === "es" ? "O escribe un mensaje..." : "Or type a message..."}
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
          <p>{language === "es" ? "Prueba preguntando:" : "Try asking:"}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {language === "es" ? (
              <>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">"¿Tengo paquetes?"</span>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">"Reservar la cancha de tenis"</span>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">"Hola"</span>
              </>
            ) : (
              <>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">"Do I have any packages?"</span>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">"Book the tennis court"</span>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">"Hello"</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- DEBUG: SYSTEM STATUS (Development Only) --- */}
      {process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' && (
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
          <div>Session: {sessionId ? `${sessionId.substring(0, 8)}...` : "Initializing..."}</div>
          <div className="mt-2 text-[10px] text-zinc-600">
            {isListening && "🎤 RECORDING"}
          </div>
        </div>
      )}
    </div>
  );
}
