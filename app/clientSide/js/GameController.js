let SelectState = Object.freeze({NOT_SELECTED: "NOT_SELECTED", SHOWING_LIBERTIES: "SHOWING_LIBERTIES", HIGHLIGHTING_SELECTED: "HIGHLIGHTING_SELECTED"});
let GameState = Object.freeze({NOT_GAME_STATE: "NOT_GAME_STATE", MAKING_MOVE: "MAKING_MOVE", WAITING_FOR_TURN: "WAITING_FOR_TURN",EVAL_PHASE:"EVAL_PHASE",GAME_ENDED:"GAME_ENDED"});

/**
 * Controller part of MVC on client side.
 * @memberof Client
 */
export class GameController{
    /**
     * Create a ThreeDGoController.
     * @param socket - sends ONLY 'gameMessage' with data
     * @param view - view part of MVC
     * @param model - model part of MVC, game object
     */
    constructor(socket,view,model){
        //this.gameState="notgameState";
        this.model=model;
        this.view=view;
        this.socket=socket;
        this.model.selectState = SelectState.NOT_SELECTED;
        this.model.gameState = GameState.NOT_GAME_STATE;
        this.lastSelectedStoneId=-1;
        this.myMouseListener =  event => {
            this.processInputFromUser(event);
        };
        document.addEventListener('mousedown',this.myMouseListener , false);
    }
    /**
     *  Processes input from user. <br>
     *  It is using FSM with states: SelectState and GameState <br>
     * @param input - data from 'mousedown' event
     */
    processInputFromUser(input){
        // 1. get coordinates of stone from view
        let idOfSelectedStone = this.view.coordsOfSelectedStone(input).id;

        // 2. is it a valid game movement?
        if (idOfSelectedStone===-1){
            console.log("user clicked on nothing");
            //this.model.selectState=SelectState.NOT_SELECTED;
            //this.view.updateStatusBar2("You clicked on nothing!");
            return;
        }

        // 2. know if it is occupied or free

        // 3. now use my state machines:

        // 4. first model.moveState machine
        switch (this.model.gameState){
            case  GameState.MAKING_MOVE:
                // 5a I want to be able to show liberties and highlight stone
                switch (this.model.selectState){
                    case SelectState.NOT_SELECTED:
                        // is occupied or free?
                        let isOccupied = this.model.isOccupied(idOfSelectedStone);
                        if (isOccupied){
                            // display liberties

                            this.view.showLiberties(idOfSelectedStone);
                            this.lastSelectedStoneId=idOfSelectedStone;
                            this.model.selectState=SelectState.SHOWING_LIBERTIES;
                            this.view.updateStatusBar();
                        }
                        else if (idOfSelectedStone==="p"){
                            let move = this.model.processInputFromView(idOfSelectedStone);
                            let  message = {
                                name: 'makeMove',
                                move : move
                            };
                            this.sendGameMessage(message);
                            this.view.cancelHighlighting(this.lastSelectedStoneId);
                            this.lastSelectedStoneId=-1;
                            this.model.selectState=SelectState.NOT_SELECTED;
                            this.model.gameState=GameState.WAITING_FOR_TURN;
                            this.view.updateStatusBar();
                            console.log("sending selected stone id to server")

                        }
                        else{
                            this.lastSelectedStoneId=idOfSelectedStone;
                            this.view.highlightSelectedStone(this.lastSelectedStoneId);
                            this.model.selectState=SelectState.HIGHLIGHTING_SELECTED;
                            this.view.updateStatusBar();
                        }
                        break;
                    case SelectState.HIGHLIGHTING_SELECTED:
                        if (idOfSelectedStone ===this.lastSelectedStoneId) {
                            let move = this.model.processInputFromView(idOfSelectedStone);
                            let  message = {
                                name: 'makeMove',
                                move : move
                            };
                            this.sendGameMessage(message);
                            this.view.cancelHighlighting(this.lastSelectedStoneId);
                            this.lastSelectedStoneId=-1;
                            this.model.selectState=SelectState.NOT_SELECTED;
                            this.model.gameState=GameState.WAITING_FOR_TURN;
                            this.view.updateStatusBar();
                            console.log("sending selected stone id to server")
                        }
                        else{
                            let isOccupied = this.model.isOccupied(idOfSelectedStone);
                            if (isOccupied){
                                this.view.cancelHighlighting(this.lastSelectedStoneId);
                                this.lastSelectedStoneId=-1;
                                this.view.showLiberties(idOfSelectedStone);
                                this.model.selectState=SelectState.SHOWING_LIBERTIES;
                                this.view.updateStatusBar();
                            }
                            else {
                                this.lastSelectedStoneId=idOfSelectedStone;
                                this.view.highlightSelectedStone(this.lastSelectedStoneId);
                                this.model.selectState=SelectState.HIGHLIGHTING_SELECTED;
                                this.view.updateStatusBar();
                            }
                        }
                        break;
                    case SelectState.SHOWING_LIBERTIES:
                        // if I click on the same stone => hide showing
                        // if I click on other occupied => still showing liberties but print for that stone
                        // if I click on free => highlight that stone
                        if (idOfSelectedStone ===this.lastSelectedStoneId) {
                            this.view.hideLiberties();
                            this.model.selectState=SelectState.NOT_SELECTED;
                            this.view.updateStatusBar();
                        }
                        else{
                            let isOccupied = this.model.isOccupied(idOfSelectedStone);
                            if (isOccupied){
                                this.view.hideLiberties();
                                this.view.showLiberties(idOfSelectedStone);
                                this.lastSelectedStoneId=idOfSelectedStone;
                                this.model.selectState=SelectState.SHOWING_LIBERTIES;
                                this.view.updateStatusBar();
                            }
                            else{
                                this.view.hideLiberties();
                                this.lastSelectedStoneId=idOfSelectedStone;
                                this.view.highlightSelectedStone(this.lastSelectedStoneId);
                                this.model.selectState=SelectState.HIGHLIGHTING_SELECTED;
                                this.view.updateStatusBar();
                            }
                        }
                        break;
                }
                break;
            case  GameState.WAITING_FOR_TURN:
                // 5b  I want to be able to show liberties but not select stones!
                switch (this.model.selectState){
                    case SelectState.NOT_SELECTED:
                        // is occupied or free?
                        let isOccupied = this.model.isOccupied(idOfSelectedStone);
                        if (isOccupied){
                            // display liberties:
                            this.view.showLiberties(idOfSelectedStone);
                            // go to other state:
                            this.model.selectState=SelectState.SHOWING_LIBERTIES;
                            this.view.updateStatusBar();
                        }
                        else{
                            //tell user he cant select because he is not on move
                            console.log("cant select");
                            this.view.updateStatusBar2("Not Your Move, You can't select this!");
                        }
                        break;

                    case SelectState.HIGHLIGHTING_SELECTED:
                        throw "SelectState.HIGHLIGHTING_SELECTED shouldnt occur!";
                        this.view.updateStatusBar();
                        break;

                    case SelectState.SHOWING_LIBERTIES:
                        if (idOfSelectedStone ===this.lastSelectedStoneId) {
                            this.view.hideLiberties();
                            this.model.selectState=SelectState.NOT_SELECTED;
                            this.view.updateStatusBar();
                        }
                        else{
                            let isOccupied = this.model.isOccupied(idOfSelectedStone);
                            if (isOccupied){
                                this.view.hideLiberties();
                                this.view.showLiberties(idOfSelectedStone);
                                this.lastSelectedStoneId=idOfSelectedStone;
                                this.model.selectState=SelectState.SHOWING_LIBERTIES;
                                this.view.updateStatusBar();
                            }
                            else{

                            }
                        }
                        break;
                }
                break;
            case  GameState.EVAL_PHASE:
                if (idOfSelectedStone ==="ack") {
                    //send ack to server
                    let  message = {
                        name: 'makeMove',
                        type: 'evalPhase',
                        move : idOfSelectedStone
                    };
                    this.sendGameMessage(message);

                    this.view.updateStatusBar();
                    console.log("sending selected stone id to server");
                    console.log("EVAL PHASE");


                }
                else if (idOfSelectedStone ==="cancel") {
                    // send cancel to server
                    let  message = {
                        name: 'makeMove',
                        type: 'evalPhase',
                        move : idOfSelectedStone
                    };
                    this.sendGameMessage(message);

                    this.view.updateStatusBar();
                    console.log("sending selected stone id to server");
                    console.log("EVAL PHASE");


                }
                else{ // it is normal move
                    let move = this.model.processInputFromView(idOfSelectedStone);
                    let  message = {
                        name: 'makeMove',
                        type: 'evalPhase',
                        move : move
                    };
                    this.sendGameMessage(message);
                    this.view.updateStatusBar();
                    console.log("sending selected stone id to server");
                    console.log("EVAL PHASE");
                }
                break;
            case  GameState.GAME_ENDED:
                console.log("GAME ENDED");
                break;
            case GameState.NOT_GAME_STATE:
                throw "MoveState.NOT_GAME_STATE";
                break;

        }
    }
    /**
     * Processes messages from Server. <br>
     * message has properties name and game
     * @param message
     */
    processMessageFromServer(message){
        let str="To: "+message.recipient+" move: "+message.name;
        console.log(str);
        let msgName= message.name;

        switch (msgName) {
            case 'gameHasStartedAndYouAreFirstPlayer':
                this.model.gameState = GameState.MAKING_MOVE;
                this.model.updateModel(message.game);
                this.view.initialize();
                this.view.updateView();
                break;
            case 'gameHasStartedAndYouAreSecondPlayer':
                this.model.gameState = GameState.WAITING_FOR_TURN;
                this.model.updateModel(message.game);
                this.view.initialize();
                this.view.updateView();
                break;
            case 'youAreOnMove':
                this.model.gameState = GameState.MAKING_MOVE;
                this.model.updateModel(message.game);
                this.view.updateView();
                break;
            case 'invalidMovePlayAgain':
                this.model.gameState = GameState.MAKING_MOVE;
                this.model.updateModel(message.game);
                this.view.updateView();
                break;
            case 'validMoveAndWaitForTurn':
                this.model.gameState = GameState.WAITING_FOR_TURN;
                this.model.updateModel(message.game);
                this.view.updateView();
                break;
            case 'evaluatePhase':
                this.model.gameState = GameState.EVAL_PHASE;
                this.model.updateModel(message.game);
                this.view.updateView();
                break;
            case 'gameHasEnded':
                let stats = message.stats;
                this.model.gameState=GameState.GAME_ENDED;
                this.view.displayGameEnded(stats);
                //window.alert("Player "+message.whoWon+ " won the game!");
                //console.log("Player "+message.whoWon+ " won the game!");
                break;

        }
    }
    /**
     * Emits event 'gameMessage' with a message using socket.
     * @param message
     */
    sendGameMessage(message){
        message.senderID = this.socket.id;  // we need to add this info, since game class doesnt have acess to networking
        this.socket.emit('gameMessage',message);
    }
}