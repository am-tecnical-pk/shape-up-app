import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Form, Button, Spinner, Accordion, Alert, Card, Row, Col, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { FaSave, FaRobot, FaEdit, FaCheckCircle, FaDumbbell, FaArrowRight, FaRedo } from "react-icons/fa";
import { Link } from "react-router-dom";

// --- CHANGED: IMPORT FROM AI SLICE ---
import { 
  useGenerateWorkoutPlanMutation, 
  useSaveWorkoutPlanMutation, 
  useGetMyRoutineQuery 
} from "../slices/aiSlice";

const WorkoutPlan = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  // --- 1. FETCH EXISTING ROUTINE FROM DB ---
  const { data: existingRoutine, isLoading: fetchingRoutine } = useGetMyRoutineQuery();
  
  // --- STATE MANAGEMENT ---
  const [plan, setPlan] = useState(null);
  const [viewMode, setViewMode] = useState("generate"); // 'generate' or 'view'

  // --- API HOOKS ---
  const [generateWorkoutPlan, { isLoading: generating }] = useGenerateWorkoutPlanMutation();
  const [saveWorkoutPlan, { isLoading: saving }] = useSaveWorkoutPlanMutation();

  // --- FORM INPUTS ---
  const [days, setDays] = useState(4);
  const [duration, setDuration] = useState(45);
  const [equipment, setEquipment] = useState("Gym");
  const [injuries, setInjuries] = useState("");

  // --- 2. AUTO-DETECT LOGIC ---
  // If the user already has a routine saved in DB, show it immediately.
  useEffect(() => {
      if (existingRoutine && !plan) {
          setPlan(existingRoutine);
          setViewMode("view"); // Switch to "Active Plan" view
      }
  }, [existingRoutine]);

  // --- 3. GENERATE NEW PLAN (AI) ---
  const handleGenerate = async (e) => {
    e.preventDefault();
    setPlan(null);

    try {
      const res = await generateWorkoutPlan({
        userData: { name: userInfo.name, goal: userInfo.goal },
        preferences: { daysPerWeek: days, duration, equipment, injuries },
      }).unwrap();

      setPlan(res);
      setViewMode("generate"); // Stay in editor mode so user can review
      toast.success("Trainer has designed your plan! You can edit it below.");
    } catch (err) {
      toast.error(err?.data?.error || "AI Generation Failed");
    }
  };

  // --- 4. EDIT EXERCISE LOCALLY ---
  const handleEditExercise = (dayIndex, exIndex, field, value) => {
    const updatedPlan = { ...plan };
    updatedPlan.schedule[dayIndex].exercises[exIndex][field] = value;
    setPlan(updatedPlan);
  };

  // --- 5. SAVE PLAN TO DB ---
  const handleSave = async () => {
    try {
      await saveWorkoutPlan({
        plan: plan,
        preferences: { injuries }
      }).unwrap();
      toast.success("Plan Activated! Check your Dashboard 🚀");
      setViewMode("view"); // Switch to view mode
    } catch (err) {
      toast.error("Failed to save plan");
    }
  };

  // --- 6. RESET TO CREATE NEW ---
  const startNewPlan = () => {
      if(window.confirm("This will delete your current active plan. Are you sure?")) {
          setPlan(null);
          setViewMode("generate");
      }
  };

  if (fetchingRoutine) return <div className="text-center p-5"><Spinner animation="border" variant="primary"/></div>;

  return (
    <div className="fade-in">
      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(0,0,0,0.05); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .form-control-edit { border: none; background: transparent; font-weight: 600; color: #495057; padding: 0; }
        .form-control-edit:focus { background: #f8f9fa; box-shadow: none; border-bottom: 2px solid #0d6efd; border-radius: 0; }
        .active-plan-card { background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%); border: 2px solid #bae6fd; }
      `}</style>

      {/* ============================================================
          VIEW MODE: USER ALREADY HAS A PLAN
          ============================================================ */}
      {viewMode === "view" && plan ? (
          <div className="text-center py-5 animate__animated animate__fadeIn">
              <Card className="glass-card border-0 p-5 mx-auto active-plan-card" style={{maxWidth: '600px'}}>
                  <div className="mb-4">
                      <div className="bg-white p-3 rounded-circle d-inline-block shadow-sm mb-3">
                        <FaCheckCircle size={50} className="text-success"/>
                      </div>
                      <h2 className="fw-bold text-dark">You Have an Active Plan</h2>
                      <p className="text-muted">
                          Goal: <strong>{plan.goal || userInfo.goal}</strong> | 
                          Split: <strong>{plan.schedule?.length} Days</strong>
                      </p>
                  </div>

                  <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                      <Link to="/dashboard">
                          <Button variant="primary" size="lg" className="rounded-pill px-5 fw-bold shadow-sm w-100">
                              Go to Dashboard <FaArrowRight className="ms-2"/>
                          </Button>
                      </Link>
                      
                      <Button variant="outline-danger" size="lg" className="rounded-pill px-4 fw-bold w-100" onClick={startNewPlan}>
                          <FaRedo className="me-2"/> Create New Plan
                      </Button>
                  </div>
              </Card>
          </div>
      ) : (
      /* ============================================================
          GENERATE MODE: FORM + EDITOR
          ============================================================ */
      <>
          {/* FORM SECTION */}
          <Card className="glass-card mb-4 border-0 p-4">
            <div className="d-flex align-items-center mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                    <FaRobot className="text-primary fs-4"/>
                </div>
                <div>
                    <h4 className="fw-bold mb-0">AI Routine Designer</h4>
                    <small className="text-muted">Tell me your constraints, I'll build the split.</small>
                </div>
            </div>

            <Form onSubmit={handleGenerate}>
              <Row>
                <Col md={3} className="mb-3">
                  <Form.Label className="fw-bold small text-uppercase">Frequency</Form.Label>
                  <Form.Select value={days} onChange={(e) => setDays(e.target.value)} className="shadow-none">
                    <option value="3">3 Days (Full Body)</option>
                    <option value="4">4 Days (Upper/Lower)</option>
                    <option value="5">5 Days (Bro Split)</option>
                    <option value="6">6 Days (PPL)</option>
                  </Form.Select>
                </Col>
                <Col md={3} className="mb-3">
                  <Form.Label className="fw-bold small text-uppercase">Time (Mins)</Form.Label>
                  <Form.Select value={duration} onChange={(e) => setDuration(e.target.value)} className="shadow-none">
                    <option value="30">30 Mins (Intense)</option>
                    <option value="45">45 Mins (Standard)</option>
                    <option value="60">60 Mins (Optimal)</option>
                  </Form.Select>
                </Col>
                <Col md={3} className="mb-3">
                  <Form.Label className="fw-bold small text-uppercase">Equipment</Form.Label>
                  <Form.Select value={equipment} onChange={(e) => setEquipment(e.target.value)} className="shadow-none">
                    <option value="Gym">Full Gym Access</option>
                    <option value="Dumbbells">Home (Dumbbells Only)</option>
                    <option value="Bodyweight">No Equipment</option>
                  </Form.Select>
                </Col>
                <Col md={3} className="mb-3">
                  <Form.Label className="fw-bold small text-uppercase text-danger">Injuries?</Form.Label>
                  <Form.Control 
                    placeholder="e.g. Knee pain..." 
                    value={injuries} 
                    onChange={(e) => setInjuries(e.target.value)}
                    className="shadow-none border-danger"
                  />
                </Col>
              </Row>
              <div className="d-flex gap-2">
                  {/* Show cancel if returning from a view mode context */}
                  {existingRoutine && (
                      <Button variant="light" className="w-25 py-3 rounded-pill fw-bold mt-2" onClick={() => {setPlan(existingRoutine); setViewMode("view")}}>
                          Cancel
                      </Button>
                  )}
                  <Button type="submit" className={`py-3 rounded-pill fw-bold mt-2 shadow-sm ${existingRoutine ? 'w-75' : 'w-100'}`} disabled={generating}>
                    {generating ? <><Spinner size="sm" className="me-2"/>Analysing your profile...</> : "Generate My Plan ✨"}
                  </Button>
              </div>
            </Form>
          </Card>

          {/* RESULT DISPLAY & EDITOR */}
          {plan && (
            <div className="animate__animated animate__fadeInUp">
              <Alert variant="info" className="d-flex justify-content-between align-items-center border-0 shadow-sm rounded-3 p-3">
                <div>
                    <Badge bg="info" className="me-2 text-dark">STRATEGY</Badge> 
                    <strong>{plan.summary}</strong>
                </div>
                <Button variant="success" onClick={handleSave} disabled={saving} className="fw-bold shadow-sm">
                  {saving ? "Saving..." : <><FaSave className="me-2"/>Save & Activate</>}
                </Button>
              </Alert>

              <Accordion defaultActiveKey="0" className="shadow-sm rounded-3 overflow-hidden">
                {plan.schedule.map((day, dayIndex) => (
                  <Accordion.Item eventKey={dayIndex.toString()} key={dayIndex} className="border-0 border-bottom">
                    <Accordion.Header>
                        <div className="d-flex align-items-center w-100 me-3">
                            <Badge bg="dark" className="me-3 rounded-pill px-3 py-2">{day.day}</Badge>
                            <span className="fw-bold text-dark">{day.focus}</span>
                            <small className="ms-auto text-muted me-3">Tap to edit details</small>
                        </div>
                    </Accordion.Header>
                    <Accordion.Body className="bg-light p-0">
                      <div className="p-3 bg-white border-bottom">
                        <small className="fw-bold text-primary text-uppercase">🔥 Warmup Routine</small>
                        <p className="mb-0 small text-muted">{day.warmup}</p>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="bg-light text-muted small uppercase">
                            <tr>
                              <th className="ps-4">Exercise Name (Editable)</th>
                              <th style={{width: '100px'}}>Sets</th>
                              <th style={{width: '100px'}}>Reps</th>
                              <th>Coach Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {day.exercises.map((ex, exIndex) => (
                              <tr key={exIndex}>
                                <td className="ps-4">
                                    <div className="d-flex align-items-center">
                                        <FaEdit className="text-muted me-2 small opacity-50"/>
                                        <Form.Control 
                                            type="text"
                                            value={ex.name} 
                                            onChange={(e) => handleEditExercise(dayIndex, exIndex, 'name', e.target.value)}
                                            className="form-control-edit"
                                        />
                                    </div>
                                </td>
                                <td>
                                    <Form.Control 
                                        type="text"
                                        value={ex.sets} 
                                        onChange={(e) => handleEditExercise(dayIndex, exIndex, 'sets', e.target.value)}
                                        className="form-control-edit text-center bg-light rounded"
                                    />
                                </td>
                                <td>
                                    <Form.Control 
                                        type="text"
                                        value={ex.reps} 
                                        onChange={(e) => handleEditExercise(dayIndex, exIndex, 'reps', e.target.value)}
                                        className="form-control-edit text-center bg-light rounded"
                                    />
                                </td>
                                <td>
                                    <small className="text-muted fst-italic">{ex.notes}</small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          )}
      </>
      )}
    </div>
  );
};

export default WorkoutPlan;