import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Badge,
  InputGroup
} from "react-bootstrap";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import {
  useGetDailyLogsQuery,
  useUpdateDailyLogMutation,
  useDeleteFoodItemMutation,
} from "../slices/dailyLogSlice";

// --- SUB-COMPONENT: FOOD CARD ---
const FoodCard = ({ item, onAdd, updating }) => {
  const [qty, setQty] = useState(1);

  return (
    <Col>
      <Card className="h-100 shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="text-capitalize mb-0 h6">{item.name}</Card.Title>
            <Badge bg="success">{Math.round(item.calories * qty)} kcal</Badge>
          </div>
          <Card.Text className="text-muted small mb-2">
            Base Serving: {item.serving}
          </Card.Text>

          <div className="d-flex justify-content-between text-muted small mb-3">
             <div>P: <strong>{(item.protein * qty).toFixed(1)}g</strong></div>
             <div>C: <strong>{(item.carbs * qty).toFixed(1)}g</strong></div>
             <div>F: <strong>{(item.fat * qty).toFixed(1)}g</strong></div>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <InputGroup size="sm" style={{ width: "80px" }}>
                <Form.Control 
                    type="number" 
                    min="0.5" 
                    step="0.5" 
                    value={qty} 
                    onChange={(e) => setQty(Number(e.target.value))} 
                />
            </InputGroup>
            <Button
              variant="outline-primary"
              className="w-100 btn-sm"
              onClick={() => onAdd(item, qty)}
              disabled={updating}
            >
              + Add
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
};

const NutritionChecker = () => {
  // --- STATE ---
  const [query, setQuery] = useState("");
  const [foodData, setFoodData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [quickAddQuery, setQuickAddQuery] = useState("");

  // --- API HOOKS ---
  const { data: dailyLogs, isLoading: loadingLogs } = useGetDailyLogsQuery();
  const [updateDailyLog, { isLoading: updatingLog }] = useUpdateDailyLogMutation();
  const [deleteFoodItem, { isLoading: deletingLog }] = useDeleteFoodItemMutation();

  // --- HELPERS ---
  const currentLog = dailyLogs?.find((log) => log.date === selectedDate);
  const currentFoodItems = currentLog?.foods || []; 
  const totalCalories = currentLog?.calories || 0;

  // --- 🍎 LOCAL DATABASE (70+ Items) ---
  const localFoodDatabase = [
    // --- STAPLES ---
    { name: "roti (chapati)", calories: 120, protein: 3, carbs: 24, fat: 1, serving: "1 medium" },
    { name: "naan", calories: 260, protein: 9, carbs: 45, fat: 5, serving: "1 piece" },
    { name: "paratha (plain)", calories: 300, protein: 5, carbs: 30, fat: 15, serving: "1 medium" },
    { name: "alu paratha", calories: 350, protein: 7, carbs: 45, fat: 12, serving: "1 medium" },
    { name: "puri", calories: 150, protein: 2, carbs: 18, fat: 8, serving: "1 small" },
    { name: "white rice (boiled)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: "100g" },
    { name: "brown rice", calories: 111, protein: 2.6, carbs: 23, fat: 0.9, serving: "100g" },
    { name: "chicken biryani", calories: 290, protein: 12, carbs: 35, fat: 10, serving: "100g" },
    { name: "beef biryani", calories: 320, protein: 14, carbs: 32, fat: 14, serving: "100g" },
    { name: "pulao", calories: 250, protein: 8, carbs: 40, fat: 6, serving: "100g" },
    { name: "khichdi", calories: 180, protein: 6, carbs: 30, fat: 3, serving: "1 bowl" },

    // --- PROTEIN ---
    { name: "egg (boiled)", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, serving: "1 large" },
    { name: "egg (fried)", calories: 90, protein: 6.3, carbs: 0.4, fat: 7, serving: "1 large" },
    { name: "omelette", calories: 154, protein: 11, carbs: 1, fat: 12, serving: "2 eggs" },
    { name: "chicken breast (boiled)", calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100g" },
    { name: "chicken curry", calories: 240, protein: 18, carbs: 8, fat: 14, serving: "1 cup" },
    { name: "chicken tikka", calories: 180, protein: 25, carbs: 2, fat: 7, serving: "1 piece" },
    { name: "beef curry", calories: 280, protein: 22, carbs: 6, fat: 18, serving: "1 cup" },
    { name: "mutton karahi", calories: 350, protein: 20, carbs: 5, fat: 28, serving: "1 serving" },
    { name: "shami kabab", calories: 160, protein: 9, carbs: 8, fat: 10, serving: "1 piece" },
    { name: "seekh kabab", calories: 180, protein: 12, carbs: 2, fat: 14, serving: "1 piece" },
    { name: "fish (fried)", calories: 250, protein: 18, carbs: 10, fat: 16, serving: "1 piece" },
    { name: "fish (grilled)", calories: 206, protein: 22, carbs: 0, fat: 12, serving: "100g" },

    // --- LENTILS & VEG ---
    { name: "daal chana", calories: 160, protein: 8, carbs: 22, fat: 5, serving: "1 bowl" },
    { name: "daal mash", calories: 180, protein: 9, carbs: 25, fat: 6, serving: "1 bowl" },
    { name: "daal mong", calories: 140, protein: 7, carbs: 20, fat: 4, serving: "1 bowl" },
    { name: "aloo gobi", calories: 120, protein: 3, carbs: 18, fat: 5, serving: "1 bowl" },
    { name: "mixed vegetable", calories: 110, protein: 3, carbs: 15, fat: 4, serving: "1 bowl" },
    { name: "palak paneer", calories: 220, protein: 10, carbs: 8, fat: 18, serving: "1 bowl" },
    { name: "bhindi (okra)", calories: 90, protein: 2, carbs: 10, fat: 5, serving: "1 bowl" },
    { name: "chana chaat", calories: 180, protein: 6, carbs: 32, fat: 3, serving: "1 plate" },

    // --- FRUITS ---
    { name: "apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, serving: "1 medium" },
    { name: "banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: "1 medium" },
    { name: "mango", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, serving: "100g" },
    { name: "orange", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, serving: "1 medium" },
    { name: "grapes", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, serving: "100g" },
    { name: "watermelon", calories: 30, protein: 0.6, carbs: 8, fat: 0.2, serving: "100g" },
    { name: "dates (khajoor)", calories: 23, protein: 0.2, carbs: 6, fat: 0, serving: "1 piece" },
    { name: "guava (amrood)", calories: 68, protein: 2.6, carbs: 14, fat: 0.9, serving: "1 medium" },
    { name: "peach", calories: 39, protein: 0.9, carbs: 10, fat: 0.3, serving: "1 medium" },
    { name: "strawberries", calories: 32, protein: 0.7, carbs: 8, fat: 0.3, serving: "100g" },

    // --- DAIRY ---
    { name: "milk (whole)", calories: 62, protein: 3.2, carbs: 4.8, fat: 3.3, serving: "100ml" },
    { name: "milk (skim)", calories: 35, protein: 3.4, carbs: 5, fat: 0.1, serving: "100ml" },
    { name: "yogurt (dahi)", calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3, serving: "100g" },
    { name: "butter", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, serving: "100g" },
    { name: "cheese (cheddar)", calories: 402, protein: 25, carbs: 1.3, fat: 33, serving: "100g" },
    { name: "lassi (sweet)", calories: 150, protein: 4, carbs: 25, fat: 5, serving: "1 glass" },

    // --- SNACKS & FAST FOOD ---
    { name: "samosa", calories: 260, protein: 4, carbs: 24, fat: 17, serving: "1 piece" },
    { name: "pakora", calories: 50, protein: 1, carbs: 5, fat: 3, serving: "1 piece" },
    { name: "burger (chicken)", calories: 450, protein: 20, carbs: 40, fat: 22, serving: "1 burger" },
    { name: "pizza slice", calories: 285, protein: 12, carbs: 36, fat: 10, serving: "1 slice" },
    { name: "fries", calories: 312, protein: 3.4, carbs: 41, fat: 15, serving: "1 medium pack" },
    { name: "shawarma", calories: 400, protein: 18, carbs: 35, fat: 20, serving: "1 roll" },
    { name: "sandwich (club)", calories: 350, protein: 15, carbs: 30, fat: 18, serving: "1 sandwich" },
    { name: "dahi baray", calories: 200, protein: 8, carbs: 25, fat: 6, serving: "1 plate" },
  ];

  // --- FUNCTIONS ---

  const searchFoodHandler = (e) => {
    e.preventDefault();
    if (!query) return;
    const results = localFoodDatabase.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
    );
    if (results.length > 0) setFoodData(results);
    else {
        toast.error("Not found in database.");
        setFoodData(null);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddQuery) return;

    // Regex to find "2 roti" or "3.5 eggs"
    const regex = /^(\d+(\.\d+)?)\s+(.*)$/;
    const match = quickAddQuery.trim().match(regex);

    let qty = 1;
    let searchName = quickAddQuery;

    if (match) {
        qty = parseFloat(match[1]);
        searchName = match[3];
    }

    const item = localFoodDatabase.find(f => 
        f.name.toLowerCase().includes(searchName.toLowerCase())
    );

    if (item) {
        addToLogHandler(item, qty);
        setQuickAddQuery("");
    } else {
        toast.error("Item not found in database. Try manual search.");
    }
  };

  const addToLogHandler = async (item, quantity = 1) => {
    try {
        const newFoodItem = {
            name: item.name,
            calories: item.calories * quantity,
            protein: parseFloat((item.protein * quantity).toFixed(1)),
            carbs: parseFloat((item.carbs * quantity).toFixed(1)),
            fat: parseFloat((item.fat * quantity).toFixed(1)),
            servingSize: `${quantity} x ${item.serving}`
        };

        // Sending Object 'foodItem' to Backend
        await updateDailyLog({ date: selectedDate, foodItem: newFoodItem }).unwrap();
        toast.success(`${quantity} x ${item.name} added!`);
    } catch (err) {
        console.error(err);
        toast.error(err?.data?.message || "Failed to add to log");
    }
  };

  // --- UPDATED DELETE FUNCTION ---
  const handleDelete = async (foodId) => {
    if (!foodId) {
        toast.error("Error: Item ID is missing. Please refresh the page.");
        return;
    }

    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        // Passing date and foodId to the Redux Slice Mutation
        await deleteFoodItem({ date: selectedDate, foodId }).unwrap();
        toast.success("Item deleted successfully");
      } catch (err) {
        console.error("Delete Error:", err);
        // Show specific error from backend if available, otherwise generic message
        toast.error(err?.data?.message || "Failed to delete item");
      }
    }
  };

  return (
    <Container className="py-4">
      <Row>
        {/* LEFT COLUMN: DAILY LOG */}
        <Col md={12} lg={5} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <h5 className="mb-3 text-primary">Daily Diet Log</h5>
              
              <Form.Group className="mb-3">
                <Form.Control type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </Form.Group>

              {/* QUICK ADD */}
              <div className="p-3 bg-light rounded mb-3 border">
                <h6 className="mb-2">Quick Add</h6>
                <Form onSubmit={handleQuickAdd}>
                    <Row className="g-2">
                        <Col xs={8}>
                            <Form.Control 
                                placeholder="e.g. 2 roti, 3 eggs" 
                                size="sm" 
                                value={quickAddQuery} 
                                onChange={(e) => setQuickAddQuery(e.target.value)}
                            />
                        </Col>
                        <Col xs={4}>
                            <Button type="submit" variant="primary" size="sm" className="w-100" disabled={updatingLog}>Add</Button>
                        </Col>
                    </Row>
                </Form>
              </div>

              {/* LOG TABLE */}
              {loadingLogs ? <Loader /> : (
                <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <Table size="sm" striped hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th className="text-end">Cals</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFoodItems.length === 0 ? (
                        <tr><td colSpan="3" className="text-center text-muted small py-3">No food logged today.</td></tr>
                      ) : (
                        currentFoodItems.map((item, index) => (
                          // FIX: Fallback to index if ID is temporarily missing
                          <tr key={item._id || item.id || index}>
                            <td>
                              <strong className="text-capitalize">{item.name}</strong>
                              <div className="text-muted small">{item.servingSize}</div>
                              <div className="text-muted small" style={{fontSize: "0.7rem"}}>
                                P:{item.protein} C:{item.carbs} F:{item.fat}
                              </div>
                            </td>
                            <td className="text-end fw-bold">{Math.round(item.calories)}</td>
                            <td className="text-center">
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}
                                // FIX: Send _id (MongoDB) or id (General)
                                onClick={() => handleDelete(item._id || item.id)}
                                disabled={deletingLog}
                              >
                                X
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
              
              <div className="mt-3 p-3 bg-primary text-white rounded d-flex justify-content-between">
                <span className="h6 mb-0">Total Calories</span>
                <span className="h4 mb-0 fw-bold">{Math.round(totalCalories)}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT COLUMN: SEARCH */}
        <Col md={12} lg={7}>
          <div className="mb-4">
            <h4>Search Local Database</h4>
            <Form onSubmit={searchFoodHandler} className="d-flex gap-2">
              <Form.Control 
                placeholder="Search food (e.g. Biryani)" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                className="shadow-sm"
              />
              <Button type="submit" variant="success">Search</Button>
            </Form>
          </div>

          <Row xs={1} md={2} className="g-3">
            {foodData && foodData.map((item, index) => (
                <FoodCard key={index} item={item} onAdd={addToLogHandler} updating={updatingLog} />
            ))}
          </Row>
          
          {!foodData && (
              <div className="text-center text-muted mt-5">
                  <p>Try searching: "2 Roti", "Chicken", "Egg". Use quantity box to adjust servings.</p>
              </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default NutritionChecker;