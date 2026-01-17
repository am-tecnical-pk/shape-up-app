import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Form, InputGroup, Spinner } from "react-bootstrap";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close"; // 👈 Close icon added
import ChatIcon from "@mui/icons-material/Chat";   // 👈 Chat bubble icon added
import axios from "axios";
import { useSelector } from "react-redux";

const SupportChatbot = () => {
  // 👇 State to handle Open/Close toggle
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hi! I am Shape Up AI 🤖. Select a topic below or ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { userInfo } = useSelector((state) => state.auth || {});

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  const predefinedQA = {
    "How to log food? 🍎": "Open Nutrition Checker, search food, and click Add. Calories are tracked automatically.",
    "Calculate BMR? 🔢": "Go to the BMR page, enter age, height, and weight to calculate daily calories.",
    "Dark Mode Setup 🌙": "Go to Settings and change App Theme to Dark Mode.",
    "Is this Free? 💸": "Yes! Shape Up v1.0 is completely free.",
  };

  const quickQuestions = Object.keys(predefinedQA);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { id: Date.now(), sender: "user", text }]);
    setInput("");
    setIsLoading(true);

    if (predefinedQA[text]) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: "bot", text: predefinedQA[text] },
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const { data } = await axios.post('/api/ai/chat', { 
        message: text,
        userData: {
            name: userInfo?.name || "Friend",
            goal: userInfo?.goal || "General Fitness",
            weight: userInfo?.weight || "Unknown"
        }
      });
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: data.reply },
      ]);
    } catch (error) {
        const errorMessage = error.response?.data?.reply || "⚠️ Connection Error.";
        setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, sender: "bot", text: errorMessage },
        ]);
    }
    setIsLoading(false);
  };

  // 👇 Floating Button Style (When Closed)
  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="rounded-circle shadow-lg d-flex align-items-center justify-content-center"
        style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            zIndex: 9999, // Always on top
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
        }}
      >
        <ChatIcon style={{ fontSize: '30px', color: 'white' }} />
      </Button>
    );
  }

  // 👇 Chat Window Style (When Open)
  return (
    <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '350px',
        height: '500px', // Fixed height for popup
        zIndex: 9999,
        maxWidth: '90vw' // Mobile friendly
    }}>
      <Card className="h-100 shadow-lg border-0 d-flex flex-column">
        {/* Header with Close Button */}
        <Card.Header 
            className="text-white d-flex align-items-center justify-content-between"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <div className="d-flex align-items-center gap-2">
            <AutoAwesomeIcon /> Shape Up AI
          </div>
          <Button 
            variant="link" 
            className="text-white p-0" 
            onClick={() => setIsOpen(false)}
          >
            <CloseIcon />
          </Button>
        </Card.Header>

        <Card.Body className="flex-grow-1 overflow-auto bg-light">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`d-flex ${
                msg.sender === "user" ? "justify-content-end" : "justify-content-start"
              } mb-2`}
            >
              <div
                className={`p-2 px-3 rounded shadow-sm ${
                  msg.sender === "user" ? "bg-primary text-white" : "bg-white text-dark border"
                }`}
                style={{ maxWidth: "80%" }}
              >
                {msg.sender === "bot" && <SmartToyIcon fontSize="small" className="me-1 text-primary" />}
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="d-flex justify-content-start">
              <Spinner animation="grow" size="sm" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </Card.Body>

        <Card.Footer>
          {/* Quick Questions (Horizontal Scroll) */}
          <div className="d-flex gap-2 mb-2 overflow-auto" style={{whiteSpace: 'nowrap', scrollbarWidth: 'none'}}>
            {quickQuestions.map((q, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline-secondary"
                disabled={isLoading}
                onClick={() => handleSend(q)}
                style={{fontSize: '0.7rem'}}
              >
                {q}
              </Button>
            ))}
          </div>

          <InputGroup>
            <Form.Control
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button onClick={() => handleSend()} disabled={isLoading} variant="primary">
              <SendIcon />
            </Button>
          </InputGroup>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default SupportChatbot;