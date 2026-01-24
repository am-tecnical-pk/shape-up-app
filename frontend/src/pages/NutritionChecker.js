import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Container, Row, Col, Form, Button, Badge, InputGroup, Alert, Nav, Card, Spinner, Modal
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import {
  useGetDailyLogsQuery,
  useUpdateDailyLogMutation,
  useDeleteFoodItemMutation,
} from "../slices/dailyLogSlice";

// AI Imports
import { 
  useGenerateDietMutation, 
  useSaveDietMutation, 
  useGetMyDietQuery,
  useAnalyzeImageMutation 
} from "../slices/dietApiSlice";

import { 
    FaSearch, FaTrashAlt, FaLeaf, FaFire, FaPlus, 
    FaUtensils, FaChevronLeft, FaChevronRight, FaHistory,
    FaDumbbell, FaRobot, FaCheckCircle, FaCamera, FaInfoCircle
} from "react-icons/fa";

// ==========================================
// 📸 COMPRESSION UTILITY (VERCEL SAFE)
// ==========================================
const resizeImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                // 👇 Aggressive Resize for Vercel (Max 400px width)
                const MAX_WIDTH = 400; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // 👇 Compress Quality to 0.6 (60%)
                // This makes a 5MB image -> ~40KB (Safe for Vercel)
                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
                resolve(compressedBase64);
            };
        };
    });
};

// ==========================================
// 1. SUB-COMPONENT: MACRO RING
// ==========================================
const MacroRing = ({ value, max, color, label, icon }) => {
    const radius = 35;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - ((value / (max || 1)) * circumference);

    return (
        <div className="macro-ring-wrapper text-center fade-in-up">
            <div className="position-relative d-inline-block hover-scale">
                <svg height={radius * 2} width={radius * 2} className="rotate-90">
                    <circle stroke="rgba(128, 128, 128, 0.1)" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} fill="transparent" />
                    <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-in-out" }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} />
                </svg>
                <div className="macro-icon-center" style={{color: color}}>{icon}</div>
            </div>
            <div className="mt-2">
                <div className="fw-bold h6 mb-0 text-adaptive-head">{Math.round(value)}g</div>
                <small className="text-adaptive-sub" style={{fontSize: '0.7rem'}}>{label}</small>
            </div>
        </div>
    );
};

// ==========================================
// 2. SUB-COMPONENT: FOOD CARD
// ==========================================
const FoodCard = ({ item, onAdd, updating, type = "search", index }) => {
  const [qty, setQty] = useState(1);
  const [mealType, setMealType] = useState("Breakfast");

  return (
    <Col className="fade-in-up" style={{animationDelay: `${index * 0.05}s`}}>
      <div className="content-panel h-100 p-3 d-flex flex-column hover-lift">
        <div className="d-flex justify-content-between align-items-start mb-2">
           <div>
              {type === 'recent' && <Badge bg="success" className="mb-2" style={{fontSize: '0.6rem'}}>LOGGED TODAY</Badge>}
              <h6 className="mb-0 fw-bold text-adaptive-head text-capitalize">{item.name}</h6>
              <small className="text-adaptive-sub" style={{fontSize: "0.75rem"}}>{item.serving}</small>
           </div>
           <Badge bg="warning" text="dark" className="shadow-sm"><FaFire className="me-1" />{Math.round(item.calories * qty)}</Badge>
        </div>

        <div className="macro-pills d-flex justify-content-between mb-3">
           <span className="macro-pill" style={{color: "#0d6efd"}}>P: {(item.protein * qty).toFixed(1)}</span>
           <span className="macro-pill" style={{color: "#198754"}}>C: {(item.carbs * qty).toFixed(1)}</span>
           <span className="macro-pill" style={{color: "#ffc107"}}>F: {(item.fat * qty).toFixed(1)}</span>
        </div>

        <div className="mt-auto">
           <Form.Select size="sm" className="mb-2 meal-select" value={mealType} onChange={(e) => setMealType(e.target.value)}>
               <option value="Breakfast">Breakfast</option>
               <option value="Lunch">Lunch</option>
               <option value="Dinner">Dinner</option>
               <option value="Snack">Snack</option>
           </Form.Select>
           <InputGroup size="sm" className="mb-2">
              <Button variant="outline-secondary" onClick={() => setQty(q => Math.max(0.5, q - 0.5))}>-</Button>
              <Form.Control className="text-center fw-bold bg-transparent border-secondary text-adaptive-head" value={qty} readOnly style={{maxWidth: "50px"}} />
              <Button variant="outline-secondary" onClick={() => setQty(q => q + 0.5)}>+</Button>
           </InputGroup>
           <Button variant="primary" size="sm" className="w-100 rounded-pill shadow-sm fw-bold btn-glow" onClick={() => onAdd(item, qty, mealType)} disabled={updating}>
              {updating ? "Saving..." : <><FaPlus className="me-1" /> Add Again</>}
           </Button>
        </div>
      </div>
    </Col>
  );
};

