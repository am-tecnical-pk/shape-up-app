import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Container, Card, Row, Col, Button, Modal, Form, ProgressBar, Badge, Spinner
} from "react-bootstrap";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// --- IMPORTS ---
import { useGetWorkoutsQuery, useCreateWorkoutMutation } from "../slices/workoutsApiSlice";
import { useGetDailyLogsQuery, useUpdateDailyLogMutation } from "../slices/dailyLogSlice";
import { useGetMyRoutineQuery } from "../slices/routinesApiSlice"; 
// NEW AI IMPORT
import { useGetDailyBriefingQuery } from "../slices/aiSlice"; 
import { useSelector } from "react-redux";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  FaFilePdf, FaEdit, FaFire, FaTint, FaDumbbell, 
  FaWeight, FaUserCircle, FaTrophy, FaWalking, 
  FaRunning, FaCheckCircle, FaRobot, FaEye, FaLock
} from "react-icons/fa";

// ==========================================
// 1. VISUAL COMPONENTS (Animations & UI)
// ==========================================

// Custom Circular Progress (Restored)
const CustomCircularProgress = ({ value, max, text, color }) => {
    const radius = 60;
    const stroke = 10;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - ((value / (max || 1)) * circumference);
  
    return (
      <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto' }}>
        <svg height="150" width="150" style={{ transform: 'rotate(-90deg)' }}>
          <circle stroke="#f1f5f9" strokeWidth={stroke} r={normalizedRadius} cx="75" cy="75" fill="transparent" />
          <circle
            stroke={color} fill="transparent" strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
            strokeLinecap="round" r={normalizedRadius} cx="75" cy="75"
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
           <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{text}</span>
        </div>
      </div>
    );
};

// Animation Hooks
const useReveal = (threshold = 0.1) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
        }, { threshold });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);
    return [ref, isVisible];
};

const Reveal = ({ children, className = "", delay = 0, animation = "fade-up" }) => {
    const [ref, isVisible] = useReveal();
    return (
        <div ref={ref} className={`${className} ${isVisible ? `anim-${animation}` : 'anim-hidden'}`} style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
};

const BackgroundBlobs = () => (
  <div className="background-blobs">
    <div className="blob blob-1"></div>
    <div className="blob blob-2"></div>
    <div className="blob blob-3"></div>
  </div>
);

// ==========================================
// 2. NEW AI WIDGET
// ==========================================
const DailyBriefingWidget = () => {
    const { data: briefing, isLoading } = useGetDailyBriefingQuery();

    return (
        <Reveal animation="fade-up" delay={0}>
            <Card className="border-0 shadow-lg mb-5 text-white position-relative overflow-hidden" 
                  style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: "20px" }}>
                <div className="position-absolute top-0 end-0 p-3 opacity-25"><FaRobot size={100} /></div>
                <Card.Body className="d-flex align-items-center gap-4 p-4 position-relative z-1">
                    <div className="bg-primary bg-opacity-25 p-3 rounded-circle shadow-sm border border-primary border-opacity-50">
                        {isLoading ? <Spinner animation="border" size="sm" className="text-white"/> : <FaRobot size={32} className="text-white" />}
                    </div>
                    <div>
                        <h5 className="fw-bold mb-1 text-primary-light" style={{color: "#60a5fa"}}>Coach's Morning Briefing</h5>
                        <p className="mb-0 fs-5 fw-light" style={{ lineHeight: "1.5", color: "#e2e8f0" }}>
                            {isLoading ? "Analyzing your recovery and goals..." : (briefing?.message || "Let's crush today's goals! Stay consistent.")}
                        </p>
                    </div>
                </Card.Body>
            </Card>
        </Reveal>
    );
};

