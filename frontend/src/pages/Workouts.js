import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";

import ExerciseDB from "../components/ExerciseDB";
import WorkoutLog from "../components/WorkoutLog"; 
import Footer from "../components/Footer";

const Workouts = () => {
  // 1. STATE TO HOLD SELECTED EXERCISE
  const [pickedExercise, setPickedExercise] = useState(null);

  return (
    <>
      <Container fluid="lg" className="py-5">
        <Row className="g-5">
            
            {/* LEFT: WORKOUT LOG (Receives the picked exercise) */}
            <Col lg={5} md={12} className="mb-4 mb-lg-0">
                <div className="sticky-top" style={{ top: "20px", zIndex: 1 }}>
                    <WorkoutLog selectedExercise={pickedExercise} />
                </div>
            </Col>

            {/* RIGHT: EXERCISE DB (Sends the picked exercise) */}
            <Col lg={7} md={12}>
                <div className="mb-4">
                    <h3 className="fw-bold m-0">Exercise Database</h3>
                    <p className="text-muted">Click any card to add it to your log.</p>
                </div>
                
                {/* Pass the setter function down */}
                <ExerciseDB onSelectExercise={setPickedExercise} />
            </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default Workouts;