// ==========================================
// 3. MAIN COMPONENT: NUTRITION CHECKER
// ==========================================
const NutritionChecker = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null); 

  // --- STATE ---
  const [query, setQuery] = useState("");
  const [foodData, setFoodData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("search");

  // AI Diet State
  const [dietPlan, setDietPlan] = useState(null);
  const [aiViewMode, setAiViewMode] = useState("generate"); 
  const [showAiModal, setShowAiModal] = useState(false); 

  // AI Inputs
  const [cuisine, setCuisine] = useState("Balanced");
  const [dietType, setDietType] = useState("Standard");
  const [allergies, setAllergies] = useState("");
  const [targetCals, setTargetCals] = useState(2000);

  // --- API HOOKS ---
  const { data: dailyLogs, isLoading: loadingLogs, refetch } = useGetDailyLogsQuery();
  const [updateDailyLog, { isLoading: updatingLog }] = useUpdateDailyLogMutation();
  const [deleteFoodItem, { isLoading: deletingLog }] = useDeleteFoodItemMutation();
  
  // AI Hooks
  const { data: activeDiet } = useGetMyDietQuery();
  const [generateDiet, { isLoading: generating }] = useGenerateDietMutation();
  const [saveDiet, { isLoading: saving }] = useSaveDietMutation();
  const [analyzeImage, { isLoading: analyzing }] = useAnalyzeImageMutation(); 

  useEffect(() => {
      if (activeDiet) {
          setDietPlan(activeDiet);
          setAiViewMode("view");
      }
  }, [activeDiet]);

  // --- SYNCED GOAL LOGIC (Matches Dashboard) ---
  const { calorieGoal } = useMemo(() => {
    let goal = 2000;
    if (userInfo) {
        const weight = userInfo.weight || 70; 
        const height = userInfo.height || 170;
        const age = userInfo.age || 25;
        const gender = userInfo.gender || 'Male';
        const userGoal = userInfo.goal || 'Maintain'; 
        
        // Mifflin-St Jeor Equation (Same as Dashboard)
        let bmr = (gender === 'Male') 
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;
        
        let tdee = bmr * 1.55; 

        if (userGoal === 'Cut') goal = Math.round(tdee - 500);
        else if (userGoal === 'Bulk') goal = Math.round(tdee + 500);
        else goal = Math.round(tdee);
    }
    return { calorieGoal: goal };
  }, [userInfo]);

  const currentLog = Array.isArray(dailyLogs) ? dailyLogs.find((log) => log.date === selectedDate) : null;
  const currentFoodItems = currentLog?.foods || []; 
  
  const totalStats = currentFoodItems.reduce((acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein: acc.protein + (Number(item.protein) || 0),
      carbs: acc.carbs + (Number(item.carbs) || 0),
      fat: acc.fat + (Number(item.fat) || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const remainingCalories = Math.max(0, calorieGoal - totalStats.calories);
  const progressPercent = Math.min(100, (totalStats.calories / calorieGoal) * 100);

  const recentFoods = useMemo(() => {
      if (!currentFoodItems || currentFoodItems.length === 0) return [];
      const uniqueFoods = Array.from(new Map(currentFoodItems.map(item => [item.name, item])).values());
      return uniqueFoods; 
  }, [currentFoodItems]);

  const localFoodDatabase = [
    { name: "roti (chapati)", calories: 120, protein: 3, carbs: 24, fat: 1, serving: "1 medium" },
    { name: "naan", calories: 260, protein: 9, carbs: 45, fat: 5, serving: "1 piece" },
    { name: "white rice (boiled)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: "100g" },
    { name: "chicken biryani", calories: 290, protein: 12, carbs: 35, fat: 10, serving: "100g" },
    { name: "beef biryani", calories: 320, protein: 14, carbs: 32, fat: 14, serving: "100g" },
    { name: "egg (boiled)", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, serving: "1 large" },
    { name: "chicken breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100g" },
    { name: "daal chana", calories: 160, protein: 8, carbs: 22, fat: 5, serving: "1 bowl" },
    { name: "apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, serving: "1 medium" },
    { name: "banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: "1 medium" },
    { name: "milk (whole)", calories: 62, protein: 3.2, carbs: 4.8, fat: 3.3, serving: "100ml" },
    { name: "tea (chai)", calories: 120, protein: 3, carbs: 18, fat: 4, serving: "1 cup" },
    { name: "oats (cooked)", calories: 150, protein: 5, carbs: 27, fat: 2.5, serving: "1 bowl" },
    { name: "protein shake", calories: 120, protein: 24, carbs: 3, fat: 1, serving: "1 scoop" },
    { name: "salad (mixed)", calories: 45, protein: 1, carbs: 8, fat: 0.5, serving: "1 large bowl" },
  ];

  // --- HANDLERS ---
  const handleDateChange = (days) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + days);
      setSelectedDate(d.toISOString().split("T")[0]);
      setActiveTab("search"); 
  };

  const searchFoodHandler = (e) => {
    e.preventDefault();
    if (!query) return;
    const results = localFoodDatabase.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
    setFoodData(results.length > 0 ? results : null);
    if (results.length === 0) toast.error("Not found. Try 'Chicken', 'Roti', etc.");
  };

  const addToLogHandler = async (item, quantity = 1, mealType = "Breakfast") => {
    try {
        const newFoodItem = {
            name: item.name,
            calories: Math.round(item.calories * quantity),
            protein: parseFloat((item.protein * quantity).toFixed(1)),
            carbs: parseFloat((item.carbs * quantity).toFixed(1)),
            fat: parseFloat((item.fat * quantity).toFixed(1)),
            servingSize: `${quantity} x ${item.serving || '1 portion'} (${mealType})` 
        };
        await updateDailyLog({ date: selectedDate, foodItem: newFoodItem }).unwrap();
        refetch();
        toast.success(`Added ${item.name} to ${mealType}!`);
        setQuery("");
    } catch (err) {
        toast.error("Failed to add food");
    }
  };

  const handleDelete = async (foodId) => {
    if (window.confirm("Delete this item?")) {
      try {
        await deleteFoodItem({ date: selectedDate, foodId }).unwrap();
        refetch();
        toast.success("Item removed");
      } catch (err) { toast.error("Failed to delete"); }
    }
  };

  const handleGenerateDiet = async (e) => {
      e.preventDefault();
      try {
          const res = await generateDiet({
              userData: { name: userInfo.name, goal: userInfo.goal },
              preferences: { cuisine, dietType, allergies, targetCalories: targetCals }
          }).unwrap();
          setDietPlan(res);
          setAiViewMode("preview");
          toast.success("Diet Created! 🥦");
      } catch (err) { toast.error("AI Failed."); }
  };

  const handleSaveDiet = async () => {
      try {
          await saveDiet({ plan: dietPlan }).unwrap();
          toast.success("Diet Saved!");
          setAiViewMode("view");
      } catch (err) { toast.error("Save failed"); }
  };

  const handleEatAiMeal = async (meal) => {
      if(!window.confirm(`Log ${meal.name}?`)) return;
      try {
          const mealToLog = {
              name: meal.foodItems.join(", "),
              calories: meal.calories,
              protein: meal.protein || 0,
              carbs: 0,
              fat: 0,
              servingSize: `AI Meal (${meal.name})`
          };
          await updateDailyLog({
              date: selectedDate,
              foodItem: mealToLog 
          }).unwrap();
          refetch(); 
          toast.success(`Logged ${meal.calories} kcal!`);
      } catch (e) { toast.error("Log failed"); }
  };

  // --- 📸 CAMERA HANDLER (SNAP & LOG) ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        toast.info("Compressing & Analyzing... 📸");
        
        // 1. COMPRESS: This is the fix for Vercel 500 Error
        const compressedBase64 = await resizeImage(file); 

        // 2. SEND: Send tiny string to backend
        const result = await analyzeImage({ imageBase64: compressedBase64 }).unwrap();
        
        if (result.error) {
            toast.error(result.error);
            return;
        }

        // 3. LOG: Add to database
        if (window.confirm(`AI Identified: ${result.name} (${result.calories} kcal). Add to log?`)) {
            const aiFoodItem = {
                name: result.name,
                calories: result.calories,
                protein: result.protein,
                carbs: result.carbs,
                fat: result.fat,
                serving: result.serving
            };
            await addToLogHandler(aiFoodItem, 1, "Snack"); 
        }

    } catch (err) {
        console.error("AI Error:", err);
        toast.error("Analysis Failed. Try a smaller image.");
    }
  };

  return (
    <div className="page-wrapper position-relative">
      <style>{`
         .page-wrapper { min-height: 100vh; overflow-x: hidden; background-color: #f8f9fa; color: #212529; font-family: 'Inter', sans-serif; }
         body.dark-mode .page-wrapper { background-color: #0f172a; color: #fff; }
         .content-panel { background: #ffffff; border: 1px solid #e9ecef; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
         body.dark-mode .content-panel { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
         .log-item { background: #fff; border-radius: 16px; margin-bottom: 12px; padding: 16px; border: 1px solid #e9ecef; display: flex; align-items: center; justify-content: space-between; }
         body.dark-mode .log-item { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); }
         .calorie-circle { width: 180px; height: 180px; border-radius: 50%; border: 8px solid rgba(13, 110, 253, 0.1); display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 0 auto; position: relative; }
         .calorie-circle-inner { width: 100%; height: 100%; border-radius: 50%; border: 8px solid #0d6efd; position: absolute; top: -8px; left: -8px; border-bottom-color: transparent; border-left-color: transparent; transform: rotate(45deg); transition: 1s cubic-bezier(0.4, 0, 0.2, 1); }
         .rotate-90 { transform: rotate(-90deg); }
         .macro-icon-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.2rem; }
         .fade-in { animation: fadeIn 0.8s ease-out forwards; }
         .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
         .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; }
         .hover-scale:hover { transform: scale(1.05); }
         @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
         @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <Container fluid="xxl" className="py-4 px-md-5 position-relative" style={{zIndex: 2}}>
        
        {/* HEADER */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 fade-in">
           <div className="d-flex align-items-center mb-3 mb-md-0">
              <div className="p-3 bg-success bg-opacity-10 rounded-circle text-success me-3 shadow-sm hover-scale"><FaLeaf size={24} /></div>
              <div><h2 className="fw-bold mb-0 text-adaptive-head">Nutrition Command</h2><small className="text-adaptive-sub fw-bold text-uppercase ls-1">Track & Analyze</small></div>
           </div>
           
           <div className="d-flex gap-2">
               {/* 👇 HIDDEN INPUT FOR CAMERA 👇 */}
               <input 
                   type="file" 
                   ref={fileInputRef} 
                   style={{display: 'none'}} 
                   accept="image/*" 
                   onChange={handleImageUpload} 
               />

               {/* 👇 CAMERA BUTTON 👇 */}
               <Button 
                   variant="warning" 
                   className="rounded-pill shadow-sm text-dark fw-bold" 
                   onClick={() => fileInputRef.current.click()}
                   disabled={analyzing}
               >
                   {analyzing ? <Spinner size="sm"/> : <><FaCamera className="me-2"/> Snap & Log</>}
               </Button>

               {/* AI DIET PLAN */}
               <Button variant="outline-primary" className="rounded-pill shadow-sm" onClick={() => setShowAiModal(true)}>
                   <FaRobot className="me-2"/> AI Diet Plan
               </Button>

               <div className="d-flex align-items-center p-2 rounded-pill shadow-sm border hover-lift" style={{background: 'var(--bs-body-bg)', borderColor: 'var(--bs-border-color)'}}>
                  <Button variant="link" className="text-muted p-0 me-2" onClick={() => handleDateChange(-1)}><FaChevronLeft/></Button>
                  <Form.Control type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-0 bg-transparent fw-bold text-center p-0 m-0 shadow-none text-adaptive-head" style={{width: '130px'}} />
                  <Button variant="link" className="text-muted p-0 ms-2" onClick={() => handleDateChange(1)}><FaChevronRight/></Button>
               </div>
           </div>
        </div>

        <Row className="g-4">
           {/* LEFT: STATS (Unchanged) */}
           <Col lg={4} xl={3} className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="content-panel h-100 d-flex flex-column p-4">
                 <div className="text-center mb-4">
                    <div className="calorie-circle hover-scale">
                        <div className="calorie-circle-inner" style={{transform: `rotate(${45 + (progressPercent * 3.6)}deg)`}}></div>
                        <h1 className="display-4 fw-bold mb-0 text-adaptive-head">{remainingCalories}</h1>
                        <small className="text-muted text-uppercase fw-bold">Left</small>
                    </div>
                    <div className="mt-3"><Badge bg="light" text="dark" className="border me-2">Goal: {Math.round(calorieGoal)}</Badge><Badge bg="success" className="bg-opacity-75">Ate: {Math.round(totalStats.calories)}</Badge></div>
                 </div>
                 <hr className="opacity-10 my-4" style={{borderColor: 'inherit'}} />
                 <Row className="text-center g-2">
                     <Col><MacroRing value={totalStats.protein} max={150} color="#0d6efd" label="Protein" icon={<FaDumbbell fontSize={10}/>} /></Col>
                     <Col><MacroRing value={totalStats.carbs} max={250} color="#198754" label="Carbs" icon={<FaLeaf fontSize={10}/>} /></Col>
                     <Col><MacroRing value={totalStats.fat} max={70} color="#ffc107" label="Fats" icon={<FaFire fontSize={10}/>} /></Col>
                 </Row>
              </div>
           </Col>

           {/* RIGHT: SEARCH & LOG */}
           <Col lg={8} xl={9} className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="content-panel p-4 h-100">
                 <div className="d-flex justify-content-center mb-4">
                    <Nav variant="pills" className="bg-light p-1 rounded-pill border" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item><Nav.Link eventKey="search" className="px-4"><FaSearch className="me-2"/>Search Database</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="recent" className="px-4"><FaHistory className="me-2"/>Recent</Nav.Link></Nav.Item>
                    </Nav>
                 </div>

                 {activeTab === 'search' && (
                     <div className="mb-4 fade-in">
                        <Form onSubmit={searchFoodHandler}>
                          <InputGroup className="shadow-sm hover-lift">
                             <InputGroup.Text className="bg-white border-end-0 ps-3"><FaSearch className="text-muted"/></InputGroup.Text>
                             <Form.Control placeholder="Type food name..." value={query} onChange={(e) => setQuery(e.target.value)} className="border-start-0 py-3"/>
                             <Button type="submit" variant="primary" className="px-4 fw-bold rounded-end-pill btn-glow">Find Food</Button>
                          </InputGroup>
                        </Form>
                     </div>
                 )}

                 <div className="overflow-auto mb-5" style={{maxHeight: "400px"}}>
                    {(activeTab === 'search' && foodData) || (activeTab === 'recent' && recentFoods.length > 0) ? (
                        <Row xs={1} md={2} lg={3} className="g-3">
                          {(activeTab === 'search' ? foodData : recentFoods).map((item, idx) => (
                             <FoodCard key={idx} item={item} onAdd={addToLogHandler} updating={updatingLog} type={activeTab} index={idx} />
                          ))}
                        </Row>
                    ) : (
                        <div className="text-center w-100 py-5 text-muted fade-in">
                             <FaUtensils size={30} className="mb-3 opacity-25"/>
                             <p>No food found. Try searching.</p>
                        </div>
                    )}
                 </div>

                 <hr className="my-4 opacity-10" style={{borderColor: 'inherit'}}/>
                 <h5 className="fw-bold text-adaptive-head mb-3 fade-in">Entries for {selectedDate}</h5>
                 
                 <div className="overflow-auto" style={{maxHeight: "300px"}}>
                     {currentFoodItems.map((item, idx) => (
                         <div key={idx} className="log-item shadow-sm fade-in-up" style={{animationDelay: `${idx * 0.1}s`}}>
                             <div className="d-flex align-items-center">
                                 <div className="p-3 bg-light rounded-3 me-3 text-primary"><FaUtensils /></div>
                                 <div><h6 className="fw-bold mb-0 text-adaptive-head text-capitalize">{item.name}</h6><small className="text-muted">{item.servingSize}</small></div>
                             </div>
                             <div className="d-flex align-items-center gap-3">
                                 <div className="text-end d-none d-md-block"><div className="fw-bold text-success">{Math.round(item.calories)} kcal</div></div>
                                 <Button variant="light" className="text-danger border-0 bg-transparent p-2 rounded-circle hover-bg-danger" onClick={() => handleDelete(item._id || item.id)} disabled={deletingLog}><FaTrashAlt /></Button>
                             </div>
                         </div>
                     ))}
                 </div>

              </div>
           </Col>
        </Row>
      </Container>

      {/* ===================================== 
          🔥 AI DIET GENERATOR MODAL 
         ===================================== */}
      <Modal show={showAiModal} onHide={() => setShowAiModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold d-flex align-items-center"><FaRobot className="me-2 text-primary"/> AI Nutrition Coach</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-light">
            {aiViewMode === 'generate' ? (
                <Form onSubmit={handleGenerateDiet}>
                    <Row>
                        <Col md={6} className="mb-3"><Form.Label>Target Calories</Form.Label><Form.Control type="number" value={targetCals} onChange={e=>setTargetCals(e.target.value)}/></Col>
                        <Col md={6} className="mb-3"><Form.Label>Diet Type</Form.Label><Form.Select value={dietType} onChange={e=>setDietType(e.target.value)}><option>Standard</option><option>Keto</option><option>Vegan</option></Form.Select></Col>
                        <Col md={12} className="mb-3"><Form.Label>Cuisine</Form.Label><Form.Select value={cuisine} onChange={e=>setCuisine(e.target.value)}><option>Balanced</option><option>Pakistani/Indian</option><option>Western</option></Form.Select></Col>
                        <Col md={12} className="mb-4"><Form.Label>Allergies</Form.Label><Form.Control value={allergies} onChange={e=>setAllergies(e.target.value)} placeholder="e.g. Peanuts"/></Col>
                    </Row>
                    <Button type="submit" className="w-100 rounded-pill" disabled={generating}>{generating ? <Spinner size="sm"/> : "Generate Plan"}</Button>
                </Form>
            ) : (
                <div>
                   {/* VIEW MODE: MEAL PLAN CARDS */}
                   {dietPlan && (
                       <Row className="g-3">
                           {dietPlan.meals.map((meal, idx) => (
                               <Col md={6} key={idx}>
                                   <Card className="border-0 shadow-sm">
                                       <Card.Body>
                                           <div className="d-flex justify-content-between mb-2"><Badge bg="dark">{meal.name}</Badge><small>{meal.calories} kcal</small></div>
                                           <ul className="small mb-2 ps-3">{meal.foodItems.map((f, i)=><li key={i}>{f}</li>)}</ul>
                                           <Button size="sm" variant="outline-success" className="w-100" onClick={() => handleEatAiMeal(meal)}><FaPlus className="me-1"/> Log This Meal</Button>
                                       </Card.Body>
                                   </Card>
                               </Col>
                           ))}
                       </Row>
                   )}
                   <div className="d-flex gap-2 mt-4">
                       <Button variant="outline-secondary" className="w-50" onClick={() => setAiViewMode('generate')}>Regenerate</Button>
                       <Button variant="success" className="w-50" onClick={handleSaveDiet}>Save as Active Plan</Button>
                   </div>
                </div>
            )}
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default NutritionChecker;