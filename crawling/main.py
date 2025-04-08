import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 환경 변수 출력 확인
print("Supabase URL:", os.getenv("SUPABASE_URL"))
print("Supabase Key:", os.getenv("SUPABASE_KEY"))
 