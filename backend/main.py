from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
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
SPOONACULAR_RECIPE_URL = "https://api.spoonacular.com/recipes/findByIngredients"
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

# 퍼센트 기반 레시피 검색 함수
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

    @field_validator("ingredients")
    @classmethod
    def check_minimum_ingredients(cls, v):
        if len(v) < 2:
            raise ValueError("❌ 최소 2개 이상의 재료를 입력해야 합니다.")
        return v

# ✅ 레시피 추천 API (복합 조건)
@app.post("/get_recipes/")
def get_recipes(request: IngredientsRequest):
    print("📥 받은 요청 데이터:", {
        "ingredients": request.ingredients,
        "allergies": request.allergies,
        "cuisine": request.cuisine,
        "dietary": request.dietary
    })

    # 알레르기 문자열 → 리스트 (영어로 번역)
    allergies = [translate_with_deepl(a.strip(), target_lang="EN") for a in request.allergies.split(",")] if request.allergies else []

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

# ✅ 퍼센트 기반 레시피 추천 API
@app.post("/get_recipes_by_percent/")
def get_recipes_by_percent(request: IngredientsRequest):
    ingredients = request.ingredients
    allergies = [translate_with_deepl(a.strip(), target_lang="EN") for a in request.allergies.split(",")] if request.allergies else []
    cuisine = request.cuisine
    dietary = request.dietary

    # 먼저 기본 레시피 검색
    recipes = get_recipes_by_ingredients(ingredients)
    filtered_recipes = []

    # 1단계: 필터링
    for recipe in recipes:
        recipe_detail = get_recipe_detail(recipe['id'])
        if not isinstance(recipe_detail, dict) or recipe_detail.get('error'):
            continue

        # 알레르기 필터링 (대소문자 구분 없이 검사)
        if allergies:
            recipe_ingredients = recipe_detail.get("ingredients", [])
            recipe_ingredients_text = " ".join(recipe_ingredients).lower()
            if any(allergen.lower() in recipe_ingredients_text for allergen in allergies):
                continue

        # 식단 필터링
        if dietary and not recipe_detail.get("vegan") and not recipe_detail.get("vegetarian"):
            continue

        # 나라별 요리 필터링
        if cuisine and recipe_detail.get("cuisines") and cuisine not in recipe_detail.get("cuisines", []):
            continue

        # 필터링을 통과한 레시피 정보 업데이트
        recipe.update({
            "title_kr": recipe_detail["title"],
            "readyInMinutes": recipe_detail.get("readyInMinutes", 0),
            "servings": recipe_detail.get("servings", 0),
            "instructions": recipe_detail.get("instructions", ""),
            "ingredients": recipe_detail.get("ingredients", []),
            "spoonacular_url": f"https://spoonacular.com/recipes/{recipe['title'].replace(' ', '-')}-{recipe['id']}"
        })
        filtered_recipes.append(recipe)

    # 2단계: 매칭률 계산 및 정렬
    for recipe in filtered_recipes:
        used = recipe.get("usedIngredientCount", 0)
        missed = recipe.get("missedIngredientCount", 0)
        total = used + missed
        match_score = used / total if total > 0 else 0
        recipe["match_score"] = match_score
        recipe["match_percentage"] = f"{int(match_score * 100)}%"

    # 매칭률로 정렬
    filtered_recipes.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    # 3단계: 카테고리별 분류
    categorized_recipes = {
        "100%": [],
        "80%": [],
        "50%": [],
        "30%": []
    }

    for recipe in filtered_recipes:
        match_score = recipe.get("match_score", 0)
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
            del recipe["match_score"]  # 임시로 사용한 match_score 제거
            categorized_recipes[category].append(recipe)

    return categorized_recipes

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
        "readyInMinutes": data.get("readyInMinutes", 0),
        "servings": data.get("servings", 0),
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
