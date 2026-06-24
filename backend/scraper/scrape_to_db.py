from backend.database import get_connection, save_player
import scraper as scraper

# scrape groups of players to db
def scrape_db_runner(letter: str):
    pass
    
# scrape single player to db
def player_to_db(url) -> bool:
    player = scraper.scrape_site(url)
    if not player:
        return False
    try:
        player = save_player(*player)
        return True
    except Exception as e:
        print(f"Scraping {player[4]} failed, error: {e}")
        return False

if __name__ == "__main__":
    url = "https://www.basketball-reference.com/players/c/curryst01.html"
    player_to_db(url)
