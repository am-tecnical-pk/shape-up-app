import React, { useState, useEffect } from "react";
import { Container, Row, Col, Tab, Nav } from "react-bootstrap";
import { 
  FaDumbbell, FaClipboardList, FaLayerGroup, 
  FaSearch, FaRobot
} from "react-icons/fa";

// --- IMPORTS ---
import ExerciseDB from "../components/ExerciseDB";
import WorkoutLog from "../components/WorkoutLog"; 
import WorkoutPlan from "../components/WorkoutPlan"; // 👈 IMPORT THE AI TRAINER

const Workouts = () => {
  const [pickedExercise, setPickedExercise] = useState(null);

  useEffect(() => {
      window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-wrapper position-relative">
      
      {/* --- ULTRA PREMIUM STYLES --- */}
      <style>
        {`
          :root { --primary: #0d6efd; --secondary: #6c757d; }
          .page-wrapper { min-height: 100vh; overflow-x: hidden; color: #212529; background-color: #f8f9fa; font-family: 'Inter', sans-serif; }
          
          /* TEXT & HEADINGS */
          .gradient-heading { background: linear-gradient(90deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .text-adaptive-head { color: #000 !important; }
          .text-adaptive-sub { color: #495057 !important; }

          /* BACKGROUND ANIMATION */
          .background-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; overflow: hidden; pointer-events: none; }
          .grid-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.5; }
          .blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.4; animation: blobMove 12s infinite alternate; }
          .blob-1 { width: 600px; height: 600px; background: #6610f2; top: -150px; left: -150px; }
          .blob-2 { width: 500px; height: 500px; background: #0d6efd; bottom: -100px; right: -100px; animation-delay: 2s; }

          /* GLASS PANELS */
          .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 30px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05); overflow: hidden; height: 100%; }
          .panel-header { padding: 25px 30px; border-bottom: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.5); }
          .glow-icon-box { width: 45px; height: 45px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 0 15px currentColor; opacity: 0.9; }

          /* CUSTOM TABS */
          .premium-tabs .nav-link { border: none; color: #6c757d; font-weight: 600; padding: 10px 20px; border-radius: 50px; transition: all 0.3s ease; }
          .premium-tabs .nav-link.active { background-color: #0d6efd; color: white; box-shadow: 0 5px 15px rgba(13, 110, 253, 0.4); }
          .premium-tabs .nav-link:hover:not(.active) { background-color: rgba(0,0,0,0.05); }

          @keyframes blobMove { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(30px, -30px) scale(1.1); } }
          .fade-in { animation: fadeIn 1s ease forwards; opacity: 0; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}
      </style>

      {/* --- BACKGROUND --- */}
      <div className="background-wrapper">
        <div className="grid-overlay"></div>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Container fluid="xxl" className="py-4 px-md-5">
        
        {/* HEADER */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-5 fade-in">
          <div>
             <div className="d-flex align-items-center mb-2">
                <FaLayerGroup className="text-primary me-2" />
                <span className="text-adaptive-sub fw-bold small text-uppercase ls-2">Workout Planner</span>
             </div>
             <h1 className="display-4 fw-bold mb-0 gradient-heading">
               Find Your Flow
             </h1>
          </div>
        </div>

        {/* --- TABS FOR AI vs DATABASE --- */}
        <Tab.Container defaultActiveKey="ai-trainer">
          <Nav variant="pills" className="premium-tabs mb-4 justify-content-center justify-content-lg-start fade-in">
            <Nav.Item>
              <Nav.Link eventKey="ai-trainer" className="d-flex align-items-center me-3">
                <FaRobot className="me-2" /> AI Coach
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="database" className="d-flex align-items-center">
                <FaDumbbell className="me-2" /> Manual Library
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            
            {/* TAB 1: NEW AI TRAINER */}
            <Tab.Pane eventKey="ai-trainer" className="fade-in">
               <Row>
                 <Col xs={12}>
                    <div className="glass-panel p-4">
                       <WorkoutPlan /> {/* 👈 THE AI COMPONENT */}
                    </div>
                 </Col>
               </Row>
            </Tab.Pane>

            {/* TAB 2: YOUR ORIGINAL DATABASE VIEW */}
            <Tab.Pane eventKey="database" className="fade-in">
              <Row className="g-4 align-items-start">
                  
                  {/* LEFT: WORKOUT LOG */}
                  <Col lg={5} xl={4}>
                      <div className="sticky-sidebar">
                          <div className="glass-panel d-flex flex-column h-100">
                              <div className="panel-header d-flex align-items-center">
                                  <div className="glow-icon-box me-3" style={{ color: "#0d6efd", background: "rgba(13, 110, 253, 0.1)" }}>
                                     <FaClipboardList />
                                  </div>
                                  <h5 className="fw-bold mb-0 text-adaptive-head">Today's Log</h5>
                              </div>
                              <div className="p-3 scroll-area flex-grow-1">
                                  <WorkoutLog selectedExercise={pickedExercise} />
                              </div>
                          </div>
                      </div>
                  </Col>

                  {/* RIGHT: EXERCISE DB */}
                  <Col lg={7} xl={8}>
                      <div className="glass-panel h-100 d-flex flex-column">
                          <div className="panel-header d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                  <div className="glow-icon-box me-3" style={{ color: "#198754", background: "rgba(25, 135, 84, 0.1)" }}>
                                     <FaDumbbell />
                                  </div>
                                  <h5 className="fw-bold mb-0 text-adaptive-head">Exercise Database</h5>
                              </div>
                          </div>
                          <div className="p-4">
                              <ExerciseDB onSelectExercise={setPickedExercise} />
                          </div>
                      </div>
                  </Col>
              </Row>
            </Tab.Pane>

          </Tab.Content>
        </Tab.Container>

      </Container>
    </div>
  );
};

export default Workouts;