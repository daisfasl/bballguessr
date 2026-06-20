import requests
from bs4 import BeautifulSoup, Comment
import pandas as pd
import time

def scrape_site(url):
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers = headers)

    soup = BeautifulSoup(response.content, 'html.parser')
    
    table = soup.find('table', id = 'per_game_stats')

    thead = table.find('thead') # type: ignore
    headers = [th.getText() for th in thead.find_all('th') if th.getText() != ''] # type: ignore
    
    tbody = table.find('tbody') # type: ignore
    rows = tbody.find_all('tr') # type: ignore
    
    player_data = []
    for row in rows:
        year = row.find('th').getText() # type: ignore
        cols = row.find_all('td')
        row_data = [year] + [col.getText() for col in cols]
        player_data.append(row_data)
    
    df = pd.DataFrame(player_data, columns=headers)

    return df

        
        

url = 'https://www.basketball-reference.com/players/c/chambwi01.html'
df = scrape_site(url)
print(df.tail().to_dict())
