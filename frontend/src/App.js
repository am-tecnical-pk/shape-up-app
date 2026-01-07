import React, { useEffect } from "react";
import { Outlet } from "react-router-dom"; 
import { Box } from "@mui/material";
import { Container } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./App.css";
import Header from "./components/Header";
import SupportChatbot from "./components/SupportChatbot"; // 👈 1. Import Chatbot

const App = () => {

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }, []);

  return (
    <Container fluid className="p-0">
      <ToastContainer />
      <Box sx={{ minHeight: '100vh', position: 'relative' }}> {/* Position relative added */}
        <Header />
        <Container className="py-3">
           <Outlet /> 
        </Container>

        {/* 👈 2. Add Chatbot Here - It will float on top of everything */}
        <SupportChatbot /> 
        
      </Box>
    </Container>
  );
};

export default App;