class RandomAgent{
    constructor(){
    }
    randomIntFromInterval(min,max){
        return Math.floor(Math.random()*(max-min+1)+min);
    }
    getPlay(game) {
        let validMoves = game.getValidMoves();
        if (validMoves.length > 0 ){       // if we have   any     valid      moves
            let chosenIndex = this.randomIntFromInterval(0, validMoves.length - 1);
            return validMoves[chosenIndex]
        }
        else {
            return "p" // [] returns "p" as pass
        }
    }
}


exports.RandomAgent = RandomAgent;