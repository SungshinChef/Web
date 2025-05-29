from fastapi import FastAPI, HTTPException,Depends
from pydantic import BaseModel, field_validator
import requests
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from fastapi import Query
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy import create_engine, Column, String, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.orm import Session

from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import httpx

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
    "http://localhost:8081",
    "http://0.0.0.0:8000",
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

# Supabase 클라이언트 초기화
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# API 주소
SPOONACULAR_COMPLEX_SEARCH_URL = "https://api.spoonacular.com/recipes/complexSearch"
SPOONACULAR_RECIPE_URL = "https://api.spoonacular.com/recipes/findByIngredients"
SUBSTITUTE_URL = "https://api.spoonacular.com/food/ingredients/substitutes"
DEEPL_URL = "https://api-free.deepl.com/v2/translate"
RECIPE_INFO_URL = "https://api.spoonacular.com/recipes/{id}/information"

# 구글 OAuth 클라이언트 ID
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# PostgreSQL 접속 정보 (환경변수로 관리 추천)
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)  # 구글 sub
    email = Column(String, unique=True, index=True)
    name = Column(String)

class UserPreferences(Base):
    __tablename__ = "user_preferences"
    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id    = Column(String, ForeignKey("users.id"), unique=True, index=True)
    diet       = Column(String, nullable=True)  # JSON 문자열로 저장
    allergies  = Column(String, nullable=True)  # CSV 문자열로 저장

# relationship 설정 (선택)
User.preferences = relationship(
    "UserPreferences",
    backref="user",
    uselist=False,
    cascade="all, delete-orphan"
)

# 간단한 인메모리 번역 캐시
translation_cache = {}

# 비동기 번역 함수 (DeepL API Pro Plan 필요)
async def translate_with_deepl_async(text, target_lang="EN"):
    if not text:
        return text # 빈 텍스트는 번역하지 않음

    # 캐시 확인
    cache_key = f"{text}_{target_lang}"
    if cache_key in translation_cache:
        # print(f"✅ 캐시 사용: {text[:20]}...") # 디버깅용 (선택 사항)
        return translation_cache[cache_key]

    # API 호출 (비동기 클라이언트 사용)
    async with httpx.AsyncClient() as client:
        try:
            params = {
                "auth_key": DEEPL_API_KEY,
                "text": text,
                "target_lang": target_lang
            }
            # print(f"🌐 DeepL API 호출: {DEEPL_URL}, params: {params.get('text', '')[:20]}...") # 디버깅용 (선택 사항)
            response = await client.post(DEEPL_URL, data=params)

            if response.status_code == 200:
                translated_text = response.json()["translations"][0]["text"]
                # 캐시에 저장
                translation_cache[cache_key] = translated_text
                # print(f"🌐 API 호출 후 캐시 저장: {text[:20]}...") # 디버깅용 (선택 사항)
                return translated_text
            else:
                print(f"❌ 번역 실패 ({response.status_code}): {response.text}")
                return text # 실패 시 원본 텍스트 반환
        except Exception as e:
            print(f"❌ 번역 중 오류 발생: {e}")
            return text # 오류 발생 시 원본 텍스트 반환

# 비동기 Spoonacular API 클라이언트
# 여러 API 호출에서 재사용할 수 있도록 전역 또는 앱 상태로 관리하는 것이 좋습니다.
# 여기서는 간단하게 함수 내에서 생성합니다.

