import React, { useState, useMemo, useEffect } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  ProgressBar,
  InputGroup
} from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useGetWorkoutsQuery } from "../slices/workoutsApiSlice";
import {
  useGetDailyLogsQuery,
  useUpdateDailyLogMutation,
} from "../slices/dailyLogSlice";
import { useSelector } from "react-redux";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import StepTracker from "../components/StepTracker"; 

const SUCCESS_SOUND = "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg";

const Dashboard = () => {
  const { data: workouts, isLoading: loadingWorkouts } = useGetWorkoutsQuery();
  const { data: dailyLogs, isLoading: loadingLogs } = useGetDailyLogsQuery();
  const [updateDailyLog, { isLoading: updatingLog }] = useUpdateDailyLogMutation();
  
  const { userInfo } = useSelector((state) => state.auth);

  // --- 1. DYNAMIC GOALS CALCULATOR (Added Steps Goal) ---
  const GOALS = useMemo(() => {
    // Default Goals
    let goals = { calories: 2000, water: 2500, volume: 5000, steps: 8000 }; 
    
    if (userInfo) {
        const weight = userInfo.weight || 0; 
        const height = userInfo.height || 170;
        const age = userInfo.age || 25;
        const gender = userInfo.gender || 'Male';
        const userGoal = userInfo.goal || 'Maintain'; 
        
        if (weight > 0) {
            let bmr = (gender === 'Male') 
                ? 10 * weight + 6.25 * height - 5 * age + 5
                : 10 * weight + 6.25 * height - 5 * age - 161;
            let tdee = bmr * 1.55; 

            if (userGoal === 'Cut') {
                goals.calories = Math.round(tdee - 500);
            } else if (userGoal === 'Bulk') {
                goals.calories = Math.round(tdee + 500);
            } else {
                goals.calories = Math.round(tdee);
            }
            goals.water = Math.round(weight * 35);   
            goals.volume = Math.round(weight * 60);
            
            // Basic Step Goal based on user goal
            if (userGoal === 'Cut') goals.steps = 10000; // More walking for fat loss
            else if (userGoal === 'Bulk') goals.steps = 6000; // Less cardio for bulk
        }
    }
    return goals;
  }, [userInfo]);

  const [showModal, setShowModal] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [calories, setCalories] = useState("");
  const [water, setWater] = useState("");
  const [weight, setWeight] = useState("");

  const todayDate = new Date().toISOString().split("T")[0];

  const todayStats = useMemo(() => {
    const log = dailyLogs?.find(l => l.date === todayDate) || {};
    const todayWorkout = workouts?.find(w => w.date.split("T")[0] === todayDate);
    const volume = todayWorkout 
        ? todayWorkout.exercises.reduce((acc, ex) => acc + (ex.weight || 0) * (ex.sets || 0) * (ex.reps || 0), 0)
        : 0;

    return {
        calories: log.calories || 0,
        water: log.water || 0,
        weight: log.weight || userInfo?.weight || 0,
        steps: log.steps || 0, 
        volume: volume
    };
  }, [dailyLogs, workouts, todayDate, userInfo]);

  // =========================================================
  // 🔔 NOTIFICATION & ALARM LOGIC
  // =========================================================
  useEffect(() => {
    if (!userInfo) return;
    const welcomeKey = `welcome_msg_shown_${userInfo._id}`;
    if (!sessionStorage.getItem(welcomeKey)) {
        toast.info(`Welcome back, ${userInfo.name}! 👋`, {
            position: "top-right",
            autoClose: 3000,
            toastId: "welcome-toast"
        });
        sessionStorage.setItem(welcomeKey, "true");
    }

    if (userInfo.weight && userInfo.weight > 0) {
        const checkGoal = (metricName, current, target, emoji) => {
            if (current > 0 && current >= target) {
                const key = `goal_${metricName}_${todayDate}_${userInfo._id}`;
                if (!localStorage.getItem(key)) {
                    // 🔊 PLAY SOUND
                    const audio = new Audio(SUCCESS_SOUND);
                    audio.play().catch(() => {});
                    
                    // 🍞 SHOW TOAST
                    toast.success(`${emoji} Goal Reached! You hit your ${metricName} target!`, {
                        position: "top-center",
                        autoClose: 5000,
                        theme: "colored"
                    });
                    localStorage.setItem(key, "true");
                }
            }
        };

        checkGoal("Calories", todayStats.calories, GOALS.calories, "🔥");
        checkGoal("Water", todayStats.water, GOALS.water, "💧");
        checkGoal("Volume", todayStats.volume, GOALS.volume, "🏋️");
        
        // 👇 ADDED ALARM CHECK FOR STEPS
        checkGoal("Steps", todayStats.steps, GOALS.steps, "🏃‍♂️"); 
    }
  }, [todayStats, GOALS, todayDate, userInfo]);

  useEffect(() => {
    if (showModal && dailyLogs) {
      const existingLog = dailyLogs.find((l) => l.date === logDate);
      if (existingLog) {
        setCalories(existingLog.calories || ""); 
        setWater(existingLog.water || "");
        setWeight(existingLog.weight || "");
      } else {
        setCalories("");
        setWater("");
        setWeight(userInfo?.weight || ""); 
      }
    }
  }, [logDate, showModal, dailyLogs, userInfo]);

  const chartData = useMemo(() => {
    if (!workouts && !dailyLogs) return [];
    const allDates = new Set();
    workouts?.forEach((w) => allDates.add(w.date.split("T")[0]));
    dailyLogs?.forEach((l) => allDates.add(l.date));

    const mergedData = Array.from(allDates).map((date) => {
      const dayWorkout = workouts?.find((w) => w.date.split("T")[0] === date);
      const volume = dayWorkout
        ? dayWorkout.exercises.reduce((acc, ex) => acc + (ex.weight || 0) * (ex.sets || 0) * (ex.reps || 0), 0)
        : 0;
      const dayLog = dailyLogs?.find((l) => l.date === date);

      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rawDate: date,
        volume,
        calories: dayLog ? dayLog.calories : 0,
        water: dayLog ? dayLog.water : 0,
        weight: (dayLog && dayLog.weight > 0) ? dayLog.weight : null, 
        goal: GOALS.calories,
      };
    });
    return mergedData.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
  }, [workouts, dailyLogs, GOALS]);

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleSaveLog = async (e) => {
    e.preventDefault();
    try {
      await updateDailyLog({
        date: logDate,
        calories: Number(calories),
        water: Number(water),
        weight: Number(weight),
      }).unwrap();
      
      toast.success("Daily Stats Updated!");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const saveSteps = async (newSteps) => {
    try {
        await updateDailyLog({
            date: todayDate,
            steps: newSteps, 
            calories: todayStats.calories, 
            water: todayStats.water,
            weight: todayStats.weight
        }).unwrap();
    } catch (err) {
        console.error("Step Sync Failed", err);
        throw err; 
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Shape Up - Progress Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated for: ${userInfo.name}`, 14, 28);
    
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Weight (kg)', 'Calories', 'Water (ml)', 'Volume (kg)']],
      body: chartData.map(item => [
        item.rawDate,
        item.weight || "-",
        item.calories,
        item.water,
        item.volume
      ]),
      theme: 'grid',
    });
    doc.save("ShapeUp_Progress.pdf");
  };

  const getProgress = (val, goal) => Math.min((val / goal) * 100, 100);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Your Fitness Dashboard</h2>
          <p className="text-muted">Track Calories, Hydration, Volume & Weight.</p>
        </div>
        <div className="d-flex gap-2">
            <Button variant="outline-danger" onClick={generatePDF}>
              <i className="fas fa-file-pdf"></i> Report
            </Button>
            <Button variant="primary" onClick={handleShow}>
              + Update Stats
            </Button>
        </div>
      </div>

      {loadingWorkouts || loadingLogs ? <Loader /> : (
        <>
           <Row className="mb-4">
               <Col md={6} lg={3} className="mb-3">
                   <Card className="shadow-sm border-0 h-100 p-3 text-center">
                       <h6 className="text-muted">🔥 Calories</h6>
                       <h3>{todayStats.calories} / {GOALS.calories}</h3>
                       <ProgressBar now={getProgress(todayStats.calories, GOALS.calories)} variant="warning" style={{height: "8px"}} />
                   </Card>
               </Col>
               
               <Col md={6} lg={3} className="mb-3">
                   <Card className="shadow-sm border-0 h-100 p-3 text-center">
                       <h6 className="text-muted">💧 Water</h6>
                       <h3>{todayStats.water}ml / {GOALS.water}ml</h3>
                       <ProgressBar now={getProgress(todayStats.water, GOALS.water)} variant="info" style={{height: "8px"}} />
                   </Card>
               </Col>

               <Col md={6} lg={3} className="mb-3">
                   <Card className="shadow-sm border-0 h-100 p-3 text-center">
                       <h6 className="text-muted">🏋️ Volume</h6>
                       <h3>{todayStats.volume.toLocaleString()} / {GOALS.volume}kg</h3>
                       <ProgressBar now={getProgress(todayStats.volume, GOALS.volume)} variant="success" style={{height: "8px"}} />
                   </Card>
               </Col>

               <Col md={6} lg={3} className="mb-3">
                   <Card className="shadow-sm border-0 h-100 p-3 text-center">
                       <h6 className="text-muted">⚖️ Current Weight</h6>
                       <h3>{todayStats.weight > 0 ? `${todayStats.weight} kg` : "Not Set"}</h3>
                       <small className="text-muted">Target: {userInfo?.goal}</small>
                   </Card>
               </Col>
           </Row>

           <Row className="mb-4">
              <Col lg={4} md={12} className="mb-3">
                  {/* 👇 PASSING THE GOAL TO TRACKER */}
                  <StepTracker 
                    currentSteps={todayStats.steps} 
                    goal={GOALS.steps}
                    onSave={saveSteps} 
                  />
              </Col>

              <Col lg={8} md={12} className="mb-3">
                <Card className="p-3 shadow-sm border-0 h-100">
                  <h5 className="mb-3 text-danger">Calorie Trend</h5>
                  <div style={{ width: "100%", height: 250 }}>
                    <ResponsiveContainer>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="calories" stroke="#ff7300" fill="#ff7300" fillOpacity={0.1} />
                        <Line type="dashed" dataKey="goal" stroke="#ccc" name="Goal" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
           </Row>

           <Row>
              <Col md={6} className="mb-4">
                 <Card className="p-3 shadow-sm border-0 h-100">
                    <h5 className="mb-3 text-primary">Workout Volume</h5>
                    <div style={{ width: "100%", height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="volume" fill="#0d6efd" name="Volume (kg)" radius={[5, 5, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </Card>
              </Col>

              <Col md={6} className="mb-4">
                <Card className="p-3 shadow-sm border-0 h-100">
                  <h5 className="mb-3 text-success">⚖️ Weight History</h5>
                  <div style={{ width: "100%", height: 250 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis domain={['auto', 'auto']} /> 
                        <Tooltip />
                        <Legend />
                        <Line 
                            connectNulls 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#198754" 
                            strokeWidth={3} 
                            activeDot={{ r: 8 }} 
                            name="Weight (kg)" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
           </Row>
        </>
      )}

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton><Modal.Title>Update Daily Stats</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveLog}>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
            </Form.Group>
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Calories (kcal)</Form.Label>
                        <Form.Control type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="e.g. 2500" />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Water (ml)</Form.Label>
                        <Form.Control type="number" value={water} onChange={(e) => setWater(e.target.value)} placeholder="e.g. 3000" />
                    </Form.Group>
                </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Current Weight (kg)</Form.Label>
              <InputGroup>
                <Form.Control type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Update weight" />
                <InputGroup.Text>kg</InputGroup.Text>
              </InputGroup>
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={updatingLog}>Save Log</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Dashboard;