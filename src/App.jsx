import { useState, useRef, useEffect } from "react";
import { useChat } from "./hooks/useChat";
import { ChatMessage } from "./components/ChatMessage";
import "./App.css";

export default function App() {
  const { messages, isLoading, error, submitMessage } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSend() {
    if (!input.trim()) return;
    submitMessage(input);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">RH</div>
        <div>
          <h1>Health Chat Bot — Care Navigator</h1>
          <p>Post-discharge support · Demo prototype</p>
        </div>
        <span className="statusBadge">● Active</span>
      </header>

      <main className="messages">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}

        {error && (
          <div className="errorBanner">
            Error: {error}. Check your API key in <code>.env</code>.
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer className="inputRow">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="How are you feeling today?"
          disabled={isLoading}
          className="input"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="sendBtn"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
