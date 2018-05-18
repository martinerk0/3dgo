// SERVER SIDE!

//import  {Message}   from './Message.js';
const ThreeDGo = require('./ThreeDGoServer');
const GraphLoader = require('./ObjToGraph');


class Player{
    constructor(id){
        this.id=id;
    }
}

// messages from client => server 'makeMove'
// messages from server => client'gameHasStartedAndYouAreFirstPlayer','gameHasStartedAndYouAreSecondPlayer','youAreOnMove','invalidMovePlayAgain','validMoveAndWaitForTurn'

let GameState = Object.freeze({UNDEFINED:"UNDEFINED",PLAY: "PLAY", PASS1: "PASS1", EVAL: "EVAL",ACK1: "ACK1",FINISH: "FINISH"});
class ThreeDGoController{
    constructor(io,gameName,roomName,agent1ID,agent2ID,server) {
        this.io=io;
        this.roomName=roomName;
        this.gameState = GameState.UNDEFINED;
        this.model=null;
        this.agent1=null;
        this.agent2=null;
        this.server=null;


        let indexOfBoard = server.listOfBoardNames.indexOf(gameName);
        let graph =  server.listOfBoards[indexOfBoard].createCopy();
        this.model = new ThreeDGo.ThreeDGo(graph);
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
                    let isPassed = this.model.didPlayerPass();

                    if (isPassed === true) {                     // did player pass?
                        this.gameState = GameState.PASS1;
                        this.model.whichPlayerPassedFirst=this.whoami(senderID);
                    }
                    else {
                        this.gameState = GameState.PLAY;
                    }
                    this.sendMessages(senderID,'validMoveAndWaitForTurn','youAreOnMove');
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
            case GameState.PASS1:
                move = this.model.transformUserInputIntoMove(moveStr);       // parse message into format readable by game
                if (move !==false && this.model.canPlayAt(move)){
                    this.model.play(move);
                    let isEnd = this.model.isEnd();
                    if(isEnd===1){
                        this.gameState=GameState.EVAL;
                        this.model.initializeEvalPhase();
                        this.sendMessages(senderID,'evaluatePhase','evaluatePhase');
                    }
                    else{
                        this.model.whichPlayerPassedFirst=null;
                        this.sendMessages(senderID,'validMoveAndWaitForTurn','youAreOnMove');
                        this.gameState=GameState.PLAY;
                    }
                }
                else{
                    let response={
                        name:'invalidMovePlayAgain',
                        game:this.model.serialize()
                    };
                    this.sendMessage(senderID,response);
                    this.gameState=GameState.PLAY;
                }
                break;
            case GameState.EVAL:

                if (message.move==="cancel"){
                    let who_is_on_move =  this.model.whichPlayerPassedFirst;
                    let whoami=this.whoami(senderID);
                    this.model.onMove=this.model.whichPlayerPassedFirst;
                    let response1,response2;
                    if(who_is_on_move===whoami){             // if first player passed first, then he should play first
                        if(whoami===1){
                            response1={
                                name:'youAreOnMove',
                                game:this.model.serialize()
                            };
                            response2={
                                name:'validMoveAndWaitForTurn',
                                game:this.model.serialize()
                            };
                        }
                        else{
                            response1={
                                name:'validMoveAndWaitForTurn',
                                game:this.model.serialize()
                            };
                            response2={
                                name:'youAreOnMove',
                                game:this.model.serialize()
                            };
                        }

                    }
                    else {                  // if second player passed first, then he should play first
                        if(whoami===1){
                            response1={
                                name:'validMoveAndWaitForTurn',
                                game:this.model.serialize()
                            };
                            response2={
                                name:'youAreOnMove',
                                game:this.model.serialize()
                            };
                        }
                        else{
                            response1={
                                name:'validMoveAndWaitForTurn',
                                game:this.model.serialize()
                            };
                            response2={
                                name:'youAreOnMove',
                                game:this.model.serialize()
                            };
                        }

                    }

                    this.sendMessage(senderID,response1);
                    let otherPlayerId=this.getOtherPlayerID(senderID);
                    this.sendMessage(otherPlayerId,response2);
                    this.gameState=GameState.PLAY;
                }
                else if(message.move==="ack"){
                    this.gameState=GameState.ACK1;
                    if(senderID===this.agent1.id){
                        this.model.firstPlayerAck=true;
                    }
                    else{
                        this.model.secondPlayerAck=true;
                    }
                    this.sendMessages(senderID,'evaluatePhase','evaluatePhase');
                }
                else{
                    if (message.type!=="evalPhase"){
                        throw "Player should be in eval phase"
                    }
                    //just relay info between players
                    // process move
                    move = this.model.transformUserInputIntoMove(moveStr);
                    let color = this.whoami(senderID);
                    this.model.evalPut(move,color) ;
                    this.sendMessages(senderID,'evaluatePhase','evaluatePhase');
                }
                break;
            case GameState.ACK1:
                if (message.move==="ack"){
                    //send info that this game finished!
                    this.gameState=GameState.FINISH;
                    // game has finished you need to display how much score which player has!
                    // just simply number of markers is player's score
                    let stats = this.model.computeStats();
                    let response1 = {
                        name: 'gameHasEnded',
                        game: this.model.serialize(),
                        stats:stats
                    };
                    this.sendMessage(senderID, response1);
                    let response2 = {
                        name: 'gameHasEnded',
                        game: this.model.serialize(),
                        stats: stats
                    };
                    let otherPlayerId = this.getOtherPlayerID(senderID);
                    this.sendMessage(otherPlayerId, response2);


                }
                else if (message.move==="cancel"){
                    let who_is_on_move =  this.model.whichPlayerPassedFirst;
                    let whoami=this.whoami(senderID);
                    this.model.onMove=this.model.whichPlayerPassedFirst;
                    let response1,response2;
                    if(who_is_on_move===whoami){             // if first player passed first, then he should play first
                        if(whoami===1){
                            response1={
                                name:'youAreOnMove',
                                game:this.model.serialize()
                            };
                            response2={
                                name:'validMoveAndWaitForTurn',
                                game:this.model.serialize()
                            };
                        }
                        else{
                            response1={
                                name:'validMoveAndWaitForTurn',
                                game:this.model.serialize()
                            };
                            response2={
                                name:'youAreOnMove',
                                game:this.model.serialize()
                            };
                        }

                    }
                    else {                  // if second player passed first, then he should play first
                        if(whoami===1){
                            response1={
                                name:'validMoveAndWaitForTurn',
                                game:this.model.serialize()
                            };
                            response2={
                                name:'youAreOnMove',
                                game:this.model.serialize()
                            };
                        }
                        else{
                            response1={
                                name:'validMoveAndWaitForTurn',
                                game:this.model.serialize()
                            };
                            response2={
                                name:'youAreOnMove',
                                game:this.model.serialize()
                            };
                        }

                    }

                    this.sendMessage(senderID,response1);
                    let otherPlayerId=this.getOtherPlayerID(senderID);
                    this.sendMessage(otherPlayerId,response2);
                    this.gameState=GameState.PLAY;

                }
                else{
                    this.gameState=GameState.EVAL;
                    if (message.type!=="evalPhase"){
                        throw "Player should be in eval phase"
                    }
                    //just relay info between players
                    // process move
                    move = this.model.transformUserInputIntoMove(moveStr);
                    let color = this.whoami(senderID);
                    this.model.evalPut(move,color) ;
                    this.sendMessages(senderID,'evaluatePhase','evaluatePhase');
                }

                break;
            case GameState.FINISH:
                // game ended, show end screen or anything
                console.log("game: "+this.roomName+" has finished!");



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


exports.ThreeDGoController = ThreeDGoController;

// Queue from code.stephenmorley.org
function Queue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};
