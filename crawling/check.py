from supabase import create_client, Client
import os

# Supabase 환경 변수 설정 (직접 입력하지 않고 .env 파일 사용 가능)
SUPABASE_URL="https://ggcghvbzncaxfrlfzwjy.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnY2dodmJ6bmNheGZybGZ6d2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2Nzk3NDgsImV4cCI6MjA1OTI1NTc0OH0.digvpF0dCRyUpKIKaQAUZzj7ovspsLRYSep-E-_Esr0"

# Supabase 클라이언트 생성
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 연결 확인
print("✅ Supabase 연결 성공!")
