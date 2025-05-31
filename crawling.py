import requests
from bs4 import BeautifulSoup

def get_recipes_by_ingredient(ingredient):
    base_url = 'http://www.10000recipe.com/recipe/list.html'
    params = {'q': ingredient}
    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        recipes = []
        for recipe in soup.select('.common_sp_list_li'):
            title = recipe.select_one('.common_sp_caption_tit').get_text(strip=True)
            link = 'http://www.10000recipe.com' + recipe.select_one('a')['href']
            recipes.append({'title': title, 'link': link})
        return recipes
    else:
        print(f"Failed to retrieve recipes for {ingredient}")
        return []

# 사용 예시
ingredient = '김치, 돼지고기'
recipes = get_recipes_by_ingredient(ingredient)
for recipe in recipes:
    print(f"레시피 제목: {recipe['title']}, 링크: {recipe['link']}")
