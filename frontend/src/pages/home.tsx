import {useState} from 'react'
import {startGame} from '../api.ts'

export function Home() {
    return (
        <div className="Home-page">
            <StartGameButton/>     
        </div>
    )
}



function StartGameButton() {
    const [game, setGame] = useState(false)
    const [gameID, setGameID] = useState("")
    const handleClick = async () => {
        const state = await startGame()
        setGameID(state)
        if (gameID !== "") {
            setGame(true)
        } else {
            setGame(false)
        }
    };
    return (
        <div>
            <p> Game ID: {gameID} </p>
            <p> {game ? "Game has started" : "Game has not started"} </p>
            <button onClick= {handleClick}> 
            goob
            </button>
        </div>
    );
}
