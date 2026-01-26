import React, { useState, useEffect } from "react";
import { Card, Form, Button, Table, Row, Col, Modal, Alert, Badge, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useCreateWorkoutMutation, useGetWorkoutByDateQuery } from "../slices/workoutsApiSlice";
import { useAnalyzeWorkoutSessionMutation } from "../slices/aiSlice"; 
import { FaCalendarAlt, FaDumbbell, FaClipboardList, FaCheckCircle, FaRobot, FaFire, FaArrowRight } from "react-icons/fa";

const WorkoutLog = ({ selectedExercise }) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  // AI & Feedback State
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rpe, setRpe] = useState(7); // Default 7 (Moderate)
  const [feedback, setFeedback] = useState("");
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  const [createWorkout, { isLoading }] = useCreateWorkoutMutation();
  const [analyzeWorkout, { isLoading: analyzing }] = useAnalyzeWorkoutSessionMutation();
  
  const { data: workoutData, refetch } = useGetWorkoutByDateQuery(date);

  // Auto-fill exercise from Routine or Search
  useEffect(() => {
    if (selectedExercise) {
        setExerciseName(selectedExercise.name);
    }
  }, [selectedExercise]);

  // 1. LOG INDIVIDUAL SET
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseName || !sets || !reps) return toast.error("Please fill in fields");

    try {
        await createWorkout({
            date,
            exercises: [{ name: exerciseName, sets: Number(sets), reps: Number(reps), weight: Number(weight) || 0 }]
        }).unwrap();
        toast.success("Set Logged!");
        setExerciseName(""); setSets(""); setReps(""); setWeight("");
        refetch(); 
    } catch (err) {
        toast.error("Failed to add set");
    }
  };

  // 2. FINISH & ANALYZE (THE POPUP FLOW)
  const handleFinishWorkout = async () => {
      if(!workoutData || !workoutData._id) return;
      
      try {
          const result = await analyzeWorkout({
              workoutId: workoutData._id,
              rpe: Number(rpe),
              feedback
          }).unwrap();
          
          setAiAnalysisResult(result); // Show AI result immediately in modal
          toast.success("AI has analyzed your session! 🧠");
      } catch (err) {
          toast.error("AI Analysis Failed");
      }
  };

  const closeAndReset = () => {
      setShowFinishModal(false);
      setAiAnalysisResult(null);
      setFeedback("");
      setRpe(7);
  };

  return (
    <>
      <Card className="shadow-sm border-0 h-100">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
          <div className="d-flex align-items-center text-primary">
             <FaClipboardList className="me-2" size={20}/>
             <h5 className="mb-0 fw-bold">Workout Logger</h5>
          </div>
          {/* Finish Button only appears if exercises exist */}
          {workoutData && workoutData.exercises?.length > 0 && (
              <Button variant="success" size="sm" className="fw-bold shadow-sm rounded-pill px-3" onClick={() => setShowFinishModal(true)}>
                  <FaCheckCircle className="me-1"/> Finish Session
              </Button>
          )}
        </Card.Header>
        
        <Card.Body>
          {/* Date Picker */}
          <Form.Group className="mb-4">
              <div className="input-group shadow-sm rounded">
                  <span className="input-group-text bg-white border-end-0"><FaCalendarAlt className="text-primary"/></span>
                  <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-start-0 ps-0 fw-bold"/>
              </div>
          </Form.Group>

          {/* Add Set Form */}
          <Form onSubmit={handleSubmit} className="p-3 bg-light rounded border mb-4">
              <h6 className="mb-3 fw-bold text-dark small text-uppercase">Log New Set</h6>
              <Form.Group className="mb-3"><Form.Control type="text" placeholder="Exercise Name (e.g. Bench Press)" value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} required className="fw-semibold"/></Form.Group>
              <Row className="g-2">
                  <Col xs={4}><Form.Control type="number" placeholder="Sets" value={sets} onChange={(e) => setSets(e.target.value)} required /></Col>
                  <Col xs={4}><Form.Control type="number" placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} required /></Col>
                  <Col xs={4}><Form.Control type="number" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} /></Col>
              </Row>
              <Button type="submit" variant="primary" className="w-100 mt-3 shadow-sm fw-bold" disabled={isLoading}>
                 {isLoading ? <Spinner size="sm"/> : "+ Log Entry"}
              </Button>
          </Form>

          {/* Today's Logged List */}
          <div className="table-responsive" style={{maxHeight: "300px"}}>
              <h6 className="text-muted small fw-bold mb-2 ps-1">TODAY'S EXERCISES</h6>
              <Table size="sm" hover className="mb-0 align-middle">
                  <thead className="bg-light text-muted small">
                      <tr><th>Exercise</th><th className="text-center">Sets</th><th className="text-center">Reps</th><th className="text-center">Kg</th></tr>
                  </thead>
                  <tbody>
                      {workoutData?.exercises?.length > 0 ? (
                          workoutData.exercises.map((ex, idx) => (
                              <tr key={idx}>
                                  <td className="fw-semibold text-dark">{ex.name}</td>
                                  <td className="text-center">{ex.sets}</td>
                                  <td className="text-center">{ex.reps}</td>
                                  <td className="text-center fw-bold text-primary">{ex.weight}</td>
                              </tr>
                          ))
                      ) : (
                          <tr><td colSpan="4" className="text-center text-muted py-4 small">Start logging to see data here.</td></tr>
                      )}
                  </tbody>
              </Table>
          </div>
        </Card.Body>
      </Card>

      {/* --- SESSION SUMMARY & AI ANALYSIS MODAL --- */}
      <Modal show={showFinishModal} onHide={closeAndReset} centered backdrop="static" size="lg">
          <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold d-flex align-items-center"><FaCheckCircle className="text-success me-2"/> Workout Complete</Modal.Title></Modal.Header>
          <Modal.Body className="px-4 pb-4">
              
              {!aiAnalysisResult ? (
                  // PHASE 1: INPUT FEEDBACK
                  <>
                    <Alert variant="light" className="border d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><FaDumbbell size={20}/></div>
                        <div>
                            <h6 className="fw-bold mb-0">Session Summary</h6>
                            <small className="text-muted">You completed {workoutData?.exercises?.length} exercises today.</small>
                        </div>
                    </Alert>

                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold d-flex justify-content-between">
                                <span>Intensity (RPE 1-10)</span>
                                <span className="text-primary fw-bold">{rpe} / 10</span>
                            </Form.Label>
                            <Form.Range min={1} max={10} value={rpe} onChange={(e) => setRpe(e.target.value)} />
                            <div className="d-flex justify-content-between text-muted small">
                                <span>Too Easy</span><span>Perfect</span><span>Failed/Pain</span>
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">How did it feel?</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="e.g. Shoulders felt tight, Squats were easy. Need more weight next time." value={feedback} onChange={e=>setFeedback(e.target.value)} />
                        </Form.Group>

                        <Button onClick={handleFinishWorkout} disabled={analyzing} className="w-100 py-3 fw-bold rounded-3" variant="primary">
                            {analyzing ? <><Spinner size="sm" className="me-2"/> AI Coach is Analyzing...</> : <><FaRobot className="me-2"/> Submit & Get Analysis</>}
                        </Button>
                    </Form>
                  </>
              ) : (
                  // PHASE 2: AI RESULT
                  <div className="text-center fade-in">
                      <div className="mb-4">
                          <div className="d-inline-block p-3 rounded-circle bg-success bg-opacity-10 text-success mb-3">
                              <FaRobot size={40}/>
                          </div>
                          <h4 className="fw-bold">Analysis Complete!</h4>
                          <p className="text-muted px-lg-5">{aiAnalysisResult.analysis}</p>
                      </div>

                      {/* Adjustments Card - UPDATED MAPPING LOGIC */}
                      {aiAnalysisResult.nextWeekAdjustments?.length > 0 && (
                          <Card className="text-start border-0 bg-light mb-3">
                              <Card.Body>
                                  <h6 className="fw-bold text-danger mb-3 d-flex align-items-center"><FaFire className="me-2"/> Recommended Changes:</h6>
                                  <ul className="mb-0 ps-3" style={{ listStyle: 'none' }}>
                                      {aiAnalysisResult.nextWeekAdjustments.map((adj, i) => (
                                          <li key={i} className="mb-2 d-flex align-items-start">
                                              <FaArrowRight className="text-primary mt-1 me-2" size={12} />
                                              <span>{typeof adj === 'string' ? adj : adj.adjustment}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </Card.Body>
                          </Card>
                      )}

                      <Button onClick={closeAndReset} className="mt-3 px-5 rounded-pill" variant="outline-dark">Close & Rest</Button>
                  </div>
              )}
          </Modal.Body>
      </Modal>
    </>
  );
};

export default WorkoutLog;