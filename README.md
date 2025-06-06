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
  - Docker

- **Backend**
  - FastAPI
  - Python
  - Spoonacular API (Recipe Data)
  - DeepL API (Translation)
  - Docker

- **Deployment**
  - Docker Compose

## 👥 Team Members

<table>
  
</table>

## 🚀 Getting Started

To run this project using Docker Compose, follow these steps:

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd Web # Or the root directory of the cloned repository
    ```

2.  **Set up Environment Variables:**
    Create a `.env` file in the project root directory (where `docker-compose.yml` is located). Copy the contents of `.env.example` into `.env` and fill in your actual API keys and database credentials.

    ```bash
    cp .env.example .env
    # Open .env in your editor and fill in the values
    ```
    **Make sure your `.env` file is not committed to Git by checking `.gitignore`.**

3.  **Build and Run with Docker Compose:**
    Ensure you have Docker and Docker Compose installed. Then, run the following command in the project root directory:

    ```bash
    docker-compose up --build
    ```

    This command will build the Docker images for the backend and frontend services (if they haven't been built yet or if Dockerfiles have changed) and start the containers. The frontend (Expo) should be accessible via the Expo Go app or web browser.

## 📱 Screenshots

[Screenshots will be added soon]

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
