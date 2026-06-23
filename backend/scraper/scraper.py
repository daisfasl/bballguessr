import requests
from bs4 import BeautifulSoup, Comment
import pandas as pd
import time
import re

def scrape_site(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers = headers)

        soup = BeautifulSoup(response.content, 'html.parser')
        table = soup.find('table', id = 'per_game_stats')

        # first return value, player stats in dict form
        stats_dict = get_player_stats(table)
        
        # second return value, career length
        career_length = get_career_length(table)

        # third return value, image_url -- if not found, img = None
        img = get_img_url(soup)

    except Exception as e:
        print(f"Unable to scrape url: {url}")
        print(f"Error: {e}")
        return
    return (stats_dict, career_length, img)

def get_player_stats(table):
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

def get_career_length(table):
    tfoot = table.find('tfoot') 
    extracted_text = tfoot.find('th').getText()
    career_length = re.search(r'\d+', extracted_text)
    if not career_length:
        raise ValueError("Unable to find career length")
    else:
        career_length = int(career_length.group())
        return career_length

def get_img_url(soup):
    try:
        div = soup.find('div', class_ = "media-item")
        img = div.find('img')
        img.get('src')
    except Exception as e:
        img = None
url = 'https://www.basketball-reference.com/players/c/chambwi01.html'
url2 = 'https://www.basketball-reference.com/players/a/anderbo01.html'
url3 = 'https://www.basketball-reference.com/players/c/curryde01.html'
print(scrape_site(url2))
