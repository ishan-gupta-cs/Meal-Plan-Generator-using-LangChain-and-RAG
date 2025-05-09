import os
from flask_cors import CORS
from flask import Flask, request, jsonify
import google.generativeai as genai
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
import json

app = Flask(__name__)
CORS(app)

genai.configure(api_key="AIzaSyAnA6QwTXIgzI0nXvGJP9Tk2JQxD0PCooo")

embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

vectorstore1 = FAISS.load_local("faiss_nutrition_guide", embedding_model, allow_dangerous_deserialization=True)
vectorstore2 = FAISS.load_local("diet_faiss_index", embedding_model, allow_dangerous_deserialization=True)
vectorstore3 = FAISS.load_local("faiss_recipes", embedding_model, allow_dangerous_deserialization=True)

def retrieve_documents(user_query, vectorstore):
    retriever = vectorstore.as_retriever()
    retrieved_docs = retriever.invoke(user_query)
    return [doc.page_content for doc in retrieved_docs]

def generate_meal_plan(user_input, retrieved_chunks):
    context = "\n".join(retrieved_chunks) if retrieved_chunks else "No additional meal data retrieved."
    comment = user_input.get("specific_comment", "")

    prompt = f"""
    Create a personalized weekly {user_input['diet_type']} meal plan in JSON format for a person with the following profile:
    {{
        "name": "{user_input['name']}",
        "age": {user_input['age']},
        "gender": "{user_input['gender']}",
        "weight_kg": {user_input['weight_kg']},
        "height_cm": {user_input['height_cm']},
        "allergies": "{user_input['allergies']}",
        "preferred_cuisine": "{user_input['preferred_cuisine']}",
        "diet_type": "{user_input['diet_type']}",
        "health_goals": "{user_input['health_goals']}",
        "disease": "{user_input['disease']}",
        "activity_level": "{user_input['activity_level']}",
        "specific_comment": "{comment}"
    }}

    The response should be valid JSON and include the following structure:
    {{
        "weekly_meal_plan": [
            {{
                "day": "Monday",
                "meals": {{
                    "breakfast": {{
                        "dish": "...",
                        "recipe": [
                            "Step 1...",
                            "Step 2...",
                            "Step 3..."
                        ]
                    }},
                    "lunch": {{
                        "dish": "...",
                        "recipe": [
                            "Step 1...",
                            "Step 2..."
                        ]
                    }},
                    "dinner": {{
                        "dish": "...",
                        "recipe": [
                            "Step 1...",
                            "Step 2..."
                        ]
                    }}
                }}
            }},
            ...
        ]
    }}

    Ensure the response is valid JSON.
    Take into account these retrieved chunks: {retrieved_chunks}
    Consider specific comments/preferences provided by the user: "{comment}"
    Make sure the plan aligns with diet type, health goals, disease conditions, allergies, and activity level.
    """

    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)
    return response.text

@app.route("/generate-meal-plan", methods=["POST"])
def generate():
    data = request.json

    query1 = f"Provide nutritional advice for a {data['gender']} of age {data['age']}."
    query2 = f"Provide nutritional advice for a {data['gender']} of age {data['age']} weight {data['weight_kg']} height {data['height_cm']} with {data['allergies']} allergy, diet type {data['diet_type']}, health goal of {data['health_goals']}, disease of {data['disease']}, and activity {data['activity_level']}."
    query3 = f"Provide foods and recipes for {data['preferred_cuisine']} cuisine."

    chunks1 = retrieve_documents(query1, vectorstore1)
    chunks2 = retrieve_documents(query2, vectorstore2)
    chunks3 = retrieve_documents(query3, vectorstore3)

    meal_plan = generate_meal_plan(data, chunks1 + chunks2 + chunks3)

    try:
        cleaned = meal_plan.strip()
        if cleaned.startswith("```json") and cleaned.endswith("```"):
            cleaned = cleaned[7:-3].strip()
        response_json = json.loads(cleaned)
        return jsonify(response_json)
    except Exception as e:
        return jsonify({"error": "Failed to parse response as JSON.", "raw": meal_plan})

if __name__ == "__main__":
    app.run(debug=True)
