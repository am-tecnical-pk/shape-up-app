import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Accordion, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios"; // Import Axios
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EmailIcon from '@mui/icons-material/Email';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';

const Settings = () => {
  // ... existing state ...
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [unit, setUnit] = useState(localStorage.getItem("unit") || "metric");
  const [notifications, setNotifications] = useState(true);

  // 👇 New State for Email Modal
  const [showModal, setShowModal] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ... existing useEffect ...
  useEffect(() => {
    const body = document.body;
    if (theme === 'dark') { body.classList.add('dark-mode'); } 
    else { body.classList.remove('dark-mode'); }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ... existing handleSaveSettings ...
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("unit", unit);
    toast.success("Preferences Saved Successfully!");
  };

  // 👇 Function to Send Email via Backend
  const handleSendEmail = async () => {
    if(!emailMsg) return toast.error("Please type a message");
    
    setLoading(true);
    try {
        await axios.post('/api/support/send', {
            subject: "Help Request from App",
            message: emailMsg,
            userEmail: "User from App" // You can replace this with actual user email if logged in
        });
        toast.success("Email Sent! We will contact you shortly.");
        setShowModal(false);
        setEmailMsg("");
    } catch (error) {
        toast.error("Failed to send email. Try again.");
    }
    setLoading(false);
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">⚙️ Settings & Support</h2>
      
      <Row>
        {/* ... LEFT SIDE (Preferences) ... */}
        <Col md={6} className="mb-4">
            {/* ... Keep your existing Left Column code here ... */}
             <Card className="shadow-sm border-0 h-100">
            <Card.Header className="fw-bold bg-white py-3">User Preferences</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSaveSettings}>
                <Form.Group className="mb-3">
                  <Form.Label>App Theme</Form.Label>
                  <Form.Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="light">Light Mode ☀️</option>
                    <option value="dark">Dark Mode 🌙</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Units of Measurement</Form.Label>
                  <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="metric">Metric (Kg, Cm, Liters)</option>
                    <option value="imperial">Imperial (Lbs, Feet, Ounces)</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Check type="switch" label="Enable Daily Reminders & Alerts" checked={notifications} onChange={(e) => setNotifications(e.target.checked)}/>
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100 mt-2">Save Preferences</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* --- RIGHT: SUPPORT SECTION --- */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="fw-bold bg-white py-3 d-flex align-items-center gap-2">
                <HelpOutlineIcon color="primary" /> Help & Support
            </Card.Header>
            <Card.Body>
              <p className="small text-muted mb-3">Check common questions or reach out to our team.</p>
              
              <Accordion flush className="mb-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>How to log daily meals?</Accordion.Header>
                  <Accordion.Body className="small">Navigate to the "Nutrition" page...</Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>What is the AI assistant for?</Accordion.Header>
                  <Accordion.Body className="small">Shape Up AI can suggest workout plans...</Accordion.Body>
                </Accordion.Item>
              </Accordion>

              <hr />

              <div className="mt-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <LiveHelpIcon fontSize="small" /> Need more help?
                </h6>
                <div className="d-grid gap-2">
                    {/* 👇 UPDATED BUTTON OPENS MODAL */}
                    <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => setShowModal(true)} 
                        className="d-flex align-items-center justify-content-center gap-2"
                    >
                        <EmailIcon fontSize="small" /> Contact Support
                    </Button>
                    
                    <p className="text-center text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                        Or use the floating 🤖 <strong>Shape Up AI</strong> bubble.
                    </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 👇 EMAIL MODAL POPUP */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Contact Support</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form.Group>
                <Form.Label>How can we help?</Form.Label>
                <Form.Control 
                    as="textarea" 
                    rows={4} 
                    value={emailMsg} 
                    onChange={(e) => setEmailMsg(e.target.value)}
                    placeholder="Describe your issue..." 
                />
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSendEmail} disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default Settings;