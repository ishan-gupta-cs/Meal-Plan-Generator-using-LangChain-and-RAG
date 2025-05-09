import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MealForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    weight_kg: "",
    height_cm: "",
    allergies: "",
    preferred_cuisine: "",
    diet_type: "",
    health_goals: "",
    disease: "",
    activity_level: "",
    specific_comment: "", // NEW field
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.weekly_meal_plan) {
        navigate("/meal-plan", { state: { mealPlan: result } });
      } else {
        alert("Meal plan could not be generated. Please try again.");
        console.error("Invalid response:", result);
      }
    } catch (err) {
      console.error("Error generating meal plan:", err);
      alert("There was an error generating the meal plan.");
    }
  };

  const dropdowns = {
    gender: ["Male", "Female"],
    preferred_cuisine: ["North Indian", "South Indian", "East Indian", "West Indian"],
    activity_level: ["Inactive", "Moderate", "Sedentary"],
    diet_type: ["Vegetarian", "Non Vegetarian"],
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-center mb-4 text-primary">
            Personalized Meal Planner
          </h2>
          <form onSubmit={handleSubmit} className="row g-3">
            {Object.entries(formData).map(([key, value]) => (
              key !== "specific_comment" && (
                <div className="col-md-6" key={key}>
                  <label className="form-label text-capitalize" htmlFor={key}>
                    {key.replace(/_/g, " ")}
                  </label>
                  {dropdowns[key] ? (
                    <select
                      name={key}
                      id={key}
                      value={value}
                      onChange={handleChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select {key.replace(/_/g, " ")}</option>
                      {dropdowns[key].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name={key}
                      id={key}
                      value={value}
                      onChange={handleChange}
                      placeholder={`Enter ${key.replace(/_/g, " ")}`}
                      className="form-control"
                      required
                    />
                  )}
                </div>
              )
            ))}

            {/* Specific Comment Section */}
            <div className="col-12">
              <label className="form-label" htmlFor="specific_comment">
                Any Specific Comment?
              </label>
              <textarea
                name="specific_comment"
                id="specific_comment"
                value={formData.specific_comment}
                onChange={handleChange}
                className="form-control"
                rows="4"
                placeholder="Mention anything specific like food preferences, timing constraints, etc."
              />
            </div>

            <div className="col-12 text-center mt-4">
              <button type="submit" className="btn btn-primary px-4 py-2">
                Generate Meal Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MealForm;