# ✅ 비동기 레시피 추천 함수 (복합 조건)
async def get_recipes_complex_async(ingredients, allergies=None, cuisine=None, diet=None):
    # 재료 및 알레르기 번역 (비동기 병렬 처리)
    translated_ingredients_tasks = [translate_with_deepl_async(i, target_lang="EN") for i in ingredients]
    translated_allergies_tasks = [translate_with_deepl_async(a.strip(), target_lang="EN") for a in allergies.split(",")] if allergies else []

    translated_ingredients = await asyncio.gather(*translated_ingredients_tasks)
    translated_allergies = await asyncio.gather(*translated_allergies_tasks)
    translated_allergies = [a for a in translated_allergies if a] # 빈 문자열 제거

    params = {
        "includeIngredients": ",".join(translated_ingredients),
        "intolerances": ",".join(translated_allergies),
        "cuisine": cuisine,
        "diet": diet,
        "number": 5,
        "addRecipeInformation": True,
        "fillIngredients": True,
        "apiKey": SPOONACULAR_API_KEY
    }


    async with httpx.AsyncClient() as client:
        response = await client.get(SPOONACULAR_COMPLEX_SEARCH_URL, params=params)

    if response.status_code != 200:
        print(f"❌ 복합 검색 실패 ({response.status_code}): {response.text}")
        return {"error": "Failed to retrieve complex search recipes"}

    recipes = response.json().get("results", [])

    # 각 레시피 정보(재료, 제목) 번역 (비동기 병렬 처리)
    async def process_recipe(recipe):
         if "extendedIngredients" in recipe:
            ingredient_tasks = [
                translate_with_deepl_async(ingredient.get("original", ""), target_lang="KO")
                for ingredient in recipe["extendedIngredients"]
            ]
            recipe["ingredients"] = await asyncio.gather(*ingredient_tasks)
         else:
             recipe["ingredients"] = []

         if "title" in recipe:
             recipe["title_kr"] = await translate_with_deepl_async(recipe["title"], target_lang="KO")

         return recipe

    # 레시피 목록 전체를 비동기 병렬 처리
    processed_recipes_tasks = [process_recipe(recipe) for recipe in recipes]
    processed_recipes = await asyncio.gather(*processed_recipes_tasks)

    return processed_recipes

# ✅ 비동기 퍼센트 기반 레시피 검색 함수
async def get_recipes_by_ingredients_async(ingredients):
    translated_ingredients_tasks = [translate_with_deepl_async(ingredient, target_lang="EN") for ingredient in ingredients]
    translated_ingredients = await asyncio.gather(*translated_ingredients_tasks)

    params = {
        "ingredients": ",".join(translated_ingredients),
        "number": 100, # 더 많은 결과를 가져와 필터링
        "apiKey": SPOONACULAR_API_KEY
    }

    # --- Spoonacular API 호출 전 로깅 ---
    print("\n--- Spoonacular API 요청 (Find By Ingredients) ---")
    print(f"URL: {SPOONACULAR_RECIPE_URL}")
    print(f"Params: {params}")
    print("-----------------------------------------------\n")
    # ------------------------------------

    async with httpx.AsyncClient() as client:
         response = await client.get(SPOONACULAR_RECIPE_URL, params=params)

    if response.status_code == 200:
        return response.json()
    else:
        raise HTTPException(status_code=response.status_code, detail="❌ 레시피 정보를 가져오는데 실패했습니다.")

# ✅ 비동기 레시피 상세 정보 함수
async def get_recipe_detail_async(id: int):
    # 레시피 상세 정보 요청 (비동기)
    url = RECIPE_INFO_URL.format(id=id)
    params = {"apiKey": SPOONACULAR_API_KEY}


    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)

    if response.status_code != 200:
        print(f"❌ 상세 정보 가져오기 실패 ({response.status_code}): {response.text}")
        return {"error": "Failed to fetch recipe info"}

    data = response.json()

    # 번역 처리 (비동기 병렬 처리)
    translation_tasks = [
        translate_with_deepl_async(data.get("title", ""), target_lang="KO"),
        translate_with_deepl_async(data.get("summary", ""), target_lang="KO"),
        translate_with_deepl_async(data.get("instructions", ""), target_lang="KO")
    ]
    ingredients = [ing.get("original", "") for ing in data.get("extendedIngredients", []) if ing.get("original")] # 빈 재료명 제외
    ingredient_tasks = [translate_with_deepl_async(i, target_lang="KO") for i in ingredients]

    results = await asyncio.gather(*(translation_tasks + ingredient_tasks))

    translated_title = results[0]
    translated_summary = results[1]
    translated_instructions = results[2]
    translated_ingredients = results[3:]

    return {
        "title": data.get("title"), # 원본 제목도 함께 반환 (필요시)
        "title_kr": translated_title,
        "summary": translated_summary,
        "instructions": translated_instructions,
        "ingredients": translated_ingredients,
        "image": data.get("image"),
        "readyInMinutes": data.get("readyInMinutes", 0),
        "servings": data.get("servings", 0),
    }

