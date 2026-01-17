import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Form, Button, Badge, Modal, Card, Tab, Nav } from "react-bootstrap";
import { toast } from "react-toastify";
import { useGetRemindersQuery, useCreateReminderMutation, useDeleteReminderMutation } from "../slices/reminderSlice";
import Loader from "../components/Loader";
import { 
  FaBell, FaTrashAlt, FaRunning, FaUtensils, FaTint, 
  FaPlusCircle, FaVolumeUp, FaClock, FaCalendarAlt, 
  FaCheckCircle, FaExclamationCircle, FaPlay, FaStop, FaMusic 
} from "react-icons/fa";

// ==========================================
// 1. DATA & CONSTANTS
// ==========================================
const SOUND_LIBRARY = [
    { id: 'classic', name: 'Classic Alarm', url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
    { id: 'digital', name: 'Digital Beep', url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
    { id: 'nature', name: 'Morning Birds', url: 'https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg' },
    { id: 'scifi', name: 'Sci-Fi Alert', url: 'https://actions.google.com/sounds/v1/science_fiction/scifi_alarm.ogg' }
];

const CATEGORIES = [
    { id: 'General', label: 'General', icon: <FaBell/>, color: '#0d6efd' },
    { id: 'Workout', label: 'Workout', icon: <FaRunning/>, color: '#6610f2' },
    { id: 'Meal', label: 'Meal Prep', icon: <FaUtensils/>, color: '#ffc107' },
    { id: 'Water', label: 'Hydration', icon: <FaTint/>, color: '#0dcaf0' }
];

// ==========================================
// 2. SUB-COMPONENTS
// ==========================================

const StatCard = ({ icon, value, label, color }) => (
    <div className="stat-card fade-in">
        <div className="stat-icon" style={{color: color, background: `${color}20`}}>{icon}</div>
        <div>
            <h4 className="fw-bold mb-0 text-adaptive-head">{value}</h4>
            <small className="text-adaptive-sub fw-bold">{label}</small>
        </div>
    </div>
);

const SoundCard = ({ sound, isPlaying, onPlay, onStop }) => (
    <div className={`sound-card ${isPlaying ? 'playing' : ''}`} onClick={() => isPlaying ? onStop() : onPlay(sound)}>
        <div className="d-flex align-items-center">
            <div className={`p-2 rounded-circle me-3 ${isPlaying ? 'bg-danger text-white' : 'bg-light text-muted'}`}>
                {isPlaying ? <FaStop/> : <FaPlay/>}
            </div>
            <div>
                <h6 className="mb-0 fw-bold">{sound.name}</h6>
                <small className="text-muted">Tap to preview</small>
            </div>
        </div>
        {isPlaying && <div className="equalizer"><span></span><span></span><span></span></div>}
    </div>
);

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
const NotificationsPage = () => {
  // --- STATE ---
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Default today
  const [type, setType] = useState("General");
  const [priority, setPriority] = useState("Normal");
  
  // Audio State
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const [showSoundModal, setShowSoundModal] = useState(false);

  // API Hooks
  const { data: reminders, isLoading } = useGetRemindersQuery();
  const [createReminder, { isLoading: isCreating }] = useCreateReminderMutation();
  const [deleteReminder] = useDeleteReminderMutation();

  // --- DERIVED DATA ---
  const stats = useMemo(() => {
      if (!reminders) return { total: 0, high: 0, today: 0 };
      const todayStr = new Date().toISOString().split("T")[0];
      return {
          total: reminders.length,
          workout: reminders.filter(r => r.type === 'Workout').length,
          today: reminders.filter(r => r.date === todayStr || !r.date).length // Assume no date = recurring daily
      };
  }, [reminders]);

  const groupedReminders = useMemo(() => {
      if (!reminders) return {};
      const todayStr = new Date().toISOString().split("T")[0];
      
      return {
          today: reminders.filter(r => r.date === todayStr || !r.date).sort((a,b) => a.time.localeCompare(b.time)),
          upcoming: reminders.filter(r => r.date && r.date > todayStr).sort((a,b) => new Date(a.date) - new Date(b.date)),
          past: reminders.filter(r => r.date && r.date < todayStr) // Optional cleanup
      };
  }, [reminders]);

  // --- HANDLERS ---
  const submitHandler = async (e) => {
    e.preventDefault();
    if (!title || !time) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      // Combine date and time for backend if needed, or keep separate
      await createReminder({ title, time, date, type, priority }).unwrap();
      toast.success("Reminder Scheduled!");
      setTitle("");
      setTime("");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Dismiss this alert?")) {
        try {
            await deleteReminder(id).unwrap();
            toast.success("Dismissed");
        } catch (err) { toast.error("Failed to delete"); }
    }
  };
  
  // --- SOUND LOGIC ---
  const playSound = (sound) => {
      if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
      }
      const audio = new Audio(sound.url);
      audio.volume = 1.0;
      audio.play().catch(e => console.error(e));
      audio.onended = () => setPlayingSoundId(null);
      
      setCurrentAudio(audio);
      setPlayingSoundId(sound.id);
  };

  const stopSound = () => {
      if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
      }
      setPlayingSoundId(null);
  };

  const testSystemAlarm = () => {
      stopSound();
      const sound = SOUND_LIBRARY[0];
      const audio = new Audio(sound.url);
      
      // Loop 3 times logic
      let count = 0;
      const playLoop = () => {
          if(count < 3) {
              count++;
              audio.currentTime = 0;
              audio.play();
          }
      };
      audio.addEventListener('ended', playLoop);
      playLoop();
      setCurrentAudio(audio);
      toast.info("🚨 Testing System Alarm (3x Loop)...");
  };

  // Helper to get visual theme
  const getTheme = (reminderType) => {
      const cat = CATEGORIES.find(c => c.id === reminderType) || CATEGORIES[0];
      return { 
          icon: cat.icon, 
          color: cat.color, 
          bg: `${cat.color}20`, // 20% opacity hex
          border: cat.color 
      };
  };

  return (
    <div className="page-wrapper position-relative">
      
      {/* --- STYLES (SCOPED) --- */}
      <style>
        {`
          /* GLOBAL THEME */
          .page-wrapper { min-height: 100vh; background-color: #ffffff; color: #212529; font-family: 'Inter', sans-serif; overflow-x: hidden; }
          body.dark-mode .page-wrapper { background-color: #0f172a; color: #fff; }

          /* PANELS */
          .content-panel {
            background: #ffffff; border: 1px solid #e9ecef; border-radius: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden; position: relative; z-index: 2;
          }
          body.dark-mode .content-panel {
            background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px); box-shadow: 0 15px 35px rgba(0,0,0,0.3);
          }

          /* CARDS & ITEMS */
          .reminder-card {
              background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 16px;
              transition: 0.3s ease; display: flex; align-items: center; padding: 18px; margin-bottom: 12px;
          }
          .reminder-card:hover { transform: translateX(5px); background: #f1f3f5; border-color: #dee2e6; }
          body.dark-mode .reminder-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); }
          body.dark-mode .reminder-card:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }

          /* SOUND CARDS */
          .sound-card {
             cursor: pointer; padding: 15px; border-radius: 12px; border: 1px solid #eee; margin-bottom: 10px;
             transition: 0.2s; position: relative; overflow: hidden;
          }
          .sound-card:hover { background: #f8f9fa; }
          .sound-card.playing { border-color: #dc3545; background: #fff5f5; }
          
          /* EQUALIZER ANIMATION */
          .equalizer { display: flex; gap: 3px; position: absolute; right: 15px; top: 50%; transform: translateY(-50%); }
          .equalizer span { width: 4px; background: #dc3545; animation: eq 1s infinite ease-in-out; }
          .equalizer span:nth-child(1) { height: 10px; animation-delay: 0.1s; }
          .equalizer span:nth-child(2) { height: 20px; animation-delay: 0.2s; }
          .equalizer span:nth-child(3) { height: 15px; animation-delay: 0.3s; }
          @keyframes eq { 0%, 100% { height: 10px; } 50% { height: 25px; } }

          /* STAT CARDS */
          .stat-card {
             background: #fff; padding: 20px; border-radius: 20px; border: 1px solid #eee;
             display: flex; align-items: center; gap: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.02);
          }
          body.dark-mode .stat-card { background: #1e293b; border-color: rgba(255,255,255,0.05); }
          .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }

          /* TEXT COLORS */
          .text-adaptive-head { color: #212529; }
          body.dark-mode .text-adaptive-head { color: #fff !important; }
          .text-adaptive-sub { color: #6c757d; }
          body.dark-mode .text-adaptive-sub { color: #94a3b8 !important; }

          /* FORM CONTROLS */
          .form-control, .form-select { background-color: #fff; border: 1px solid #ced4da; color: #212529; border-radius: 12px; padding: 12px; }
          body.dark-mode .form-control, body.dark-mode .form-select { background-color: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.15); color: #fff !important; }
          body.dark-mode input[type="date"], body.dark-mode input[type="time"] { color-scheme: dark; }

          .gradient-heading { background: linear-gradient(90deg, #212529, #495057); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          body.dark-mode .gradient-heading { background: linear-gradient(135deg, #fff 0%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

          /* ANIMATIONS */
          .fade-in { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>

      <Container className="py-5 position-relative" style={{zIndex: 2}}>
        
        {/* --- HEADER --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 fade-in">
           <div>
              <h2 className="fw-bold display-5 mb-0 gradient-heading">
                 Command Center
              </h2>
              <p className="text-adaptive-sub mb-0 fw-bold small text-uppercase ls-1">Manage Your Schedule & Alerts</p>
           </div>
           
           <div className="d-flex gap-3 mt-3 mt-md-0">
              <Button variant="outline-secondary" className="rounded-pill" onClick={() => setShowSoundModal(true)}>
                  <FaMusic className="me-2"/> Library
              </Button>
              <Button 
                variant="danger" 
                onClick={testSystemAlarm} 
                className="d-flex align-items-center fw-bold px-4 py-2 rounded-pill shadow-sm border-2"
              >
                 <FaVolumeUp className="me-2"/> Test System
              </Button>
           </div>
        </div>

        {/* --- STATS ROW --- */}
        <Row className="g-4 mb-5">
            <Col md={4} className="fade-in" style={{animationDelay: '0.1s'}}>
                <StatCard icon={<FaBell/>} value={stats.total} label="Active Alerts" color="#0d6efd"/>
            </Col>
            <Col md={4} className="fade-in" style={{animationDelay: '0.2s'}}>
                <StatCard icon={<FaCalendarAlt/>} value={stats.today} label="Today's Tasks" color="#198754"/>
            </Col>
            <Col md={4} className="fade-in" style={{animationDelay: '0.3s'}}>
                <StatCard icon={<FaRunning/>} value={stats.workout} label="Workouts Pending" color="#6610f2"/>
            </Col>
        </Row>

        <Row className="g-5">
           
           {/* --- LEFT: CREATE FORM --- */}
           <Col lg={5} className="fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="content-panel p-4 h-100">
                 <div className="d-flex align-items-center mb-4">
                    <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary me-3">
                       <FaPlusCircle size={20} />
                    </div>
                    <div>
                        <h5 className="fw-bold mb-0 text-adaptive-head">Create Alert</h5>
                        <small className="text-muted">Set a new reminder</small>
                    </div>
                 </div>

                 <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-3">
                       <Form.Label className="text-adaptive-sub small fw-bold">TITLE</Form.Label>
                       <Form.Control 
                          type="text" 
                          placeholder="e.g. Gym Session, Meal Prep" 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                       />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                               <Form.Label className="text-adaptive-sub small fw-bold">DATE</Form.Label>
                               <Form.Control 
                                  type="date" 
                                  value={date}
                                  onChange={(e) => setDate(e.target.value)}
                                  required
                               />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                               <Form.Label className="text-adaptive-sub small fw-bold">TIME</Form.Label>
                               <Form.Control 
                                  type="time" 
                                  value={time}
                                  onChange={(e) => setTime(e.target.value)}
                                  required
                               />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-4">
                       <Form.Label className="text-adaptive-sub small fw-bold">CATEGORY</Form.Label>
                       <div className="d-grid gap-2 d-md-flex">
                           {CATEGORIES.map(cat => (
                               <Button 
                                key={cat.id} 
                                variant={type === cat.id ? 'primary' : 'light'}
                                className={`flex-grow-1 border ${type === cat.id ? '' : 'text-muted'}`}
                                onClick={() => setType(cat.id)}
                                size="sm"
                               >
                                   <span className="me-1">{cat.icon}</span> {cat.label}
                               </Button>
                           ))}
                       </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                       <Form.Label className="text-adaptive-sub small fw-bold">PRIORITY</Form.Label>
                       <Form.Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                          <option value="Normal">Normal</option>
                          <option value="High">High Priority (Persistent Alert)</option>
                       </Form.Select>
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 rounded-pill py-3 fw-bold shadow-lg" disabled={isCreating}>
                       {isCreating ? "Scheduling..." : "Set Reminder"}
                    </Button>
                 </Form>
              </div>
           </Col>

           {/* --- RIGHT: TIMELINE --- */}
           <Col lg={7} className="fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="h-100">
                 
                 <Tab.Container defaultActiveKey="today">
                     <div className="d-flex justify-content-between align-items-center mb-4">
                         <h5 className="mb-0 text-adaptive-sub fw-bold small text-uppercase ls-1">Timeline</h5>
                         <Nav variant="pills" className="bg-light p-1 rounded-pill border">
                             <Nav.Item><Nav.Link eventKey="today" className="px-3 py-1 small fw-bold">Today</Nav.Link></Nav.Item>
                             <Nav.Item><Nav.Link eventKey="upcoming" className="px-3 py-1 small fw-bold">Upcoming</Nav.Link></Nav.Item>
                         </Nav>
                     </div>

                     <Tab.Content>
                         {/* TODAY TAB */}
                         <Tab.Pane eventKey="today">
                             {isLoading ? <Loader /> : groupedReminders.today?.length === 0 ? (
                                <EmptyState />
                             ) : (
                                <div style={{maxHeight: "600px", overflowY: "auto", paddingRight: "5px"}}>
                                    {groupedReminders.today.map(rem => (
                                        <ReminderItem key={rem._id} rem={rem} onDelete={handleDelete} />
                                    ))}
                                </div>
                             )}
                         </Tab.Pane>

                         {/* UPCOMING TAB */}
                         <Tab.Pane eventKey="upcoming">
                             {groupedReminders.upcoming?.length === 0 ? (
                                <EmptyState text="No upcoming reminders scheduled." />
                             ) : (
                                <div style={{maxHeight: "600px", overflowY: "auto", paddingRight: "5px"}}>
                                    {groupedReminders.upcoming.map(rem => (
                                        <ReminderItem key={rem._id} rem={rem} onDelete={handleDelete} showDate={true} />
                                    ))}
                                </div>
                             )}
                         </Tab.Pane>
                     </Tab.Content>
                 </Tab.Container>

              </div>
           </Col>
        </Row>

        {/* --- SOUND LIBRARY MODAL --- */}
        <Modal show={showSoundModal} onHide={() => { stopSound(); setShowSoundModal(false); }} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">Alert Sounds</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-muted small mb-3">Click to preview sounds. Select one to be used for your next alarm.</p>
                <div className="d-grid gap-2">
                    {SOUND_LIBRARY.map(sound => (
                        <SoundCard 
                            key={sound.id} 
                            sound={sound} 
                            isPlaying={playingSoundId === sound.id}
                            onPlay={playSound}
                            onStop={stopSound}
                        />
                    ))}
                </div>
            </Modal.Body>
        </Modal>

      </Container>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const EmptyState = ({ text = "You're all caught up for today!" }) => (
    <div className="content-panel p-5 text-center">
        <div className="mb-3 d-inline-block p-4 rounded-circle bg-light">
            <FaCheckCircle size={40} className="text-success opacity-50" />
        </div>
        <h6 className="text-adaptive-head fw-bold">All Clear</h6>
        <p className="small text-adaptive-sub mb-0">{text}</p>
        <p className="small text-muted mt-2">Use the form to add a new task.</p>
    </div>
);

const ReminderItem = ({ rem, onDelete, showDate = false }) => {
    const cat = CATEGORIES.find(c => c.id === rem.type) || CATEGORIES[0];
    
    return (
        <div className="reminder-card shadow-sm">
            {/* Icon Box */}
            <div className="p-3 rounded-4 me-3 d-flex align-items-center justify-content-center" 
                style={{ width: "60px", height: "60px", background: `${cat.color}20`, color: cat.color, fontSize: "1.5rem" }}>
                {cat.icon}
            </div>
            
            {/* Content */}
            <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <h5 className="fw-bold mb-0 text-adaptive-head d-flex align-items-center">
                        {rem.time}
                        {showDate && <small className="text-muted ms-2 fs-6 fw-normal"><FaCalendarAlt className="me-1"/>{new Date(rem.date).toLocaleDateString()}</small>}
                    </h5>
                    {rem.priority === 'High' && (
                        <Badge bg="danger" className="ms-2" style={{fontSize: '0.6rem'}}>HIGH PRIORITY</Badge>
                    )}
                </div>
                <div className="d-flex align-items-center">
                    <Badge bg="transparent" className="border border-opacity-50 me-2 p-0 text-uppercase fw-bold" style={{color: cat.color, fontSize: '0.7rem'}}>
                        {rem.type}
                    </Badge>
                    <span className="text-adaptive-sub small text-capitalize fw-bold">• {rem.title}</span>
                </div>
            </div>

            {/* Action */}
            <Button 
                variant="link" 
                className="text-danger ms-2 opacity-50 hover-opacity-100 p-2" 
                onClick={() => onDelete(rem._id)}
            >
                <FaTrashAlt />
            </Button>
        </div>
    );
};

export default NotificationsPage;