import React, { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const MealPlan = () => {
  const location = useLocation();
  const { mealPlan } = location.state || {};
  const mealPlanRef = useRef(null);
  const [mealImages, setMealImages] = useState({});

  const fetchMealImage = async (mealName) => {
    const apiKey = "GFEq7C4HAC7SQdVhMhypCS8OJtkudAa8GIVQGRRvIaq33qB9ZzmU97Pw";
    const query = encodeURIComponent(mealName.trim());

    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
        headers: { Authorization: apiKey },
      });

      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.medium;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching meal image:", error);
      return null;
    }
  };

  useEffect(() => {
    if (mealPlan) {
      const fetchImages = async () => {
        const images = {};
        for (const dayPlan of mealPlan.weekly_meal_plan) {
          for (const mealType of ["breakfast", "lunch", "dinner"]) {
            const meal = dayPlan.meals[mealType];
            if (meal && meal.dish) {
              const imageUrl = await fetchMealImage(meal.dish);
              images[`${dayPlan.day}_${mealType}`] = imageUrl;
            }
          }
        }
        setMealImages(images);
      };

      fetchImages();
    }
  }, [mealPlan]);

  const downloadPDF = async () => {
    const input = mealPlanRef.current;

    // Ensure all images are loaded
    const images = input.querySelectorAll("img");
    const promises = Array.from(images).map((img) => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = img.onerror = resolve;
        }
      });
    });

    await Promise.all(promises);

    html2canvas(input, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const ratio = pdfWidth / canvasWidth;
      const imgHeight = canvasHeight * ratio;

      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft > 0) {
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
        position -= pdfHeight;

        if (heightLeft > 0) {
          pdf.addPage();
        }
      }

      pdf.save("weekly_meal_plan.pdf");
    });
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center text-primary mb-4">Your Weekly Meal Plan</h2>

      <div className="text-center mb-4">
        <button className="btn btn-outline-primary" onClick={downloadPDF}>
          Download PDF
        </button>
      </div>

      {mealPlan?.weekly_meal_plan ? (
        <div className="row row-cols-1 row-cols-md-2 g-4" ref={mealPlanRef}>
          {mealPlan.weekly_meal_plan.map((dayPlan, index) => (
            <div className="col" key={index}>
              <div className="card h-100 shadow-sm border-primary">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">{dayPlan.day}</h5>
                </div>
                <div className="card-body">
                  {["breakfast", "lunch", "dinner"].map((mealType) => {
                    const meal = dayPlan.meals[mealType];
                    const imageUrl = mealImages[`${dayPlan.day}_${mealType}`];

                    return (
                      <div className="mb-4" key={mealType}>
                        <h6>
                          <strong>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}:</strong>
                        </h6>
                        {meal ? (
                          <>
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={meal.dish}
                                style={{
                                  width: "100%",
                                  maxHeight: "200px",
                                  objectFit: "cover",
                                  borderRadius: "10px",
                                  marginBottom: "10px",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                              />
                            )}
                            <p className="mb-1"><strong>Dish:</strong> {meal.dish || "N/A"}</p>
                            <strong>Recipe:</strong>
                            <ul className="mb-0">
                              {Array.isArray(meal.recipe) && meal.recipe.length > 0 ? (
                                meal.recipe.map((step, i) => <li key={i}>{step}</li>)
                              ) : (
                                <li>No recipe available</li>
                              )}
                            </ul>
                          </>
                        ) : (
                          <p>No data available.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-warning text-center">
          No meal plan available. Please generate one.
        </div>
      )}
    </div>
  );
};

export default MealPlan;
