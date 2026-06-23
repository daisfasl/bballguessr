import requests
from bs4 import BeautifulSoup, Comment
import pandas as pd
import time
import re

def scrape_site(url) -> tuple[dict, int, str | None, int, str, str] | None:
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers = headers)

        soup = BeautifulSoup(response.content, 'html.parser')
        table = soup.find('table', id = 'per_game_stats')

        # first return value, player stats in dict form
        stats_dict: dict = get_player_stats(table)
        
        # second return value, career length
        career_length: int = get_career_length(table)

        # third return value, image_url -- if not found, img = None
        img: str | None = get_img_url(soup)

        # fourth return value, first year player played in the NBA, set to second part of season
        # ex: if season is 1959-60, we'll set first_year_played = 1960
        year_range = stats_dict.get('Season')[0] # type: ignore
        start_year, end_year = year_range.split('-')
        century_prefix = start_year[:2]
        first_year_played = int(century_prefix + end_year)

        # fifth return value, player name
        if not img:
            player_name: str = soup.find('div', class_ = "nothumb").h1.span.getText() # type: ignore
        else:
            meta_div = soup.find('div', id = "meta")
            player_name: str = meta_div.find('div', class_=None, id=None).h1.span.getText() # type: ignore

        # sixth return value, bball_ref_id
        bball_ref_id = url.split('/')[-1]
        bball_ref_id: str = bball_ref_id.split('.')[0]

        
    except Exception as e:
        print(f"Unable to scrape url: {url}")
        print(f"Error: {e}")
        return
    return (stats_dict, career_length, img, first_year_played, player_name, bball_ref_id)

def get_player_stats(table) -> dict:
    thead = table.find('thead')
    headers = [th.getText() for th in thead.find_all('th') if th.getText() != ''] # type: ignore
    
    tbody = table.find('tbody') 
    rows = tbody.find_all('tr') 
    
    player_data = []
    for row in rows:
        year = row.find('th').getText() # type: ignore
        cols = row.find_all('td')
        row_data = [year] + [col.getText() for col in cols]
        player_data.append(row_data)
    
    df = pd.DataFrame(player_data, columns=headers)
    stats_dict = df.to_dict()

    return stats_dict

def get_career_length(table) -> int:
    tfoot = table.find('tfoot') 
    extracted_text = tfoot.find('th').getText()
    career_length = re.search(r'\d+', extracted_text)
    if not career_length:
        raise ValueError("Unable to find career length")
    else:
        career_length = int(career_length.group())
        return career_length

def get_img_url(soup) -> str | None:
    try:
        div = soup.find('div', class_ = "media-item")
        img = div.find('img')['src']
        return img
    except Exception:
        return
url = 'https://www.basketball-reference.com/players/c/chambwi01.html'
url2 = 'https://www.basketball-reference.com/players/a/anderbo01.html'

url3 = 'https://www.basketball-reference.com/players/c/curryde01.html'

if __name__ == '__main__':
    print(scrape_site(url2)[5])
