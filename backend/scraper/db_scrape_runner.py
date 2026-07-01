from backend.database import save_player
import backend.scraper.scraper as scraper
import time 
import requests
from bs4 import BeautifulSoup

# scrape groups of char-sorted group of players to db
def scrape_runner(chars: list[str]):
    for char in chars:
        char_url = f"https://www.basketball-reference.com/players/{char}/"
        try: # get all rows
            headers = {"User-Agent": "Mozilla/5.0"}
            response = requests.get(char_url, headers=headers)
            time.sleep(3.2) # rate-limit prevention

            soup = BeautifulSoup(response.content, 'html.parser')
            table = soup.find('table', id= 'players')
            tbody = table.find('tbody') # type: ignore
            rows = tbody.find_all('tr') # type: ignore
            if not rows:
                raise
        except Exception as e:
            print(f"Unable to scrape {char_url}")
            print(f"Error: {e}")
            continue
        for row in rows:
            if not bool(row.find('td')): # filter out non-data rows
                continue 
            else:
                name_header = row.find('th')
                if not name_header:
                    continue
                player_name = name_header.get('data-append-csv') 
                player_url = f"{char_url}{player_name}.html"

                # save to db!!
                player_to_db(player_url)
                time.sleep(3.2) # rate-limit prevention

    
# scrape single player to db
def player_to_db(url) -> bool:
    player = scraper.scrape_site(url)
    if not player:
        return False
    try:
        player = save_player(*player)
        print(f"Success fully scraped {player}:")
        return True
    except Exception as e:
        print(f"Scraping {player[4]} failed")
        return False

arr = ["https://www.basketball-reference.com/players/a/abdulka01.html",
       "https://www.basketball-reference.com/players/a/allenra02.html",
       "https://www.basketball-reference.com/players/a/anderch01.html",
       "https://www.basketball-reference.com/players/a/anderke01.html",
       "https://www.basketball-reference.com/players/a/anthoca01.html",
       "https://www.basketball-reference.com/players/a/arizatr01.html",
       "https://www.basketball-reference.com/players/a/augusdj01.html",
       "https://www.basketball-reference.com/players/p/pendeje02.html",
       ]
letters = ['b','c','d','e','f','g','h','i','j','k','l','m','n','o','p',
           'q','r','s','t','u','v','w','x','y','z']
if __name__ == "__main__":
    scrape_runner(letters)
