from fastapi import FastAPI
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from fastapi import Query

# FastAPI 인스턴스
app = FastAPI()

# CORS 미들웨어 설정
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:19000",  # Expo 개발 서버
    "http://localhost:19006",  # Expo 웹
    "exp://localhost:19000",   # Expo Go
    "http://172.30.1.25:8000", # 현재 백엔드 URL
    "exp://172.30.1.25:19000", # Expo 개발 서버
    "http://172.30.1.25:19000",
    "http://172.30.1.25:19006",
    "*"  # 개발 중에는 모든 origin 허용
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# 환경변수 불러오기
load_dotenv()
SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")

# API 주소
SPOONACULAR_COMPLEX_SEARCH_URL = "https://api.spoonacular.com/recipes/complexSearch"
SUBSTITUTE_URL = "https://api.spoonacular.com/food/ingredients/substitutes"
DEEPL_URL = "https://api-free.deepl.com/v2/translate"
RECIPE_INFO_URL = "https://api.spoonacular.com/recipes/{id}/information"

# 번역 함수
def translate_with_deepl(text, target_lang="EN"):
    params = {
        "auth_key": DEEPL_API_KEY,
        "text": text,
        "target_lang": target_lang
    }
    response = requests.post(DEEPL_URL, data=params)
    if response.status_code == 200:
        return response.json()["translations"][0]["text"]
    else:
        print("❌ 번역 실패:", response.text)
        return text

# 레시피 추천 함수 (복합 조건)
def get_recipes_complex(ingredients, allergies=None, cuisine=None, diet=None):
    translated_ingredients = [translate_with_deepl(i, target_lang="EN") for i in ingredients]
    translated_allergies = [translate_with_deepl(a, target_lang="EN") for a in allergies] if allergies else []

    params = {
        "includeIngredients": ",".join(translated_ingredients),
        "intolerances": ",".join(translated_allergies),
        "cuisine": cuisine,
        "diet": diet,
        "number": 5,
        "addRecipeInformation": True,
        "fillIngredients": True,  # 재료 정보 포함
        "apiKey": SPOONACULAR_API_KEY
    }

    response = requests.get(SPOONACULAR_COMPLEX_SEARCH_URL, params=params)

    if response.status_code != 200:
        print("❌ 복합 검색 실패:", response.text)
        return {"error": "Failed to retrieve complex search recipes"}

    recipes = response.json().get("results", [])
    
    # 각 레시피에 대해 재료 정보 처리
    for recipe in recipes:
        if "extendedIngredients" in recipe:
            recipe["ingredients"] = [
                translate_with_deepl(ingredient.get("original", ""), target_lang="KO")
                for ingredient in recipe["extendedIngredients"]
            ]
        else:
            recipe["ingredients"] = []  # 빈 배열로 초기화

    return recipes

# Substitute 검색 함수
def get_substitutes(ingredient_name):
    params = {
        "ingredientName": ingredient_name,
        "apiKey": SPOONACULAR_API_KEY
    }
    response = requests.get(SUBSTITUTE_URL, params=params)

    if response.status_code == 200:
        return response.json().get("substitutes", [])
    else:
        return {"error": "Failed to retrieve substitutes"}

# ✅ 요청 모델 정의 (프론트엔드에 맞춤)
class IngredientsRequest(BaseModel):
    ingredients: List[str]
    allergies: Optional[str] = ""         # "계란,우유"
    cuisine: Optional[str] = None         # Korean, Italian
    dietary: Optional[str] = None         # vegetarian, vegan 등

# ✅ 레시피 추천 API
@app.post("/get_recipes/")
def get_recipes(request: IngredientsRequest):
    print("📥 받은 요청 데이터:", {
        "ingredients": request.ingredients,
        "allergies": request.allergies,
        "cuisine": request.cuisine,
        "dietary": request.dietary
    })

    # 알레르기 문자열 → 리스트
    allergies = request.allergies.split(",") if request.allergies else []

    recipes = get_recipes_complex(
        ingredients=request.ingredients,
        allergies=allergies,
        cuisine=request.cuisine,
        diet=request.dietary
    )

    # Spoonacular API 요청 파라미터 로깅
    print("🔍 Spoonacular API 요청:", {
        "ingredients": ",".join([translate_with_deepl(i, target_lang="EN") for i in request.ingredients]),
        "allergies": ",".join(allergies),
        "cuisine": request.cuisine,
        "diet": request.dietary
    })

    # 제목 번역 추가
    if isinstance(recipes, list):
        for recipe in recipes:
            if "title" in recipe:
                recipe["title_kr"] = translate_with_deepl(recipe["title"], target_lang="KO")

    return recipes


@app.get("/get_recipe_detail/")
def get_recipe_detail(id: int):
    # 레시피 상세 정보 요청
    url = RECIPE_INFO_URL.format(id=id)
    params = {"apiKey": SPOONACULAR_API_KEY}
    response = requests.get(url, params=params)

    if response.status_code != 200:
        return {"error": "Failed to fetch recipe info"}

    data = response.json()

    # 번역 처리
    translated_title = translate_with_deepl(data.get("title", ""), target_lang="KO")
    translated_summary = translate_with_deepl(data.get("summary", ""), target_lang="KO")
    translated_instructions = translate_with_deepl(data.get("instructions", ""), target_lang="KO")

    ingredients = [ing.get("original", "") for ing in data.get("extendedIngredients", [])]
    translated_ingredients = [translate_with_deepl(i, target_lang="KO") for i in ingredients]

    return {
        "title": translated_title,
        "summary": translated_summary,
        "instructions": translated_instructions,
        "ingredients": translated_ingredients,
        "image": data.get("image"),
    }

# ✅ 대체 재료 API
@app.post("/get_substitutes/")
def get_substitute(request: IngredientsRequest):
    if not request.ingredients:
        return {"error": "No ingredient provided"}

    translated = translate_with_deepl(request.ingredients[0], target_lang="EN")
    substitutes = get_substitutes(translated)
    translated_substitutes = [translate_with_deepl(s, target_lang="KO") for s in substitutes]

    return {"substitutes": translated_substitutes}
