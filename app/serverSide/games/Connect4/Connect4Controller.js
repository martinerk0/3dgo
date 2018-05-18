
const Connect4 = require('./Connect4');
//const GraphLoader = require('./ObjToGraph');


class Player{
    constructor(id){
        this.id=id;
    }
}

// messages from client => server 'makeMove'
// messages from server => client'gameHasStartedAndYouAreFirstPlayer','gameHasStartedAndYouAreSecondPlayer','youAreOnMove','invalidMovePlayAgain','validMoveAndWaitForTurn'

let GameState = Object.freeze({UNDEFINED:"UNDEFINED",PLAY: "PLAY",FINISH: "FINISH"});
class Connect4Controller{
    constructor(io,gameName,roomName,agent1ID,agent2ID,server) {
        this.io=io;
        this.roomName=roomName;
        this.gameState = GameState.UNDEFINED;
        this.model=null;
        this.agent1=null;
        this.agent2=null;
        this.server=null;
        this.model = new Connect4.Connect4(6,7);
        this.agent1 = new Player(agent1ID);
        this.agent2 =new Player(agent2ID);
        this.server=server;

        this.initializeGame(gameName);
    }
    initializeGame(gameName){
        let message1={
            name:'gameHasStartedAndYouAreFirstPlayer',
            game:this.model.serialize()
        };
        this.sendMessage(this.agent1.id,message1);

        let message2={
            name:'gameHasStartedAndYouAreSecondPlayer',
            game:this.model.serialize()
        };
        this.sendMessage(this.agent2.id,message2);
        this.gameState = GameState.PLAY;

    }
    endGame(winner){
        let runningGame={
            hostPlayer: this.agent1.id,
            joinPlayer: this.agent2.id
        };
        let data = JSON.stringify(runningGame);
        this.server.endThisRunningGame(data);
    }
    processMessage(message){

        let senderID=message.senderID;
        let moveStr= message.move;
        let move;

        switch(this.gameState){
            case GameState.PLAY: {
                //When game is in play state, players just send moves

                move = this.model.transformUserInputIntoMove(moveStr);       // parse message into format readable by game
                if (move !== false && this.model.canPlayAt(move)) {
                    this.model.play(move);
                    let gameEnded = this.model.isEnd();                     // we must check if this move ended the game
                    if (gameEnded==0){
                        this.sendMessages(senderID,'validMoveAndWaitForTurn','youAreOnMove');
                    }
                    else if(gameEnded==42){
                        console.log("Game is DRAW!");
                        this.gameState = GameState.FINISH;
                    }
                    else if(gameEnded==1){
                        console.log("Player number 1 WON!");
                        this.gameState = GameState.FINISH;
                    }
                    else if(gameEnded==2){
                        console.log("Player number 2 WON!");
                        this.gameState = GameState.FINISH;
                    }
                    else{
                        throw "Should not return anything else!"
                    }



                }
                else {
                    let response = {
                        name: 'invalidMovePlayAgain',
                        game: this.model.serialize()
                    };
                    this.sendMessage(senderID, response);
                    this.gameState = GameState.PLAY;
                }
            }
                break;
            case GameState.FINISH:
                // game ended, show end screen or anything
                // but game should be available in some format...

                throw "ServerState.FINISH";


                break;
            case GameState.UNDEFINED:
                throw "ThreeDGoController is in state ServerState.UNDEFINED";
                break;

        }
    }
    whoami(ID){
        if (ID===this.agent1.id){
            return 1;
        }
        else{
            return 2;
        }
    }
    sendMessages(senderID,firstRecipientMessage,secondRecipientMessage){
        let response1 = {
            name: firstRecipientMessage,
            game: this.model.serialize()
        };
        this.sendMessage(senderID, response1);
        let response2 = {
            name: secondRecipientMessage,
            game: this.model.serialize()
        };
        let otherPlayerId = this.getOtherPlayerID(senderID);
        this.sendMessage(otherPlayerId, response2);
    }
    sendMessage(recipient, message){
        this.io.sockets.connected[recipient].emit('gameMessage',message);
    }
    getOtherPlayerID(senderID){
        if  (senderID=== this.agent1.id){
            return this.agent2.id;
        }
        else{
            return this.agent1.id;
        }
    }
}


exports.Connect4Controller = Connect4Controller;

// Queue from code.stephenmorley.org
function Queue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};
