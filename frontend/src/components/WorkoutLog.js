import React, { useState, useEffect } from "react";
import { Card, Form, Button, Table, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useCreateWorkoutMutation, useGetWorkoutByDateQuery } from "../slices/workoutsApiSlice";

const WorkoutLog = ({ selectedExercise }) => { // <--- Receive Prop
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const [createWorkout, { isLoading }] = useCreateWorkoutMutation();
  const { data: workoutData, refetch } = useGetWorkoutByDateQuery(date);

  // 👇 AUTO-FILL WHEN EXERCISE IS SELECTED 👇
  useEffect(() => {
    if (selectedExercise) {
        setExerciseName(selectedExercise.name);
    }
  }, [selectedExercise]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseName || !sets || !reps) {
        toast.error("Please fill in all fields");
        return;
    }

    try {
        await createWorkout({
            date,
            exercises: [{
                name: exerciseName,
                sets: Number(sets),
                reps: Number(reps),
                weight: Number(weight) || 0
            }]
        }).unwrap();

        toast.success("Exercise Added!");
        setExerciseName("");
        setSets("");
        setReps("");
        setWeight("");
        refetch(); // Refresh list
    } catch (err) {
        toast.error(err?.data?.message || "Failed to add workout");
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Daily Workout Log</h5>
      </Card.Header>
      <Card.Body>
        {/* Date Picker */}
        <Form.Group className="mb-3">
            <Form.Label>Select Date</Form.Label>
            <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Form.Group>

        {/* Add Form */}
        <Form onSubmit={handleSubmit} className="p-3 bg-light rounded border mb-3">
            <h6 className="mb-3">Add New Exercise</h6>
            
            <Form.Group className="mb-2">
                <Form.Control 
                    type="text" 
                    placeholder="Exercise Name (Select from right ->)" 
                    value={exerciseName} 
                    onChange={(e) => setExerciseName(e.target.value)}
                    required
                />
            </Form.Group>

            <Row className="g-2">
                <Col xs={4}>
                    <Form.Control type="number" placeholder="Sets" value={sets} onChange={(e) => setSets(e.target.value)} required />
                </Col>
                <Col xs={4}>
                    <Form.Control type="number" placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} required />
                </Col>
                <Col xs={4}>
                    <Form.Control type="number" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </Col>
            </Row>

            <Button type="submit" variant="success" className="w-100 mt-3" disabled={isLoading}>
                {isLoading ? "Saving..." : "+ Add to Log"}
            </Button>
        </Form>

        {/* Today's List */}
        <h6 className="mt-4">Exercises for {date}</h6>
        <div className="table-responsive" style={{maxHeight: "300px", overflowY: "auto"}}>
            <Table size="sm" striped hover>
                <thead>
                    <tr>
                        <th>Exercise</th>
                        <th>Sets</th>
                        <th>Reps</th>
                        <th>Kg</th>
                    </tr>
                </thead>
                <tbody>
                    {workoutData && workoutData.exercises && workoutData.exercises.length > 0 ? (
                        workoutData.exercises.map((ex, idx) => (
                            <tr key={idx}>
                                <td>{ex.name}</td>
                                <td>{ex.sets}</td>
                                <td>{ex.reps}</td>
                                <td>{ex.weight}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="text-center text-muted">No exercises logged yet.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WorkoutLog;