// ==========================================
// 3. MAIN DASHBOARD COMPONENT
// ==========================================
const Dashboard = () => {
  const { data: workouts, isLoading: loadingWorkouts } = useGetWorkoutsQuery();
  const { data: dailyLogs, isLoading: loadingLogs } = useGetDailyLogsQuery();
  const [updateDailyLog] = useUpdateDailyLogMutation();
  const { data: myRoutine } = useGetMyRoutineQuery();
  const [createWorkout] = useCreateWorkoutMutation();
  const { userInfo } = useSelector((state) => state.auth);

  // --- GOALS LOGIC (Restored Full Logic) ---
  const GOALS = useMemo(() => {
    let goals = { calories: 2000, water: 2500, volume: 5000, steps: 8000 }; 
    if (userInfo) {
        // AI Calculated Macros preferred
        if(userInfo.macros) {
            goals.calories = userInfo.macros.calories;
        }

        const weight = userInfo.weight || 70; 
        const userGoal = userInfo.goal || 'Maintain'; 
        
        if (userGoal === 'Cut') goals.steps = userInfo.stepGoal || 10000;
        else if (userGoal === 'Bulk') goals.steps = userInfo.stepGoal || 6000;
        else goals.steps = userInfo.stepGoal || 8000;
        
        goals.water = Math.round(weight * 35);   
        goals.volume = Math.round(weight * 60); 
    }
    return goals;
  }, [userInfo]);

  const [showModal, setShowModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [inputs, setInputs] = useState({ calories: "", water: "", weight: "", steps: "" });
  const [activeTab, setActiveTab] = useState('overview');

  const todayDate = new Date().toISOString().split("T")[0];

  // --- STATS CALCULATION ---
  const todayStats = useMemo(() => {
    const log = dailyLogs?.find(l => l.date === todayDate) || {};
    const todayWorkout = workouts?.find(w => w.createdAt && w.createdAt.split("T")[0] === todayDate);
    
    const volume = todayWorkout 
        ? todayWorkout.exercises?.reduce((acc, ex) => acc + (Number(ex.weight) || 0) * (Number(ex.sets) || 0) * (Number(ex.reps) || 0), 0)
        : 0;

    return {
        calories: Number(log.calories) || 0,
        water: Number(log.water) || 0,
        weight: Number(log.weight) || userInfo?.weight || 0,
        steps: Number(log.steps) || 0, 
        volume: volume
    };
  }, [dailyLogs, workouts, todayDate, userInfo]);

  // --- ACTIVE DAY LOGIC ---
  const currentDayIndex = useMemo(() => {
      const dayNum = new Date().getDay(); 
      return dayNum === 0 ? 6 : dayNum - 1; 
  }, []);

  const activeDayPlan = useMemo(() => {
      if (!myRoutine || !myRoutine.schedule) return null;
      const index = currentDayIndex % myRoutine.schedule.length;
      return myRoutine.schedule[index];
  }, [myRoutine, currentDayIndex]);

  // --- HANDLERS ---
  const handleQuickLog = async (dayPlan) => {
      if(!window.confirm(`Log all exercises for ${dayPlan.focus}?`)) return;
      const weightInput = window.prompt("Average weight (kg) used:", "20");
      const weightVal = weightInput ? (parseInt(weightInput) || 0) : 0; 

      try {
          const formattedExercises = dayPlan.exercises.map(ex => ({
              name: ex.name, sets: parseInt(ex.sets) || 3, reps: parseInt(ex.reps) || 10, weight: weightVal
          }));
          await createWorkout({ date: todayDate, exercises: formattedExercises }).unwrap();
          toast.success("Workout Logged! Stats Updated! 💪");
      } catch (err) { toast.error("Failed to log workout"); }
  };

  const handleSaveLog = async (e) => { 
      e.preventDefault(); 
      try { 
          await updateDailyLog({ date: logDate, calories: Number(inputs.calories), water: Number(inputs.water), weight: Number(inputs.weight) }).unwrap(); 
          toast.success("Stats Updated!"); 
          setShowModal(false); 
      } catch (err) { toast.error("Failed to update"); } 
  };
  
  const handleStepSave = async () => {
      try {
        await updateDailyLog({ date: todayDate, steps: Number(inputs.steps), calories: todayStats.calories, water: todayStats.water, weight: todayStats.weight }).unwrap();
        toast.success("Steps Updated!"); setShowStepModal(false);
      } catch(err) { toast.error("Failed to update steps"); }
  };

  const generatePDF = () => { const doc = new jsPDF(); doc.text(`Shape Up Report`, 14, 20); autoTable(doc, { startY: 30, head: [['Date', 'Calories', 'Water', 'Weight']], body: dailyLogs ? dailyLogs.map(l => [l.date, l.calories, l.water, l.weight]) : [] }); doc.save("Report.pdf"); };
  const getProgress = (val, goal) => Math.min((val / goal) * 100, 100);

  // Chart Data
  const chartData = useMemo(() => {
    if (!dailyLogs) return [];
    const sortedLogs = [...dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sortedLogs.slice(-7).map(log => ({ 
        date: new Date(log.date).toLocaleDateString("en-US", { weekday: 'short' }), 
        calories: log.calories || 0, 
        weight: log.weight || null 
    }));
  }, [dailyLogs]);

  // Achievements
  const achievements = useMemo(() => [
      { icon: <FaFire/>, title: "Calorie Crusher", desc: `Hit ${GOALS.calories} kcal`, unlocked: todayStats.calories >= GOALS.calories },
      { icon: <FaTint/>, title: "Hydration Hero", desc: `Drank ${GOALS.water}ml`, unlocked: todayStats.water >= GOALS.water },
      { icon: <FaDumbbell/>, title: "Heavy Lifter", desc: `Vol > ${GOALS.volume}kg`, unlocked: todayStats.volume >= GOALS.volume },
      { icon: <FaWalking/>, title: "Step Master", desc: `Hit ${GOALS.steps} steps`, unlocked: todayStats.steps >= GOALS.steps },
  ], [todayStats, GOALS]);

  return (
    <div className="dashboard-wrapper position-relative overflow-hidden bg-light">
      <style>{`
          .dashboard-wrapper { min-height: 100vh; font-family: 'Inter', sans-serif; background-color: #f8fafc; }
          .glass-card { background: white; border: none; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02); }
          .locked-card { opacity: 0.6; filter: grayscale(1); pointer-events: none; transform: scale(0.98); background: #e9ecef; }
          .active-day-card { border: 3px solid #0d6efd; transform: scale(1.02); box-shadow: 0 20px 50px rgba(13, 110, 253, 0.25) !important; z-index: 2; }
          .metric-value { font-size: 2rem; font-weight: 800; color: #1e293b; letter-spacing: -1px; }
          .metric-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; color: #94a3b8; }
          .tab-pill { cursor: pointer; padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: #64748b; border: 1px solid transparent; transition: all 0.2s; }
          .tab-pill.active { background: #eff6ff; color: #2563eb; border-color: #dbeafe; }
          .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; }
          .icon-circle { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
          .background-blobs { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
          .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; }
          .anim-fade-up { animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <BackgroundBlobs />

      <Container className="py-5 position-relative z-1">
        <Reveal animation="fade-up">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-4">
              <div>
                <div className="d-flex align-items-center mb-2"><FaUserCircle className="text-primary me-2" size={20} /><span className="fw-bold small text-uppercase">Welcome back, {userInfo?.name || 'Athlete'}</span></div>
                <h1 className="fw-bold display-4 mb-0 text-dark">Dashboard</h1>
                <p className="text-muted mt-2 mb-0">Overview for {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
              </div>
              <div className="d-flex gap-3">
                  <Button variant="dark" onClick={generatePDF} className="rounded-pill shadow-sm"><FaFilePdf className="me-2" /> Export</Button>
                  <Button variant="primary" onClick={() => { setInputs({ calories: todayStats.calories, water: todayStats.water, weight: todayStats.weight }); setShowModal(true); }} className="rounded-pill shadow-lg"><FaEdit className="me-2" /> Log Daily</Button>
              </div>
            </div>
        </Reveal>

        {/* --- 1. AI BRIEFING (Added Here) --- */}
        <DailyBriefingWidget />

        {/* --- 2. WEEKLY ROADMAP (Restored) --- */}
        {myRoutine && activeDayPlan && (
            <Reveal animation="fade-up" delay={50}>
                <div className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="fw-bold m-0"><FaRunning className="me-2 text-primary"/>This Week's Roadmap</h4>
                        <Button variant="outline-primary" size="sm" onClick={() => setShowRoutineModal(true)}><FaEye className="me-2"/> View Full Plan</Button>
                    </div>
                    
                    <Row className="g-4">
                        <Col lg={5}>
                            <Card className="glass-card active-day-card h-100 border-0 p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div><Badge bg="danger" className="mb-2">TODAY</Badge><h2 className="fw-bold mb-0 text-primary">{activeDayPlan.focus}</h2><small className="text-muted fw-bold">{activeDayPlan.day}</small></div>
                                    <div className="icon-circle bg-primary text-white shadow-sm"><FaFire /></div>
                                </div>
                                <div className="flex-grow-1 mb-4">
                                    <p className="mb-2 small text-dark"><strong>Warmup:</strong> {activeDayPlan.warmup}</p>
                                    <div className="d-flex flex-column gap-2">
                                        {activeDayPlan.exercises.slice(0, 4).map((ex, i) => (
                                            <div key={i} className="d-flex justify-content-between border-bottom pb-2">
                                                <span className="fw-bold text-dark">{ex.name}</span>
                                                <span className="text-primary fw-bold">{ex.sets} x {ex.reps}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Button size="lg" variant="primary" className="w-100 rounded-pill shadow-sm py-3 fw-bold" onClick={() => handleQuickLog(activeDayPlan)}><FaCheckCircle className="me-2"/> QUICK LOG</Button>
                            </Card>
                        </Col>

                        <Col lg={7}>
                            <Row className="g-3 h-100">
                                {myRoutine.schedule?.map((day, idx) => {
                                    const isActive = day.day === activeDayPlan.day; 
                                    const isPast = idx < (currentDayIndex % myRoutine.schedule.length);
                                    if(isActive) return null; 
                                    return (
                                        <Col md={6} key={idx}>
                                            <Card className={`glass-card border-0 p-3 h-100 ${isPast ? 'opacity-75' : 'locked-card'}`}>
                                                <div className="d-flex justify-content-between align-items-center h-100">
                                                    <div><h6 className="fw-bold mb-1">{day.day}</h6><span className="text-muted small d-block">{day.focus}</span></div>
                                                    {isPast ? <div className="text-success"><FaCheckCircle size={24}/></div> : <div className="bg-white rounded-circle p-2 shadow-sm"><FaLock className="text-muted"/></div>}
                                                </div>
                                            </Card>
                                        </Col>
                                    )
                                })}
                            </Row>
                        </Col>
                    </Row>
                </div>
            </Reveal>
        )}

        {/* --- 3. STATS CARDS --- */}
        {loadingWorkouts || loadingLogs ? <Loader /> : (
            <Row className="mb-5 g-4">
                 <Col md={6} lg={3}>
                     <Card className="glass-card border-0 h-100 p-4 hover-lift">
                         <div className="d-flex justify-content-between mb-3"><div className="icon-circle text-warning bg-warning bg-opacity-10"><FaFire /></div><Badge bg="warning" text="dark">Goal: {GOALS.calories}</Badge></div>
                         <h2 className="metric-value mb-1">{todayStats.calories}</h2>
                         <p className="metric-label mb-3">Calories Eaten</p>
                         <ProgressBar now={getProgress(todayStats.calories, GOALS.calories)} variant="warning" style={{height: 6}} />
                     </Card>
                 </Col>
                 <Col md={6} lg={3}>
                     <Card className="glass-card border-0 h-100 p-4 hover-lift">
                         <div className="d-flex justify-content-between mb-3"><div className="icon-circle text-info bg-info bg-opacity-10"><FaTint /></div><Badge bg="info">Goal: {GOALS.water}</Badge></div>
                         <h2 className="metric-value mb-1">{todayStats.water}</h2>
                         <p className="metric-label mb-3">Hydration (ml)</p>
                         <ProgressBar now={getProgress(todayStats.water, GOALS.water)} variant="info" style={{height: 6}} />
                     </Card>
                 </Col>
                 <Col md={6} lg={3}>
                     <Card className="glass-card border-0 h-100 p-4 hover-lift">
                         <div className="d-flex justify-content-between mb-3"><div className="icon-circle text-primary bg-primary bg-opacity-10"><FaDumbbell /></div><Badge bg="primary">Goal: {GOALS.volume}</Badge></div>
                         <h2 className="metric-value mb-1">{(todayStats.volume/1000).toFixed(1)}k</h2>
                         <p className="metric-label mb-3">Volume Lifted (kg)</p>
                         <ProgressBar now={getProgress(todayStats.volume, GOALS.volume)} variant="primary" style={{height: 6}} />
                     </Card>
                 </Col>
                 <Col md={6} lg={3}>
                     <Card className="glass-card border-0 h-100 p-4 hover-lift">
                         <div className="d-flex justify-content-between mb-3"><div className="icon-circle text-success bg-success bg-opacity-10"><FaWeight /></div><Badge bg="success">{userInfo?.goal}</Badge></div>
                         <h2 className="metric-value mb-1">{todayStats.weight || '--'}</h2>
                         <p className="metric-label mb-3">Target: {userInfo?.targetWeight} kg</p>
                         <ProgressBar now={getProgress(userInfo?.weight, userInfo?.targetWeight)} variant="success" style={{height: 6}} />
                     </Card>
                 </Col>
            </Row>
        )}

        <Row className="g-4 mb-5">
           <Col lg={8}>
             <Card className="glass-card h-100 p-4 border-0">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                      <div><h5 className="fw-bold mb-1 text-dark">Analytics Overview</h5><small className="text-muted">Track progress</small></div>
                      <div className="bg-light p-1 rounded-pill d-inline-flex border">
                         {['overview', 'weight'].map(tab => (
                             <div key={tab} className={`tab-pill ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</div>
                         ))}
                      </div>
                  </div>
                  <div style={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer>
                        <defs>
                          <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={activeTab === 'weight' ? '#10b981' : '#3b82f6'} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={activeTab === 'weight' ? '#10b981' : '#3b82f6'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="date" tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} dy={10}/>
                           <YAxis tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                           <Tooltip contentStyle={{backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff'}} itemStyle={{color: '#fff'}} />
                           <Area type="monotone" dataKey={activeTab === 'overview' ? 'calories' : activeTab} stroke={activeTab === 'weight' ? '#10b981' : '#3b82f6'} strokeWidth={4} fill="url(#gradientColor)" animationDuration={1500} connectNulls />
                        </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </Card>
           </Col>
           <Col lg={4}>
             <div className="d-flex flex-column gap-4 h-100">
                 {/* CIRCULAR STEP TRACKER */}
                 <Card className="glass-card border-0 p-4 text-center">
                     <h6 className="fw-bold mb-4 text-start text-dark">Daily Steps</h6>
                     <CustomCircularProgress value={todayStats.steps} max={GOALS.steps || 10000} text={todayStats.steps} color="#3b82f6" />
                     <p className="text-muted small mt-3 mb-0">Goal: <strong>{GOALS.steps}</strong> steps</p>
                     <Button variant="link" size="sm" className="text-decoration-none mt-2" onClick={() => { setInputs({...inputs, steps: todayStats.steps}); setShowStepModal(true); }}>Edit Steps</Button>
                 </Card>
                 
                 {/* WINS LIST (GAMIFICATION) */}
                 <Card className="glass-card border-0 p-4 flex-grow-1">
                     <h6 className="fw-bold mb-3 text-dark d-flex align-items-center"><FaTrophy className="text-warning me-2"/> Today's Wins</h6>
                     <div className="d-flex flex-column gap-3">
                         {achievements.map((ach, idx) => (
                            <Reveal key={idx} animation="fade-up" delay={idx * 100}>
                             <div className={`d-flex align-items-center p-2 rounded-3 ${ach.unlocked ? 'bg-success bg-opacity-10' : 'bg-light'}`}>
                                 <div className={`p-2 rounded-circle me-3 ${ach.unlocked ? 'bg-white text-success shadow-sm' : 'bg-white text-muted'}`}>{ach.icon}</div>
                                 <div className="flex-grow-1">
                                     <small className="d-block fw-bold text-dark">{ach.title}</small>
                                     <small className="text-muted" style={{fontSize: '0.7rem'}}>{ach.desc}</small>
                                 </div>
                                 {ach.unlocked && <FaCheckCircle className="text-success"/>}
                             </div>
                            </Reveal>
                         ))}
                     </div>
                 </Card>
             </div>
           </Col>
      </Row>

      {/* MODALS */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Update Stats</Modal.Title></Modal.Header>
          <Modal.Body>
              <Form onSubmit={handleSaveLog}>
                  <Form.Group className="mb-3"><Form.Label>Calories</Form.Label><Form.Control type="number" value={inputs.calories} onChange={e=>setInputs({...inputs, calories: e.target.value})}/></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Water</Form.Label><Form.Control type="number" value={inputs.water} onChange={e=>setInputs({...inputs, water: e.target.value})}/></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Weight</Form.Label><Form.Control type="number" value={inputs.weight} onChange={e=>setInputs({...inputs, weight: e.target.value})}/></Form.Group>
                  <Button type="submit" className="w-100">Save</Button>
              </Form>
          </Modal.Body>
      </Modal>

      <Modal show={showStepModal} onHide={() => setShowStepModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Update Steps</Modal.Title></Modal.Header>
          <Modal.Body>
              <Form.Group className="mb-3"><Form.Label>Step Count</Form.Label><Form.Control type="number" value={inputs.steps} onChange={e=>setInputs({...inputs, steps: e.target.value})}/></Form.Group>
              <Button onClick={handleStepSave} className="w-100">Save Steps</Button>
          </Modal.Body>
      </Modal>

      <Modal show={showRoutineModal} onHide={() => setShowRoutineModal(false)} size="lg" centered>
          <Modal.Header closeButton><Modal.Title>Your Weekly Plan</Modal.Title></Modal.Header>
          <Modal.Body className="p-4 bg-light">
              {myRoutine?.schedule?.map((day, idx) => (
                  <Card key={idx} className="mb-3 border-0 shadow-sm">
                      <Card.Header className="bg-white fw-bold d-flex justify-content-between"><span>{day.day}: {day.focus}</span></Card.Header>
                      <Card.Body><ul className="mb-0">{day.exercises.map((ex, i) => (<li key={i}>{ex.name} - {ex.sets}x{ex.reps}</li>))}</ul></Card.Body>
                  </Card>
              ))}
          </Modal.Body>
      </Modal>
    </Container>
    </div>
  );
};

export default Dashboard;