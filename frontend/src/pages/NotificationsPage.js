import React, { useState } from "react"; // Removed useEffect import
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { useGetRemindersQuery, useCreateReminderMutation, useDeleteReminderMutation } from "../slices/reminderSlice";
import Loader from "../components/Loader";

const NotificationsPage = () => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("General");

  const { data: reminders, isLoading } = useGetRemindersQuery();
  const [createReminder, { isLoading: isCreating }] = useCreateReminderMutation();
  const [deleteReminder] = useDeleteReminderMutation();

  // NOTE: Logic moved to Header.js for Global Access
  // Humne yahan se interval hata diya hai

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!title || !time) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await createReminder({ title, time, type }).unwrap();
      toast.success("Reminder Set!");
      setTitle("");
      setTime("");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this reminder?")) {
        await deleteReminder(id);
        toast.success("Deleted");
    }
  };
  
  // Test Button Handler
  const testSound = () => {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play();
      toast.info("🔔 This is how the alert will sound!");
  }

  return (
    <Container className="py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>🔔 Notifications & Alerts</h2>
          <p className="text-muted">Set daily reminders. Alerts will show up on any page.</p>
        </Col>
        <Col xs="auto">
            <Button variant="outline-info" size="sm" onClick={testSound}>Test Sound 🔊</Button>
        </Col>
      </Row>

      <Row>
        {/* LEFT: FORM */}
        <Col md={5} className="mb-4">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-primary text-white">Set New Reminder</Card.Header>
            <Card.Body>
              <Form onSubmit={submitHandler}>
                <Form.Group className="mb-3">
                  <Form.Label>Reminder Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. Morning Jog" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Time</Form.Label>
                  <Form.Control 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                  <Form.Text className="text-muted">Alert triggers at this time daily.</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                   <Form.Label>Category</Form.Label>
                   <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="General">General</option>
                      <option value="Workout">Workout</option>
                      <option value="Meal">Meal</option>
                      <option value="Water">Water</option>
                   </Form.Select>
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100" disabled={isCreating}>
                  {isCreating ? "Setting..." : "Set Reminder"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT: LIST */}
        <Col md={7}>
          {isLoading ? <Loader /> : (
            <>
              {reminders?.length === 0 ? (
                <Alert variant="info">No reminders set yet.</Alert>
              ) : (
                <ListGroup variant="flush" className="shadow-sm rounded">
                  {reminders?.map((rem) => (
                    <ListGroup.Item key={rem._id} className="d-flex justify-content-between align-items-center p-3">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                           <h5 className="mb-0">{rem.time}</h5>
                           <Badge bg={rem.type === 'Workout' ? 'danger' : rem.type === 'Meal' ? 'success' : 'secondary'}>
                              {rem.type}
                           </Badge>
                        </div>
                        <span className="text-muted">{rem.title}</span>
                      </div>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(rem._id)}>
                        Delete
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default NotificationsPage;