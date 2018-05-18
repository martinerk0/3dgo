let GameState = Object.freeze({NOT_GAME_STATE: "NOT_GAME_STATE", MAKING_MOVE: "MAKING_MOVE", WAITING_FOR_TURN: "WAITING_FOR_TURN",EVAL_PHASE:"EVAL_PHASE",GAME_ENDED:"GAME_ENDED"});


/**
 *Communicates with AI
 * It differs from Client Game controller by not having SelectState
 */
class GameController_AI{


    constructor(socket,agent,model){
        this.agent=agent;
        this.model=model;
        this.socket=socket;
        this.model.gameState = GameState.NOT_GAME_STATE;
    }

    /**
     * makes Move based on gameState
     */
    makeMove(){
        let message;
        switch (this.model.gameState) {
            case  GameState.MAKING_MOVE:
                let agentMove = this.agent.getPlay(this.model);
                message = {
                    name: 'makeMove',
                    move: agentMove.toString()
                };
                this.sendGameMessage(message);
                break;
            case  GameState.WAITING_FOR_TURN:
                break;
            case  GameState.EVAL_PHASE:
                message = {
                    name: 'makeMove',
                    type: 'evalPhase',
                    move : "ack"
                };
                this.sendGameMessage(message);
                break;
            case  GameState.GAME_ENDED:
                break;
            case GameState.NOT_GAME_STATE:
                break;
        }


    }
    processInputFromUser(input){
        //console.log('received data:', util.inspect(text));
        if (this.gameState==="makeMove"){
            // send chosen move to the server
            let  message = {
                name: 'makeMove',
                move: input.toString()
            };
            return message;
        }
        else if(this.gameState==="waitForTurn" ){
            console.log("not your turn!");
            return "nothing";
        }
        else if(this.gameState==="notgameState" ){
            console.log(" not in any gameState!");
            return "nothing";
        }
        else {
            throw "ERROR"
        }
    }
    /**
     * Processes messages from Server. <br>
     * message has properties name and game
     * @param message
     */
    processMessageFromServer(message){
        let msgName= message.name;
        let agentMove="";
        let inputFromClient="";

        switch (msgName) {
            case 'gameHasStartedAndYouAreFirstPlayer':
                this.model.gameState = GameState.MAKING_MOVE;
                this.model.updateModel(message.game);
                this.makeMove();
                break;
            case 'gameHasStartedAndYouAreSecondPlayer':
                this.model.gameState = GameState.WAITING_FOR_TURN;
                this.model.updateModel(message.game);
                break;
            case 'youAreOnMove':
                this.model.gameState = GameState.MAKING_MOVE;
                this.model.updateModel(message.game);
                this.makeMove();
                break;
            case 'invalidMovePlayAgain':
                //console.log("Invalid move! Play again!");
                throw "Error: AI cannot play invalid moves->something is wrong";
                this.model.gameState = GameState.MAKING_MOVE;
                this.model.updateModel(message.game);
                return "nothing";
                break;
            case 'validMoveAndWaitForTurn':
                this.model.gameState = GameState.WAITING_FOR_TURN;
                this.model.updateModel(message.game);
                break;
            case 'evaluatePhase':
                this.model.gameState = GameState.EVAL_PHASE;
                this.model.updateModel(message.game);
                this.makeMove();
                break;
            case 'gameHasEnded':
                this.model.gameState=GameState.GAME_ENDED;
                this.model.updateModel(message.game);
                console.log("Player "+message.whoWon+ " won the game!");

                let now = new Date().toISOString().replace('T', ' ').substr(0, 19);
                console.log("AI: "+this.socket.id+" EXITING : "+now);

                process.exit(0);

                break;

        }
    }
    /**
     * Emits event 'gameMessage' with a message using socket.
     * @param message
     */
    sendGameMessage(message){
        message.senderID = this.socket.id;  // we need to add this info, since game class does not have acess to networking
        this.socket.emit('gameMessage',message);
    }

}
exports.GameController_AI = GameController_AI;