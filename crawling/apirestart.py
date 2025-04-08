import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from dotenv import load_dotenv
import time
 
# 환경 변수 로드
load_dotenv() 

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Supabase 클라이언트 생성
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

BASE_URL = "https://www.10000recipe.com"


def safe_get(url, delay=5):
    """응답 올 때까지 무한 재시도하는 GET 요청"""
    while True:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response
        except (requests.exceptions.RequestException, requests.exceptions.ConnectionError) as e:
            print(f"⚠️ 요청 실패: {e}\n⏳ {delay}초 후 재시도 중...")
            time.sleep(delay)


def get_recipe_links():
    """모든 페이지에서 레시피 링크 크롤링"""
    page = 1
    all_links = []

    while True:
        url = f"{BASE_URL}/recipe/list.html?order=reco&page={page}"
        response = safe_get(url)
        soup = BeautifulSoup(response.text, "html.parser")

        links = [BASE_URL + a["href"] for a in soup.select(".common_sp_list_li a.common_sp_link")]

        if not links:  # 더 이상 링크가 없으면 종료
            print(f"✅ 모든 페이지 크롤링 완료 (총 {page - 1} 페이지)")
            break

        all_links.extend(links)
        print(f"📌 {page} 페이지 크롤링 완료, 현재까지 {len(all_links)}개 수집")
        page += 1
        time.sleep(1)  # 서버 부하 방지

    return all_links


def get_saved_urls():
    """Supabase에 이미 저장된 레시피 URL 목록 가져오기"""
    saved_urls = []
    page = 0

    while True:
        response = supabase.table("recipes_db").select("url").range(page * 1000, (page + 1) * 1000 - 1).execute()
        if not response.data:
            break
        saved_urls.extend([item["url"] for item in response.data])
        page += 1

    return set(saved_urls)


def get_recipe_details(recipe_url):
    """개별 레시피 상세정보 크롤링"""
    response = safe_get(recipe_url)
    soup = BeautifulSoup(response.text, "html.parser")

    try:
        title = soup.select_one(".view2_summary h3").text.strip()
        image = soup.select_one(".centeredcrop img")["src"]
        ingredients = [i.text.strip() for i in soup.select(".ready_ingre3 ul li")]
        steps = [s.text.strip() for s in soup.select(".view_step .media-body")]

        return {
            "title": title,
            "image": image,
            "ingredients": ", ".join(ingredients),
            "steps": " | ".join(steps),
            "url": recipe_url
        }
    except AttributeError:
        print(f"❌ 레시피 파싱 실패: {recipe_url}")
        return None


def save_to_supabase(recipe):
    """Supabase에 데이터 저장"""
    response = supabase.table("recipes_db").insert(recipe).execute()
    if response.data:
        print(f"✅ 저장 완료: {recipe['title']}")
    else:
        print(f"❌ 저장 실패: {recipe['title']} - {response.error}")


def main():
    """전체 크롤링 실행"""
    recipe_links = get_recipe_links()
    saved_urls = get_saved_urls()

    print(f"✅ 이미 저장된 레시피 수: {len(saved_urls)}")
    print(f"📦 총 수집된 링크 수: {len(recipe_links)}")

    # 중복 제거
    new_links = [link for link in recipe_links if link not in saved_urls]
    print(f"🚀 새로 저장할 레시피 수: {len(new_links)}")

    for idx, link in enumerate(new_links):
        print(f"\n📌 ({idx + 1}/{len(new_links)}) {link} 크롤링 중...")
        recipe = get_recipe_details(link)

        if recipe:
            save_to_supabase(recipe)

        time.sleep(1)  # 서버 부하 방지


if __name__ == "__main__":
    main()