import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Modal, Nav, Badge, Accordion } from "react-bootstrap"; 
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux"; 
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import { 
  FaUserShield, FaBell, FaPalette, FaGlobe, FaMoon, FaSun, 
  FaDesktop, FaTrashAlt, FaEnvelope, 
  FaLock, FaCheckCircle, FaExclamationTriangle
} from "react-icons/fa";
import { useDeleteUserMutation, useLogoutMutation } from "../slices/usersApiSlice"; 
import { logout } from "../slices/authSlice"; 

// ==========================================
// 1. SETTINGS CARD COMPONENT
// ==========================================
const SettingItem = ({ icon, title, desc, action }) => (
    <div className="setting-item d-flex align-items-center justify-content-between p-3 mb-3">
        <div className="d-flex align-items-center">
            <div className="setting-icon-box me-3">
                {icon}
            </div>
            <div>
                <h6 className="mb-0 fw-bold text-adaptive-head">{title}</h6>
                <small className="text-adaptive-sub">{desc}</small>
            </div>
        </div>
        <div>
            {action}
        </div>
    </div>
);

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
const Settings = () => {
  // --- REDUX STATE (REAL USER DATA) ---
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- API HOOKS ---
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [logoutApi] = useLogoutMutation();

  // --- LOCAL STATE ---
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [unit, setUnit] = useState(localStorage.getItem("unit") || "metric");
  const [notifications, setNotifications] = useState({
      email: true,
      push: true,
      marketing: false
  });
  
  // Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // --- EFFECTS (THEME SWITCHING) ---
  useEffect(() => {
    const body = document.body;
    if (theme === 'dark') { 
        body.classList.add('dark-mode'); 
    } else { 
        body.classList.remove('dark-mode'); 
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // --- HANDLERS ---
  const handleSavePreferences = () => {
      localStorage.setItem("unit", unit);
      toast.success("Preferences Updated Successfully!", { 
          icon: <FaCheckCircle className="text-success"/> 
      });
  };

  const handleToggle = (key) => {
      setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
      toast.info(`${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${!notifications[key] ? 'enabled' : 'disabled'}`);
  };

  // 🔥 FIXED: REAL EMAIL SENDING LOGIC (NO DEMO MESSAGE)
  const handleSendEmail = async () => {
    if(!emailMsg) return toast.error("Please type a message");
    
    setLoading(true);
    try {
        await axios.post('/api/support/send', {
            subject: "Help Request from App",
            message: emailMsg,
            userEmail: userInfo?.email || "User" 
        });
        
        toast.success("Email Sent Successfully! 📧");
        setShowEmailModal(false);
        setEmailMsg("");
        
    } catch (error) {
        console.error(error);
        // Display the actual error message from the backend
        const errMsg = error.response?.data?.message || error.message || "Failed to send email";
        toast.error(`Error: ${errMsg}`);
    }
    setLoading(false);
  };

  // --- DELETE ACCOUNT HANDLER ---
  const handleDeleteAccount = async () => {
    try {
        await deleteUser().unwrap();
        await logoutApi().unwrap(); // Clear server cookie
        dispatch(logout()); // Clear local state
        toast.success("Account deleted successfully");
        navigate("/login");
    } catch (err) {
        toast.error(err?.data?.message || err.error || "Failed to delete account");
    }
  };

  return (
    <div className="page-wrapper position-relative">
      
      {/* --- STYLES (SCOPED & FIXED DARK MODE) --- */}
      <style>
        {`
          /* GLOBAL THEME */
          .page-wrapper { min-height: 100vh; background-color: #f8f9fa; color: #212529; font-family: 'Inter', sans-serif; overflow-x: hidden; }
          body.dark-mode .page-wrapper { background-color: #0f172a; color: #fff; }

          /* SIDEBAR & CONTENT */
          .settings-sidebar { background: #fff; border-right: 1px solid #e9ecef; min-height: 100%; border-radius: 16px; overflow: hidden; }
          body.dark-mode .settings-sidebar { background: #1e293b; border-color: rgba(255,255,255,0.1); }

          /* Sidebar User Section */
          .sidebar-header { border-bottom: 1px solid #e9ecef; }
          body.dark-mode .sidebar-header { border-color: rgba(255,255,255,0.1); }

          /* Navigation Pills */
          .nav-pills .nav-link { 
              color: #6c757d; font-weight: 600; padding: 15px 20px; border-radius: 0; 
              display: flex; align-items: center; transition: 0.2s; border-left: 4px solid transparent;
          }
          .nav-pills .nav-link:hover { background: #f8f9fa; color: #0d6efd; }
          .nav-pills .nav-link.active { background: #e7f1ff; color: #0d6efd; border-left-color: #0d6efd; }
          
          body.dark-mode .nav-pills .nav-link { color: #94a3b8; }
          body.dark-mode .nav-pills .nav-link:hover { background: rgba(255,255,255,0.05); color: #fff; }
          body.dark-mode .nav-pills .nav-link.active { background: rgba(13, 110, 253, 0.2); color: #fff; border-left-color: #0d6efd; }

          /* MAIN CONTENT AREA */
          .settings-content { background-color: #fff; }
          body.dark-mode .settings-content { background-color: #0f172a; } 

          /* SETTING ITEMS */
          .setting-item { background: #fff; border: 1px solid #e9ecef; border-radius: 12px; transition: 0.3s; }
          .setting-item:hover { border-color: #0d6efd; box-shadow: 0 5px 15px rgba(0,0,0,0.05); transform: translateX(5px); }
          
          body.dark-mode .setting-item { background: #1e293b; border-color: rgba(255,255,255,0.1); }
          body.dark-mode .setting-item:hover { border-color: #38bdf8; background: rgba(255,255,255,0.05); }

          .setting-icon-box { 
              width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; 
              background: #e7f1ff; color: #0d6efd; font-size: 1.2rem;
          }
          body.dark-mode .setting-icon-box { background: rgba(13, 110, 253, 0.2); color: #fff; }

          /* TEXT COLORS */
          .text-adaptive-head { color: #212529; }
          body.dark-mode .text-adaptive-head { color: #fff !important; }
          .text-adaptive-sub { color: #6c757d; }
          body.dark-mode .text-adaptive-sub { color: #94a3b8 !important; }

          /* FORM CONTROLS */
          .form-control, .form-select { background-color: #fff; border: 1px solid #ced4da; color: #212529; border-radius: 8px; padding: 10px; }
          body.dark-mode .form-control, body.dark-mode .form-select { background-color: #1e293b; border: 1px solid rgba(255,255,255,0.15); color: #fff !important; }
          
          /* Switches & Checks */
          .form-check-input { cursor: pointer; }
          body.dark-mode .form-check-input { background-color: #334155; border-color: #666; }
          body.dark-mode .form-check-input:checked { background-color: #0d6efd; border-color: #0d6efd; }

          /* MODAL & UTILS */
          body.dark-mode .modal-content { background-color: #1e293b; color: white; }
          body.dark-mode .btn-close { filter: invert(1); }
          
          /* Cards within Content */
          .hover-shadow:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
          .transition { transition: all 0.3s ease; }
          
          /* ACCORDION FIXES */
          .accordion-item { border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; margin-bottom: 5px; }
          .accordion-button { font-weight: 600; color: #212529; background-color: #fff; }
          .accordion-button:not(.collapsed) { background-color: #e7f1ff; color: #0d6efd; }
          .accordion-body { font-size: 0.9rem; color: #6c757d; }

          body.dark-mode .accordion-item { border-color: rgba(255,255,255,0.1); background: transparent; }
          body.dark-mode .accordion-button { background-color: #1e293b; color: #fff; }
          body.dark-mode .accordion-button:not(.collapsed) { background-color: rgba(13, 110, 253, 0.2); color: #fff; }
          body.dark-mode .accordion-body { color: #94a3b8; }
          body.dark-mode .accordion-button::after { filter: invert(1); }

          .fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>

      <Container className="py-5" style={{maxWidth: '1100px'}}>
        
        {/* HEADER */}
        <div className="mb-5 fade-in">
           <h1 className="fw-bold display-5 mb-2 text-adaptive-head">Settings</h1>
           <p className="text-adaptive-sub">Manage your preferences and account security.</p>
        </div>

        <Row className="g-0 shadow-sm rounded-4 overflow-hidden fade-in" style={{animationDelay: '0.1s'}}>
            
            {/* SIDEBAR NAVIGATION */}
            <Col lg={3} className="settings-sidebar">
                <div className="p-4 sidebar-header">
                    <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle p-2 me-2 fw-bold d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}>
                            {userInfo ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            {/* REAL USER NAME */}
                            <h6 className="mb-0 fw-bold text-adaptive-head">{userInfo ? userInfo.name : 'Guest User'}</h6>
                            <small className="text-muted">{userInfo ? 'Member' : 'Free Plan'}</small>
                        </div>
                    </div>
                </div>
                <Nav className="flex-column nav-pills py-3">
                    <Nav.Link active={activeTab === "general"} onClick={() => setActiveTab("general")}>
                        <FaPalette className="me-3"/> Appearance
                    </Nav.Link>
                    <Nav.Link active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")}>
                        <FaBell className="me-3"/> Notifications
                    </Nav.Link>
                    <Nav.Link active={activeTab === "security"} onClick={() => setActiveTab("security")}>
                        <FaUserShield className="me-3"/> Security
                    </Nav.Link>
                    <Nav.Link active={activeTab === "support"} onClick={() => setActiveTab("support")}>
                        <FaEnvelope className="me-3"/> Support
                    </Nav.Link>
                </Nav>
            </Col>

            {/* CONTENT AREA */}
            <Col lg={9} className="settings-content p-4 p-lg-5">
                
                {/* --- GENERAL TAB --- */}
                {activeTab === "general" && (
                    <div className="fade-in">
                        <h4 className="fw-bold mb-4 text-adaptive-head">Appearance & Preferences</h4>
                        
                        <div className="mb-4">
                            <label className="text-muted fw-bold small mb-3">THEME SETTINGS</label>
                            <SettingItem 
                                icon={theme === 'light' ? <FaSun/> : <FaMoon/>}
                                title="Interface Theme"
                                desc={`Currently using ${theme} mode`}
                                action={
                                    <Form.Select 
                                        value={theme} 
                                        onChange={(e) => setTheme(e.target.value)}
                                        style={{width: '150px'}}
                                        size="sm"
                                    >
                                        <option value="light">Light Mode</option>
                                        <option value="dark">Dark Mode</option>
                                    </Form.Select>
                                }
                            />
                        </div>

                        <div className="mb-4">
                            <label className="text-muted fw-bold small mb-3">REGIONAL</label>
                            <SettingItem 
                                icon={<FaGlobe/>}
                                title="Measurement Units"
                                desc="Select your preferred system for weight & height"
                                action={
                                    <div className="d-flex bg-light p-1 rounded border">
                                        <Button 
                                            variant={unit === 'metric' ? 'white' : 'transparent'} 
                                            size="sm" 
                                            className={`shadow-sm ${unit === 'metric' ? 'bg-white text-primary' : 'text-muted'}`}
                                            onClick={() => setUnit('metric')}
                                        >
                                            Metric
                                        </Button>
                                        <Button 
                                            variant={unit === 'imperial' ? 'white' : 'transparent'} 
                                            size="sm" 
                                            className={`shadow-sm ${unit === 'imperial' ? 'bg-white text-primary' : 'text-muted'}`}
                                            onClick={() => setUnit('imperial')}
                                        >
                                            Imperial
                                        </Button>
                                    </div>
                                }
                            />
                        </div>

                        <div className="text-end mt-4">
                            <Button variant="primary" onClick={handleSavePreferences} className="px-4 fw-bold">Save Changes</Button>
                        </div>
                    </div>
                )}

                {/* --- NOTIFICATIONS TAB --- */}
                {activeTab === "notifications" && (
                    <div className="fade-in">
                        <h4 className="fw-bold mb-4 text-adaptive-head">Notification Settings</h4>
                        
                        <div className="mb-4">
                            <label className="text-muted fw-bold small mb-3">CHANNELS</label>
                            <SettingItem 
                                icon={<FaEnvelope/>}
                                title="Email Digests"
                                desc="Weekly summaries of your progress"
                                action={
                                    <Form.Check 
                                        type="switch" 
                                        checked={notifications.email} 
                                        onChange={() => handleToggle('email')} 
                                    />
                                }
                            />
                            <SettingItem 
                                icon={<FaBell/>}
                                title="Push Notifications"
                                desc="Real-time alerts for workouts & meals"
                                action={
                                    <Form.Check 
                                        type="switch" 
                                        checked={notifications.push} 
                                        onChange={() => handleToggle('push')} 
                                    />
                                }
                            />
                            <SettingItem 
                                icon={<FaCheckCircle/>}
                                title="Product Updates"
                                desc="News about new features and improvements"
                                action={
                                    <Form.Check 
                                        type="switch" 
                                        checked={notifications.marketing} 
                                        onChange={() => handleToggle('marketing')} 
                                    />
                                }
                            />
                        </div>
                    </div>
                )}

                {/* --- SECURITY TAB (UPDATED: ONLY CURRENT DEVICE) --- */}
                {activeTab === "security" && (
                    <div className="fade-in">
                        <h4 className="fw-bold mb-4 text-adaptive-head">Security & Login</h4>
                        
                        <div className="mb-5">
                            <label className="text-muted fw-bold small mb-3">ACTIVE SESSION</label>
                            
                            {/* Only displaying Current Device now */}
                            <SettingItem 
                                icon={<FaDesktop/>}
                                title="Current Device"
                                desc="This session • Active Now"
                                action={<Badge bg="success">Online</Badge>}
                            />
                        </div>

                        <div className="p-4 rounded-3 bg-danger bg-opacity-10 border border-danger">
                            <h6 className="text-danger fw-bold"><FaExclamationTriangle className="me-2"/>Danger Zone</h6>
                            <p className="small text-muted mb-3">Once you delete your account, there is no going back. Please be certain.</p>
                            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                                Delete Account
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- SUPPORT TAB (UPDATED: EXPANDABLE FAQ) --- */}
                {activeTab === "support" && (
                    <div className="fade-in">
                        <h4 className="fw-bold mb-4 text-adaptive-head">Help & Support</h4>
                        
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <div className="p-4 border rounded-3 text-center h-100 hover-shadow cursor-pointer transition setting-item">
                                    <FaLock size={30} className="text-primary mb-3"/>
                                    <h6 className="fw-bold text-adaptive-head">Privacy Policy</h6>
                                    <p className="small text-muted mb-0">Read how we handle data</p>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="p-4 border rounded-3 text-center h-100 hover-shadow cursor-pointer transition setting-item" onClick={() => setShowEmailModal(true)}>
                                    <FaEnvelope size={30} className="text-success mb-3"/>
                                    <h6 className="fw-bold text-adaptive-head">Contact Us</h6>
                                    <p className="small text-muted mb-0">Get help from our team</p>
                                </div>
                            </Col>
                        </Row>

                        <div className="mt-5">
                            <h6 className="fw-bold text-adaptive-head mb-3">Frequently Asked Questions</h6>
                            <Accordion defaultActiveKey="0">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>How do I reset my password?</Accordion.Header>
                                    <Accordion.Body>
                                        Go to the <strong>Profile Page</strong>, select the <strong>Security</strong> tab, and use the "Update Password" form. You will need your current password to authorize changes.
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="1">
                                    <Accordion.Header>Can I export my data?</Accordion.Header>
                                    <Accordion.Body>
                                        Yes! Go to the <strong>Profile Page</strong> and click the <strong>Export Data</strong> button in the top right corner. It will download a JSON file with all your logs.
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="2">
                                    <Accordion.Header>Is my payment information secure?</Accordion.Header>
                                    <Accordion.Body>
                                        Shape Up uses industry-standard encryption. We do not store your credit card details directly on our servers; payments are processed via secure third-party gateways.
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </div>
                    </div>
                )}

            </Col>
        </Row>

        {/* --- CONTACT MODAL --- */}
        <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold h5">Contact Support</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group>
                    <Form.Label className="fw-bold small text-muted">DESCRIBE YOUR ISSUE</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={5} 
                        value={emailMsg} 
                        onChange={(e) => setEmailMsg(e.target.value)}
                        placeholder="We usually reply within 24 hours..." 
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSendEmail} disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
                </Button>
            </Modal.Footer>
        </Modal>

        {/* --- DELETE CONFIRMATION MODAL --- */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
            <Modal.Header closeButton className="bg-danger text-white">
                <Modal.Title className="fw-bold h5"><FaTrashAlt className="me-2"/>Delete Account?</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center p-4">
                <p className="mb-0 text-adaptive-head">
                    Are you absolutely sure? This action cannot be undone. All your workout logs and data will be permanently removed.
                </p>
            </Modal.Body>
            <Modal.Footer className="justify-content-center border-0 pb-4">
                <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button 
                    variant="danger" 
                    className="fw-bold" 
                    onClick={handleDeleteAccount} // ATTACHED THE HANDLER HERE
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                </Button>
            </Modal.Footer>
        </Modal>

      </Container>
    </div>
  );
};

export default Settings;