import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Card, Alert } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { useUpdateUserProfileMutation } from "../slices/usersApiSlice";
import { setCredentials } from "../slices/authSlice";
import PersonIcon from '@mui/icons-material/Person';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

const Profile = () => {
  // Account State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Body Stats State
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("Male");
  const [goal, setGoal] = useState("Maintain");

  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const [updateProfile, { isLoading }] = useUpdateUserProfileMutation();

  useEffect(() => {
    if (userInfo) {
        setName(userInfo.name);
        setEmail(userInfo.email);
        // Sirf tab value set karein agar exist karti ho, warna empty string (taake 0 na dikhe)
        setAge(userInfo.age || "");
        setHeight(userInfo.height || "");
        setWeight(userInfo.weight || "");
        setGender(userInfo.gender || "Male");
        setGoal(userInfo.goal || "Maintain");
    }
  }, [userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
    } else {
      try {
        const res = await updateProfile({
          _id: userInfo._id,
          name,
          email,
          password,
          age: Number(age),      // Ensure Number format
          height: Number(height), // Ensure Number format
          weight: Number(weight), // Ensure Number format
          gender,
          goal 
        }).unwrap();
        
        dispatch(setCredentials({ ...res }));
        toast.success("Profile Updated Successfully!");
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">👤 User Profile</h2>
      <Form onSubmit={submitHandler}>
        <Row>
          {/* LEFT: ACCOUNT */}
          <Col md={6} className="mb-4">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white fw-bold d-flex align-items-center gap-2">
                 <PersonIcon /> Account Info
              </Card.Header>
              <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control type="password" placeholder="Leave blank to keep" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* RIGHT: BODY & GOALS */}
          <Col md={6} className="mb-4">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white fw-bold d-flex align-items-center gap-2">
                 <FitnessCenterIcon /> Body & Goals
              </Card.Header>
              <Card.Body>
                  {/* Show Warning only if data is missing */}
                  {(!userInfo?.weight || userInfo?.weight === 0) && (
                      <Alert variant="warning" className="py-2 small">
                          ⚠️ Please complete your profile to generate your daily goals!
                      </Alert>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-primary">Your Fitness Goal</Form.Label>
                    <Form.Select value={goal} onChange={(e) => setGoal(e.target.value)} size="lg">
                        <option value="Cut">✂️ Cut (Weight Loss)</option>
                        <option value="Maintain">⚖️ Maintain Weight</option>
                        <option value="Bulk">💪 Bulk (Muscle Gain)</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                        {goal === 'Cut' && "Deficit: -500 calories/day"}
                        {goal === 'Bulk' && "Surplus: +500 calories/day"}
                        {goal === 'Maintain' && "Standard Maintenance Calories"}
                    </Form.Text>
                  </Form.Group>
                  <hr />

                  <Row>
                      <Col xs={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Age</Form.Label>
                            <Form.Control type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                          </Form.Group>
                      </Col>
                      <Col xs={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Gender</Form.Label>
                            <Form.Select value={gender} onChange={(e) => setGender(e.target.value)}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </Form.Select>
                          </Form.Group>
                      </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Height (cm)</Form.Label>
                    <Form.Control type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 175" />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Current Weight (kg)</Form.Label>
                    <Form.Control type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 70" />
                  </Form.Group>
                  
                  <div className="d-grid mt-4">
                     <Button type="submit" variant="primary" disabled={isLoading} size="lg">
                        {isLoading ? <Loader size="sm" /> : "Save Changes"}
                     </Button>
                  </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default Profile;