# ✅ 비동기 대체 재료 API
async def get_substitutes_async(ingredient_name):
    if not ingredient_name:
        return []

    # 이 부분이 한국어 재료명을 영어로 번역하는 부분입니다.
    translated_ingredient = await translate_with_deepl_async(ingredient_name, target_lang="EN")

    params = {
        "ingredientName": translated_ingredient, # <-- 번역된 영어 재료명을 Spoonacular에 전달합니다.
        "apiKey": SPOONACULAR_API_KEY
    }

    # --- Spoonacular API 호출 전 로깅 ---
    print("\n--- Spoonacular API 요청 (Substitutes) ---")
    print(f"URL: {SUBSTITUTE_URL}")
    print(f"Params: {params}")
    print("---------------------------------------\n")
    # ------------------------------------

    async with httpx.AsyncClient() as client:
        response = await client.get(SUBSTITUTE_URL, params=params)

    if response.status_code == 200:
        substitutes = response.json().get("substitutes", [])
        # Spoonacular에서 받은 영어 대체 재료 목록을 다시 한국어로 번역합니다.
        translated_substitutes_tasks = [translate_with_deepl_async(s, target_lang="KO") for s in substitutes]
        translated_substitutes = await asyncio.gather(*translated_substitutes_tasks)
        return translated_substitutes
    else:
        print(f"❌ 대체 재료 가져오기 실패 ({response.status_code}): {response.text}")
        return []

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/preferences/{user_id}")
def read_preferences(user_id: str, db: Session = Depends(get_db)):
    pref = db.query(UserPreferences).filter_by(user_id=user_id).first()
    if not pref:
        raise HTTPException(status_code=404, detail="Preferences not set")
    return {"diet": pref.diet, "allergies": pref.allergies}

