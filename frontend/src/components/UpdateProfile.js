import { useState, useEffect } from "react";
import { Form, Button, Image, Row, Col, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { useUpdateUserMutation } from "../slices/usersApiSlice";
import { setCredentials } from "../slices/authSlice";
import Loader from "./Loader";

const UpdateProfile = ({ userInfo, dispatch }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Physical Stats
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("Maintain");
  const [activityLevel, setActivityLevel] = useState("Moderately Active");

  // Image
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [updateProfile, { isLoading }] = useUpdateUserMutation();
  const CLOUD_NAME = "df1sgdor0"; 
  const UPLOAD_PRESET = "profile_pic"; 

  useEffect(() => {
    if (userInfo) {
        setName(userInfo.name);
        setEmail(userInfo.email);
        setImage(userInfo.image || "");
        setAge(userInfo.age || 25);
        setHeight(userInfo.height || 170);
        setWeight(userInfo.weight || 70);
        setGoal(userInfo.goal || "Maintain");
        setActivityLevel(userInfo.activityLevel || "Moderately Active");
    }
  }, [userInfo]);

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    setUploading(true);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await response.json();
      if (data.secure_url) { setImage(data.secure_url); toast.success("Image uploaded!"); }
      setUploading(false);
    } catch (error) { setUploading(false); toast.error("Upload failed"); }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    
    try {
      const res = await updateProfile({
        _id: userInfo._id, name, email, password, image,
        age, height, weight, goal, activityLevel
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      toast.success("Profile Updated & Macros Recalculated! 🔄");
    } catch (err) { toast.error(err?.data?.message || err.error); }
  };

  return (
    <Form onSubmit={submitHandler}>
      {/* MACROS PREVIEW */}
      {userInfo?.macros && (
          <Alert variant="info" className="text-center">
             <strong>Current Daily Target:</strong> {userInfo.macros.calories} Calories
             <br/><small>(Update stats below to recalculate)</small>
          </Alert>
      )}

      {/* Profile Pic */}
      <Form.Group className="my-3 text-center">
         <Row className="justify-content-center">
             <Col xs={6} md={4}>
                <Image src={imagePreview || image || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} roundedCircle thumbnail style={{ width: "120px", height: "120px", objectFit: "cover" }} />
             </Col>
         </Row>
         <Form.Label className="mt-2 text-muted small">Change Photo</Form.Label>
         <Form.Control type="file" onChange={uploadFileHandler} accept="image/*" size="sm"/>
      </Form.Group>

      <Row>
          <Col md={6}><Form.Group className="my-2"><Form.Label>Name</Form.Label><Form.Control type="name" value={name} onChange={(e) => setName(e.target.value)}/></Form.Group></Col>
          <Col md={6}><Form.Group className="my-2"><Form.Label>Email</Form.Label><Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)}/></Form.Group></Col>
      </Row>

      <h6 className="mt-4 text-primary fw-bold">Physical Stats (Required for AI)</h6>
      <Row>
          <Col md={4}><Form.Group className="my-2"><Form.Label>Age</Form.Label><Form.Control type="number" value={age} onChange={(e) => setAge(e.target.value)}/></Form.Group></Col>
          <Col md={4}><Form.Group className="my-2"><Form.Label>Height (cm)</Form.Label><Form.Control type="number" value={height} onChange={(e) => setHeight(e.target.value)}/></Form.Group></Col>
          <Col md={4}><Form.Group className="my-2"><Form.Label>Weight (kg)</Form.Label><Form.Control type="number" value={weight} onChange={(e) => setWeight(e.target.value)}/></Form.Group></Col>
      </Row>

      <Row>
          <Col md={6}>
              <Form.Group className="my-2"><Form.Label>Goal</Form.Label>
              <Form.Select value={goal} onChange={(e) => setGoal(e.target.value)}>
                  <option value="Cut">Cut (Lose Weight)</option>
                  <option value="Maintain">Maintain</option>
                  <option value="Bulk">Bulk (Gain Muscle)</option>
              </Form.Select>
              </Form.Group>
          </Col>
          <Col md={6}>
              <Form.Group className="my-2"><Form.Label>Activity Level</Form.Label>
              <Form.Select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                  <option value="Sedentary">Sedentary (Desk Job)</option>
                  <option value="Lightly Active">Lightly Active (1-3 days gym)</option>
                  <option value="Moderately Active">Moderately Active (3-5 days gym)</option>
                  <option value="Very Active">Very Active (6-7 days gym)</option>
              </Form.Select>
              </Form.Group>
          </Col>
      </Row>

      <h6 className="mt-4 text-primary fw-bold">Security</h6>
      <Row>
          <Col md={6}><Form.Group className="my-2"><Form.Label>New Password</Form.Label><Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)}/></Form.Group></Col>
          <Col md={6}><Form.Group className="my-2"><Form.Label>Confirm Password</Form.Label><Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/></Form.Group></Col>
      </Row>

      {isLoading && <Loader />}
      <Button type="submit" variant="primary" className="mt-3 mb-3 w-100 fw-bold">Sync & Update Profile</Button>
    </Form>
  );
};
export default UpdateProfile;