import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Form, InputGroup, Spinner } from "react-bootstrap";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close"; 
import ChatIcon from "@mui/icons-material/Chat";   
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const SupportChatbot = () => {
  // 👇 State to handle Open/Close toggle
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hi! I am Shape Up AI 🤖. I know your stats and recent workouts. Ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Get User Info AND Token from Redux
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

    // 1. Add User Message
    setMessages((prev) => [...prev, { id: Date.now(), sender: "user", text }]);
    setInput("");
    setIsLoading(true);

    // 2. Handle Quick Answers (Local)
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

    // 3. Handle AI Request (Server)
    try {
      // Configuration with Token for Auth
      const config = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userInfo?.token}`, 
        },
      };

      const { data } = await axios.post('/api/ai/chat', { 
        message: text,
        userData: {
            name: userInfo?.name,
            goal: userInfo?.goal,
            weight: userInfo?.weight
        }
      }, config);
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: data.reply },
      ]);
    } catch (error) {
        console.error("AI Chat Error:", error);
        const errorMessage = error.response?.data?.reply || "⚠️ My brain is offline. Please try again later.";
        setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, sender: "bot", text: errorMessage },
        ]);
        if(error.response?.status === 401) {
            toast.error("Please login to use AI features.");
        }
    }
    setIsLoading(false);
  };

  // 👇 Floating Button Style (When Closed)
  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="rounded-circle shadow-lg d-flex align-items-center justify-content-center hover-scale"
        style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            transition: 'transform 0.2s'
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
        height: '500px',
        zIndex: 9999,
        maxWidth: '90vw'
    }}>
      <Card className="h-100 shadow-lg border-0 d-flex flex-column" style={{borderRadius: '16px', overflow: 'hidden'}}>
        {/* Header */}
        <Card.Header 
            className="text-white d-flex align-items-center justify-content-between py-3"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <div className="d-flex align-items-center gap-2 fw-bold">
            <AutoAwesomeIcon /> Shape Up Coach
          </div>
          <Button 
            variant="link" 
            className="text-white p-0" 
            onClick={() => setIsOpen(false)}
          >
            <CloseIcon />
          </Button>
        </Card.Header>

        {/* Messages Area */}
        <Card.Body className="flex-grow-1 overflow-auto bg-light p-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`d-flex ${
                msg.sender === "user" ? "justify-content-end" : "justify-content-start"
              } mb-3`}
            >
              <div
                className={`p-3 rounded-4 shadow-sm ${
                  msg.sender === "user" 
                  ? "bg-primary text-white" 
                  : "bg-white text-dark border"
                }`}
                style={{ 
                    maxWidth: "85%", 
                    borderBottomRightRadius: msg.sender === "user" ? "4px" : "20px",
                    borderBottomLeftRadius: msg.sender === "bot" ? "4px" : "20px"
                }}
              >
                {msg.sender === "bot" && <div className="mb-1 text-primary fw-bold" style={{fontSize: '0.75rem'}}><SmartToyIcon fontSize="inherit" className="me-1"/>AI Coach</div>}
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="d-flex justify-content-start mb-3">
              <div className="bg-white p-3 rounded-4 border shadow-sm">
                 <Spinner animation="grow" size="sm" variant="primary" />
                 <Spinner animation="grow" size="sm" variant="primary" className="mx-1" style={{animationDelay: '0.2s'}}/>
                 <Spinner animation="grow" size="sm" variant="primary" style={{animationDelay: '0.4s'}}/>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </Card.Body>

        {/* Input Area */}
        <Card.Footer className="bg-white border-top p-3">
          {/* Quick Questions */}
          <div className="d-flex gap-2 mb-3 overflow-auto pb-2" style={{whiteSpace: 'nowrap', scrollbarWidth: 'none'}}>
            {quickQuestions.map((q, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline-secondary"
                className="rounded-pill border-0 bg-light text-dark"
                disabled={isLoading}
                onClick={() => handleSend(q)}
                style={{fontSize: '0.75rem'}}
              >
                {q}
              </Button>
            ))}
          </div>

          <InputGroup>
            <Form.Control
              placeholder="Ask about diet, workouts..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="rounded-pill border-secondary border-opacity-25 bg-light"
              style={{paddingLeft: '20px'}}
            />
            <Button 
                onClick={() => handleSend()} 
                disabled={isLoading} 
                variant="primary" 
                className="rounded-circle ms-2 d-flex align-items-center justify-content-center shadow-sm"
                style={{width: '40px', height: '40px'}}
            >
              <SendIcon fontSize="small"/>
            </Button>
          </InputGroup>
        </Card.Footer>
      </Card>
      
      <style>{`
        .hover-scale:hover { transform: scale(1.1) !important; }
      `}</style>
    </div>
  );
};

export default SupportChatbot;