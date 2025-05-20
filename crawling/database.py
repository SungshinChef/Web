import time
import psycopg2
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    StaleElementReferenceException, 
    NoSuchElementException, 
    TimeoutException,
)
from webdriver_manager.chrome import ChromeDriverManager

# PostgreSQL 연결 정보
DB_CONFIG = {
    "dbname": "your_db",
    "user": "postgres",
    "password": "",
    "host": "localhost",
    "port": "5432",
}

# PostgreSQL 테이블 생성 SQL
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    title TEXT UNIQUE,
    ingredients TEXT,
    instructions TEXT,
    image_url TEXT
);
"""

# PostgreSQL에 데이터 저장 함수
def save_to_postgresql(data):
    if not data:
        print("❌ 저장할 데이터가 없습니다.")
        return

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute(CREATE_TABLE_SQL)  # 테이블 생성
    conn.commit()

    INSERT_SQL = """
    INSERT INTO recipes (title, ingredients, instructions, image_url)
    VALUES (%s, %s, %s, %s)
    ON CONFLICT (title) DO NOTHING;
    """  # 중복된 제목(title)은 무시

    cur.executemany(INSERT_SQL, data)
    conn.commit()
    print(f"✅ {cur.rowcount}개의 레시피가 PostgreSQL에 저장되었습니다.")
    cur.close()
    conn.close()


# Selenium 크롤링 함수
def crawl_all_recipes():
    options = Options()
    options.add_argument("--headless")  # 브라우저 창 없이 실행
    options.add_argument("--disable-gpu")  # GPU 비활성화 (리소스 절약)
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    url = "https://www.10000recipe.com/recipe/list.html"
    driver.get(url)
    time.sleep(2)

    recipes = []
    page = 1

    while True:
        print(f"📖 페이지 {page} 크롤링 중...")

        try:
            # 모든 레시피 링크 미리 저장 (Stale Element 방지)
            recipe_elements = driver.find_elements(By.CLASS_NAME, "common_sp_link")
            recipe_links = [elem.get_attribute("href") for elem in recipe_elements if elem.get_attribute("href")]

            if not recipe_links:
                print("⚠️ 레시피 링크를 찾을 수 없습니다. 다음 페이지로 이동합니다.")
                break

            for link in recipe_links:
                try:
                    driver.get(link)
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CLASS_NAME, "view2_summary"))
                    )

                    title = driver.find_element(By.CLASS_NAME, "view2_summary").text
                    ingredients = driver.find_element(By.CLASS_NAME, "ready_ingre3").text
                    instructions = driver.find_element(By.CLASS_NAME, "view_step").text
                    image_url = driver.find_element(By.CSS_SELECTOR, ".centeredcrop img.img-responsive").get_attribute("src")

                    recipes.append((title, ingredients, instructions, image_url))
                    print(f"✅ {title} 크롤링 완료!")

                except (NoSuchElementException, TimeoutException) as e:
                    print(f"⚠️ 요소를 찾을 수 없음: {e}")
                except StaleElementReferenceException:
                    print("⚠️ Stale Element 발생, 재시도 중...")
                    driver.refresh()
                    time.sleep(3)
                finally:
                    driver.back()
                    time.sleep(2)

            # 다음 페이지 버튼 클릭
            try:
                next_button = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.LINK_TEXT, "다음"))
                )
                next_button.click()
                time.sleep(3)
                page += 1
            except TimeoutException:
                print("✅ 모든 페이지 크롤링 완료!")
                break

        except Exception as e:
            print(f"❌ 페이지 크롤링 중 오류 발생: {e}")
            break

    driver.quit()
    return recipes


# 실행 코드
if __name__ == "__main__":
    all_recipes = crawl_all_recipes()
    print(f"🔍 총 {len(all_recipes)}개의 레시피를 수집했습니다.")
    if all_recipes:
        save_to_postgresql(all_recipes)
    else:
        print("❌ 저장할 데이터가 없습니다.")