@app.post("/api/preferences/{user_id}")
def create_preferences(
    user_id: str,
    payload: dict,  # {"diet": "{...}", "allergies": "a,b,c"}
    db: Session = Depends(get_db)
):
    # 이미 저장되어 있으면 거부
    exists = db.query(UserPreferences).filter_by(user_id=user_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Preferences already set")

    pref = UserPreferences(
        user_id=user_id,
        diet=payload.get("diet"),
        allergies=payload.get("allergies")
    )
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return {"message": "Preferences saved"}

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
        if len(v) < 1:
            raise ValueError("❌ 최소 1개 이상의 재료를 입력해야 합니다.")
        return v

# ✅ 레시피 추천 API (복합 조건)
@app.post("/get_recipes/")
async def get_recipes(request: IngredientsRequest):
    print("📥 받은 요청 데이터:", {
        "ingredients": request.ingredients,
        "allergies": request.allergies,
        "cuisine": request.cuisine,
        "dietary": request.dietary
    })

    # 알레르기 문자열 → 리스트
    allergies_list = [a.strip() for a in request.allergies.split(",")] if request.allergies else []

    recipes = await get_recipes_complex_async( # await 추가
        ingredients=request.ingredients,
        allergies=request.allergies, # 문자열 그대로 전달 (get_recipes_complex_async 내부에서 처리)
        cuisine=request.cuisine,
        diet=request.dietary
    )

    # Spoonacular API 요청 파라미터 로깅 (번역된 재료 사용)
    # 이미 get_recipes_complex_async에서 번역을 수행했으므로, 거기서 로깅하거나
    # 번역된 결과를 받아서 로깅하는 것이 더 정확합니다. 여기서는 생략합니다.


    # 제목 번역은 get_recipes_complex_async 내부에서 처리됨
    return recipes

# ✅ 퍼센트 기반 레시피 추천 API 비동기화
@app.post("/get_recipes_by_percent/")
async def get_recipes_by_percent(request: IngredientsRequest):
    ingredients = request.ingredients
    allergies_list = [a.strip() for a in request.allergies.split(",")] if request.allergies else []
    cuisine = request.cuisine
    dietary = request.dietary

    # 먼저 기본 레시피 검색 (비동기)
    recipes = await get_recipes_by_ingredients_async(ingredients) # await 추가
    filtered_recipes = []

    # 레시피 상세 정보 가져오기 및 필터링, 매칭률 계산 (비동기 병렬 처리)
    async def process_and_filter_recipe(recipe):
        recipe_detail = await get_recipe_detail_async(recipe['id']) # await 추가
        if not isinstance(recipe_detail, dict) or recipe_detail.get('error'):
            return None # 처리 실패 또는 에러 발생 시 건너뛰기

        # 알레르기 필터링 (대소문자 구분 없이 검사, 한국어 재료명 사용)
        if allergies_list:
            recipe_ingredients = recipe_detail.get("ingredients", []) # 이미 한국어로 번역된 재료
            recipe_ingredients_text = " ".join(recipe_ingredients).lower()
            # 알레르기 항목도 한국어로 소문자 변환하여 비교
            translated_allergies_lower = [a.lower() for a in allergies_list]
            if any(allergen_lower in recipe_ingredients_text for allergen_lower in translated_allergies_lower):
                return None # 알레르기 재료 포함 시 제외

        # 식단 필터링 (Spoonacular 결과 사용 또는 상세 정보에서 확인)
        # get_recipe_detail_async에 boolean 필드 추가 필요 (vegan, vegetarian 등)
        # 현재 코드 구조상 상세 정보에서만 확인 가능
        if dietary:
             is_vegetarian = recipe_detail.get("vegetarian", False) # 상세 정보에 필드 추가 가정
             is_vegan = recipe_detail.get("vegan", False) # 상세 정보에 필드 추가 가정

             if dietary.lower() == "vegetarian" and not is_vegetarian:
                  return None
             if dietary.lower() == "vegan" and not is_vegan:
                   return None
             # 다른 식단 옵션 추가 필요

        # 나라별 요리 필터링 (Spoonacular 상세 정보의 cuisines 필드 사용)
        if cuisine:
             recipe_cuisines = recipe_detail.get("cuisines", []) # 상세 정보에 필드 추가 가정
             if cuisine not in recipe_cuisines:
                  return None


        # 필터링을 통과한 레시피 정보 업데이트
        # 상세 정보에서 이미 번역된 필드를 가져옴
        updated_recipe = recipe.copy() # 원본 레시피 정보 복사
        updated_recipe.update({
            "title_kr": recipe_detail.get("title_kr", recipe["title"]), # 번역된 제목 사용, 없으면 원본
            "readyInMinutes": recipe_detail.get("readyInMinutes", 0),
            "servings": recipe_detail.get("servings", 0),
            "instructions": recipe_detail.get("instructions", ""),
            "ingredients": recipe_detail.get("ingredients", []), # 번역된 재료 사용
            "spoonacular_url": f"https://spoonacular.com/recipes/{recipe['title'].replace(' ', '-')}-{recipe['id']}" # 원본 제목 사용
        })

        # 매칭률 계산
        used = updated_recipe.get("usedIngredientCount", 0)
        missed = updated_recipe.get("missedIngredientCount", 0)
        total = used + missed
        match_score = used / total if total > 0 else 0
        updated_recipe["match_score"] = match_score
        updated_recipe["match_percentage"] = f"{int(match_score * 100)}%"

        return updated_recipe

    # 모든 레시피에 대해 비동기 병렬 처리 및 필터링
    processed_tasks = [process_and_filter_recipe(recipe) for recipe in recipes]
    processed_results = await asyncio.gather(*processed_tasks)

    # 유효한 결과만 필터링
    filtered_recipes = [result for result in processed_results if result is not None]

    # 매칭률로 정렬
    filtered_recipes.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    # 카테고리별 분류 및 결과 제한
    categorized_recipes = {
        "100%": [],
        "80%": [],
        "50%": [],
        "30%": []
    }

    for recipe in filtered_recipes:
        match_score = recipe.get("match_score", 0)
        category = None
        if match_score >= 1.0:
            category = "100%"
        elif match_score >= 0.8:
            category = "80%"
        elif match_score >= 0.5:
            category = "50%"
        elif match_score >= 0.3:
            category = "30%"

        if category and len(categorized_recipes[category]) < 5:
            del recipe["match_score"]  # 임시로 사용한 match_score 제거
            categorized_recipes[category].append(recipe)

    return categorized_recipes

# ✅ 레시피 상세 정보 API 비동기화
@app.get("/get_recipe_detail/")
async def get_recipe_detail_endpoint(id: int = Query(...)): # 쿼리 파라미터로 id 받기
    return await get_recipe_detail_async(id) # await 추가

# ✅ 대체 재료 API 비동기화
@app.post("/get_substitutes/")
async def get_substitute_endpoint(request: IngredientsRequest):
    if not request.ingredients:
        return {"substitutes": [], "error": "No ingredient provided"}

    substitutes = await get_substitutes_async(request.ingredients[0]) # await 추가

    return {"substitutes": substitutes}

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

class TokenPayload(BaseModel):
    token: str

@app.post("/api/auth/google")
def google_login(payload: TokenPayload):
    db = SessionLocal()
    try:
        # 1) 구글 토큰 검증
        idinfo = id_token.verify_oauth2_token(
            payload.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        user_id = idinfo["sub"]
        email   = idinfo.get("email")
        name    = idinfo.get("name")

        # 2) DB에 사용자 존재 여부 확인
        existing = db.query(User).filter(User.id == user_id).first()
        if existing:
            return {"message": "이미 등록된 사용자", "user": {
                "id": existing.id,
                "email": existing.email,
                "name": existing.name
            }}

        # 신규 사용자 저장
        new_user = User(id=user_id, email=email, name=name)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # ▶ Supabase에도 upsert
        supabase.table("users").upsert({
            "id":    new_user.id,
            "email": new_user.email,
            "name":  new_user.name
        }).execute()

        return {
            "message": "회원가입 성공",
            "user": {
                "id":    new_user.id,
                "email": new_user.email,
                "name":  new_user.name
            },
            "result": "success"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()

@app.websocket("/ws/users")
async def users_ws(websocket: WebSocket):
    """
    Supabase 'users' 테이블의 INSERT/UPDATE/DELETE 이벤트를
    WebSocket으로 실시간 전송합니다.
    """
    await websocket.accept()
    # Supabase Realtime 채널 구독
    channel = (
        supabase
        .channel("public:users")
        .on("INSERT",  lambda payload: asyncio.create_task(
            websocket.send_json({"event": "INSERT", "new": payload["new"]})
        ))
        .on("UPDATE",  lambda payload: asyncio.create_task(
            websocket.send_json({"event": "UPDATE", "new": payload["new"]})
        ))
        .on("DELETE",  lambda payload: asyncio.create_task(
            websocket.send_json({"event": "DELETE", "old": payload["old"]})
        ))
        .subscribe()
    )

    try:
        # 클라이언트가 연결을 끊을 때까지 대기
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        # 클라이언트가 연결을 종료한 경우
        pass
    finally:
        # 구독 해제
        supabase.remove_channel(channel)

@app.get("/api/user/{user_id}")
def get_user_info(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # avatar는 예시로 기본 이미지 URL 사용, nickname은 name과 동일하게 반환
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "nickname": user.name,
        "avatar": "https://randomuser.me/api/portraits/men/32.jpg"
    }
@app.put("/api/preferences/{user_id}")
def update_preferences(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):
    pref = db.query(UserPreferences).filter_by(user_id=user_id).first()
    if not pref:
        raise HTTPException(status_code=404, detail="Preferences not found")

    pref.diet = payload.get("diet", pref.diet)
    pref.allergies = payload.get("allergies", pref.allergies)

    db.commit()
    db.refresh(pref)
    return {"message": "Preferences updated"}

# Add a new endpoint to translate a list of ingredients
@app.post("/translate_ingredients_list/")
async def translate_ingredients_list(request: IngredientsRequest):
    translated_ingredients = []
    for ingredient in request.ingredients:
        # Assuming translate_with_deepl can handle both source and target languages dynamically
        # To translate from Korean to English, we need to swap target_lang and source_lang
        translated = await translate_with_deepl_async(ingredient, target_lang="en")
        translated_ingredients.append({"original": ingredient, "translated": translated})
    return {"translations": translated_ingredients}