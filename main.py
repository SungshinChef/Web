from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
import requests
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")

SPOONACULAR_RECIPE_URL = "https://api.spoonacular.com/recipes/findByIngredients"
DEEPL_URL = "https://api-free.deepl.com/v2/translate"

def translate_with_deepl(text, target_lang="KO"):
    params = {
        "auth_key": DEEPL_API_KEY,
        "text": text,
        "target_lang": target_lang
    }
    try:
        response = requests.post(DEEPL_URL, data=params)
        response.raise_for_status()
        return response.json()["translations"][0]["text"]
    except requests.exceptions.RequestException as e:
        print("DeepL 번역 오류:", str(e))
        return text

def get_recipes_by_ingredients(ingredients):
    translated_ingredients = [translate_with_deepl(ingredient, target_lang="EN") for ingredient in ingredients]
    params = {
        "ingredients": ",".join(translated_ingredients),
        "number": 100,
        "apiKey": SPOONACULAR_API_KEY
    }
    response = requests.get(SPOONACULAR_RECIPE_URL, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        raise HTTPException(status_code=502, detail="❌ 레시피 정보를 가져오는데 실패했습니다.")

class IngredientsRequest(BaseModel):
    ingredients: List[str]

    @field_validator("ingredients")
    @classmethod
    def check_minimum_ingredients(cls, v):
        if len(v) < 3:
            raise ValueError("❌ 최소 3개 이상의 재료를 입력해야 합니다.")
        return v

@app.post("/get_recipes/")
def get_recipes(request: IngredientsRequest):
    ingredients = request.ingredients
    recipes = get_recipes_by_ingredients(ingredients)

    categorized_recipes = {
        "100%": [],
        "80%": [],
        "50%": [],
        "30%": []
    }

    for recipe in recipes:
        used = recipe.get("usedIngredientCount", 0)
        missed = recipe.get("missedIngredientCount", 0)
        total = used + missed
        match_score = used / total if total > 0 else 0

        if match_score >= 1.0:
            category = "100%"
        elif match_score >= 0.8:
            category = "80%"
        elif match_score >= 0.5:
            category = "50%"
        elif match_score >= 0.3:
            category = "30%"
        else:
            continue

        if len(categorized_recipes[category]) < 5:
            recipe["title_kr"] = translate_with_deepl(recipe["title"], target_lang="KO")
            recipe["spoonacular_url"] = f"https://spoonacular.com/recipes/{recipe['title'].replace(' ', '-')}-{recipe['id']}"
            categorized_recipes[category].append(recipe)

    return categorized_recipes
