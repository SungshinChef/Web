# 🍳 Taste Trip 

A personalized recipe recommendation app that helps users discover recipes based on their dietary preferences and restrictions.

## ✨ Features

- **Smart Recipe Search**
  - Search recipes by ingredients
  - Filter by cuisine type (27 different cuisines)
  - Get ingredient substitution suggestions
  - Korean translation support

- **Personalization**
  - Dietary preferences (Vegetarian, Vegan, Gluten-free, Ketogenic)
  - Allergy management
    - Default allergens (Eggs, Nuts, Milk, Shellfish, Peach)
    - Custom allergy additions
  - Save and apply preferences to recipe search

## 🛠 Tech Stack

- **Frontend**
  - React Native (Expo)
  - TypeScript
  - React Navigation

- **Backend**
  - FastAPI
  - Python
  - Spoonacular API (Recipe Data)
  - DeepL API (Translation)

## 👥 Team Members

<table>
  
</table>

## 🚀 Getting Started

1. Clone the repository
2. **Install Dependencies**

   - **Backend:** Navigate to the `backend` directory and install Python dependencies:
       ```bash
       cd backend
       pip install -r requirements.txt # assuming requirements.txt exists
       ```
   - **Frontend:** Navigate to the `frontend/taste-trip` directory and install Node.js dependencies:
       ```bash
       cd ../frontend/taste-trip
       npm install # or yarn install
       ```

3. Set up environment variables
   ```
   SPOONACULAR_API_KEY=your_api_key
   DEEPL_API_KEY=your_api_key
   GOOGLE_CLIENT_ID=
   SUPABASE_URL=
   SUPABASE_KEY=
   DATABASE_URL=
   ```
4. Start the backend server
   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
5. Start the frontend
   ```bash
   cd frontend/taste-trip
   npx expo start
   ```

## 📱 Screenshots

[Screenshots will be added soon]

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
