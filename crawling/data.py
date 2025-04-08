from fastapi import FastAPI
from pydantic import BaseModel, field_validator
import requests
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

# FastAPI 앱 인스턴스 생성
app = FastAPI()
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 키 불러오기
load_dotenv()
SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")

# Spoonacular & DeepL API URL
SPOONACULAR_RECIPE_URL = "https://api.spoonacular.com/recipes/findByIngredients"
DEEPL_URL = "https://api-free.deepl.com/v2/translate"

# DeepL 번역 함수
def translate_with_deepl(text, target_lang="KO"):
    params = {
        "auth_key": DEEPL_API_KEY,
        "text": text,
        "target_lang": target_lang
    }
    response = requests.post(DEEPL_URL, data=params)
    if response.status_code == 200:
        return response.json()["translations"][0]["text"]
    else:
        print("DeepL 번역 실패:", response.text)
        return text  # 실패 시 원문 그대로 반환

# Spoonacular 레시피 검색 함수
def get_recipes_by_ingredients(ingredients):
    translated_ingredients = [translate_with_deepl(ingredient, target_lang="EN") for ingredient in ingredients]

    params = {
        "ingredients": ",".join(translated_ingredients),
        "number": 5,
        "apiKey": SPOONACULAR_API_KEY
    }

    response = requests.get(SPOONACULAR_RECIPE_URL, params=params)

    if response.status_code == 200:
        recipes = response.json()
        return recipes
    else:
        return {"error": "Failed to retrieve recipes"}

# 요청 모델
class IngredientsRequest(BaseModel):
    ingredients: list

    @field_validator("ingredients")
    @classmethod
    def check_minimum_ingredients(cls, v):
        if len(v) < 3:
            raise ValueError("❌ 최소 3개 이상의 재료를 입력해야 합니다.")
        return v

# 레시피 검색 엔드포인트
@app.post("/get_recipes/")
def get_recipes(request: IngredientsRequest):
    ingredients = request.ingredients
    recipes = get_recipes_by_ingredients(ingredients)

    for recipe in recipes:
        if "title" in recipe:
            recipe["title_kr"] = translate_with_deepl(recipe["title"], target_lang="KO")

    return recipes
