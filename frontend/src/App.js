import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MealForm from "./components/MealForm";
import MealPlan from "./components/MealPlan";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MealForm />} />
        <Route path="/meal-plan" element={<MealPlan />} />
      </Routes>
    </Router>
  );
}

export default App;
