import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card, Alert } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useUpdateUserMutation } from "../slices/usersApiSlice";
import { setCredentials } from "../slices/authSlice";
import { FaCalculator, FaUserEdit } from "react-icons/fa";

const UpdateProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Physical Stats
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("Moderately Active");
  const [goal, setGoal] = useState("Maintain");

  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const [updateProfile, { isLoading }] = useUpdateUserMutation();

  useEffect(() => {
    if (userInfo) {
        setName(userInfo.name);
        setEmail(userInfo.email);
        setAge(userInfo.age || 25);
        setGender(userInfo.gender || "Male");
        setHeight(userInfo.height || 170);
        setWeight(userInfo.weight || 70);
        setActivityLevel(userInfo.activityLevel || "Moderately Active");
        setGoal(userInfo.goal || "Maintain");
    }
  }, [userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({
        _id: userInfo._id,
        name, email, password,
        age, gender, height, weight, activityLevel, goal
      }).unwrap();

      dispatch(setCredentials({ ...res }));
      toast.success("Profile Updated & Macros Recalculated! 🚀");
    } catch (err) {
      toast.error(err?.data?.message || "Update failed");
    }
  };

  return (
    <Card className="border-0 shadow-sm p-4">
      <div className="d-flex align-items-center mb-4">
          <FaUserEdit className="text-primary me-2" size={24}/>
          <h4 className="fw-bold mb-0">Profile & Goals</h4>
      </div>

      {userInfo?.macros && (
          <Alert variant="info" className="mb-4">
              <h6 className="fw-bold mb-2"><FaCalculator className="me-2"/>Your New Daily Targets</h6>
              <Row className="text-center">
                  <Col><strong>{userInfo.macros.calories}</strong><br/><small>Calories</small></Col>
                  <Col><strong>{userInfo.macros.protein}g</strong><br/><small>Protein</small></Col>
                  <Col><strong>{userInfo.macros.carbs}g</strong><br/><small>Carbs</small></Col>
                  <Col><strong>{userInfo.macros.fats}g</strong><br/><small>Fats</small></Col>
              </Row>
          </Alert>
      )}

      <Form onSubmit={submitHandler}>
        <Row>
            <Col md={6}>
                <Form.Group className="mb-3"><Form.Label>Full Name</Form.Label><Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} /></Form.Group>
            </Col>
            <Col md={6}>
                <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Form.Group>
            </Col>
        </Row>

        <h6 className="fw-bold mt-3 text-muted">Physical Stats (For AI Accuracy)</h6>
        <Row>
            <Col md={3}>
                <Form.Group className="mb-3"><Form.Label>Age</Form.Label><Form.Control type="number" value={age} onChange={(e) => setAge(e.target.value)} /></Form.Group>
            </Col>
            <Col md={3}>
                <Form.Group className="mb-3"><Form.Label>Gender</Form.Label>
                <Form.Select value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option>Male</option><option>Female</option>
                </Form.Select>
                </Form.Group>
            </Col>
            <Col md={3}>
                <Form.Group className="mb-3"><Form.Label>Height (cm)</Form.Label><Form.Control type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></Form.Group>
            </Col>
            <Col md={3}>
                <Form.Group className="mb-3"><Form.Label>Weight (kg)</Form.Label><Form.Control type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></Form.Group>
            </Col>
        </Row>

        <h6 className="fw-bold mt-3 text-muted">Strategy</h6>
        <Row>
            <Col md={6}>
                <Form.Group className="mb-3"><Form.Label>Goal</Form.Label>
                <Form.Select value={goal} onChange={(e) => setGoal(e.target.value)}>
                    <option value="Lose Weight">Lose Weight (Cut)</option>
                    <option value="Maintain">Maintain Weight</option>
                    <option value="Gain Muscle">Gain Muscle (Bulk)</option>
                </Form.Select>
                </Form.Group>
            </Col>
            <Col md={6}>
                <Form.Group className="mb-3"><Form.Label>Activity Level</Form.Label>
                <Form.Select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                    <option value="Sedentary">Sedentary (Office Job)</option>
                    <option value="Lightly Active">Lightly Active (1-3 days gym)</option>
                    <option value="Moderately Active">Moderately Active (3-5 days gym)</option>
                    <option value="Very Active">Very Active (6-7 days gym)</option>
                    <option value="Extra Active">Extra Active (Athlete)</option>
                </Form.Select>
                </Form.Group>
            </Col>
        </Row>

        <Button type="submit" variant="primary" className="w-100 mt-3 fw-bold" disabled={isLoading}>
           {isLoading ? "Calculating..." : "Update Profile & Recalculate"}
        </Button>
      </Form>
    </Card>
  );
};

export default UpdateProfile;