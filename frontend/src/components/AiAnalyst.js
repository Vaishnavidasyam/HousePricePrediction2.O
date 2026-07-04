import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import "./AiAnalyst.css";

const SUGGESTED_QS = [
  "What is driving growth in Gachibowli, Hyderabad?",
  "How do 3BHK yields compare to 2BHK in Bandra, Mumbai?",
  "Are there infra upgrades near DLF Phase 1, Gurgaon?",
  "Is Salt Lake, Kolkata a stable long-term investment?",
];

const MOCK_ANSWERS = {
  "What is driving growth in Gachibowli, Hyderabad?":
    "Gachibowli is highly influenced by its proximity to the Financial District and Hitec City. Growth is driven by: 1) The upcoming Phase II Metro lines, 2) Robust IT/Office space demand, and 3) High-quality gated community supply. Current rental yields are averaging 3.9% with projected capital appreciation of 7.2% YoY.",
  "How do 3BHK yields compare to 2BHK in Bandra, Mumbai?":
    "Bandra is premium-inelastic. 2BHK configurations show high liquidity with shorter vacancy periods, yielding ~3.2%. However, 3BHK configurations exhibit stronger absolute equity appreciation, despite longer transaction times, averaging around 2.7% yield but high-net-worth tenant retention.",
  "Are there infra upgrades near DLF Phase 1, Gurgaon?":
    "DLF Phase 1 benefits from rapid connectivity via the Golf Course Road expansion and Rapid Metro link. Current micro-upgrades include Smart City smart grid water management and underground cabling systems, pushing premiums by 12% over adjacent sectors in the last 18 months.",
  "Is Salt Lake, Kolkata a stable long-term investment?":
    "Salt Lake Sector V remains East India's primary tech corridor. The residential sectors offer low volatility, low-density zoning, and high tenant reliability. While capital gains are conservative (~4.5% annually), rental income stability remains in the top decile.",
};

const AiAnalyst = () => {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: "Welcome to EstateVerse Analyst. Ask me about micro-markets, builders, or pricing trends.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef(null);

  // Auto scroll to bottom when messages list updates
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI thinking and replying
    setTimeout(() => {
      let aiText = "Analysing market dynamics... pulling comparables, builder records and macro signals. Valuation confidence is 94% with standard variance of 4.2%.";
      
      // Look for match in mock answers
      const matchKey = Object.keys(MOCK_ANSWERS).find(
        (key) => key.toLowerCase().includes(textToSend.toLowerCase()) || textToSend.toLowerCase().includes(key.toLowerCase())
      );
      if (matchKey) {
        aiText = MOCK_ANSWERS[matchKey];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: aiText,
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-title-group">
          <div className="chat-avatar">
            <Sparkles size={16} className="sparkle-icon" />
          </div>
          <div>
            <h4 className="chat-title">AI Market Analyst</h4>
            <p className="chat-status">Thesis Engine Online</p>
          </div>
        </div>
        <span className="chat-tag">Agentic v2.0</span>
      </div>

      <div className="chat-body" ref={chatBodyRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`bubble ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="bubble ai typing">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>

      <div className="chat-footer">
        <div className="suggested">
          <span className="suggested-title">Suggested Inquiries:</span>
          <div className="suggested-list">
            {SUGGESTED_QS.map((q, idx) => (
              <button key={idx} className="q" onClick={() => handleSend(q)}>
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Query micro-market signals..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
          />
          <button className="chat-send-btn" onClick={() => handleSend(inputText)}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAnalyst;
