from fastapi import FastAPI
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

# FastAPI 앱 인스턴스 생성
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 중엔 전체 허용. 배포 시 특정 도메인만!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API 키 '.env'에서 불러오기 - .env에 api키 작성해놔야 실행됨!!
load_dotenv()
SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")

# Spoonacular API
SUBSTITUTE_URL = "https://api.spoonacular.com/food/ingredients/substitutes"
SPOONACULAR_RECIPE_URL = "https://api.spoonacular.com/recipes/findByIngredients"

# DeepL API
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

# Spoonacular 레시피 함수
def get_recipes_by_ingredients(ingredients):
    # 한국어 재료를 영어로 번역
    translated_ingredients = [translate_with_deepl(ingredient, target_lang="EN") for ingredient in ingredients]

    # Spoonacular API로 레시피 검색
    params = {
        "ingredients": ",".join(translated_ingredients),
        "number": 5,  # 최대 레시피 개수
        "apiKey": SPOONACULAR_API_KEY
    }

    response = requests.get(SPOONACULAR_RECIPE_URL, params=params)

    if response.status_code == 200:
        recipes = response.json()
        return recipes
    else:
        return {"error": "Failed to retrieve recipes"}

# Spoonacular 대체 재료 함수
def get_substitutes(ingredient_name):
    params = {
        "ingredientName": ingredient_name,
        "apiKey": SPOONACULAR_API_KEY
    }

    response = requests.get(SUBSTITUTE_URL, params=params)

    # print(f"[대체재 요청] ingredient: {ingredient_name}")
    # print(f"[API 응답 코드]: {response.status_code}")
    # print(f"[API 응답 내용]: {response.text}") 

    if response.status_code == 200:
        data = response.json()
        substitutes = data.get("substitutes", [])
        return substitutes
    else:
        return {"error": "Failed to retrieve substitutes"}


# 요청 모델 정의 (Pydantic)
class IngredientsRequest(BaseModel):
    ingredients: list

# FastAPI 엔드포인트
@app.post("/get_recipes/")
def get_recipes(request: IngredientsRequest):
    ingredients = request.ingredients
    recipes = get_recipes_by_ingredients(ingredients)

    # 레시피 제목을 한국어로 번역
    for recipe in recipes:
        if "title" in recipe:
            recipe["title_kr"] = translate_with_deepl(recipe["title"], target_lang="KO")

    return recipes

@app.post("/get_substitutes/")
def get_substitute(request: IngredientsRequest):
    ingredient = request.ingredients[0]

    # 영어로 번역 추가
    translated = translate_with_deepl(ingredient, target_lang="EN")
    print(f"🔤 번역된 재료명: {translated}")

    substitutes = get_substitutes(translated)

    # 대체 재료들을 한국어로 번역
    translated_substitutes = [translate_with_deepl(substitute, target_lang="KO") for substitute in substitutes]

    return {"substitutes": translated_substitutes}
