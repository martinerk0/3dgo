/**
 * Namespace for AI Client side
 * @namespace AI
 */


const ThreeDGo = require('../games/ThreeDGo/ThreeDGoServer');
const Connect4 = require('../games/Connect4/Connect4');
const AI = require('./ThreeDGo_AI/RandomAgent_ThreeDGo');
const MCTS =  require('./ThreeDGo_AI/MCTSAgent_ThreeDGo');
const MCTS_Connect4 =  require('./Connect4_AI/MCTSAgent_Connect4');
const GC_ThreeDGo = require('./ThreeDGo_AI/GameController_ThreeDGo');
const GC_Connect4 = require('./Connect4_AI/GameController_Connect4');

/**
 * input: [ID of game to join],[type of game to join], <[Other parameters],..>
 * Client AI is a node process that either creates random player or other agent in javascript
 *  at start it gets ID of game to join and it emits 'joinGame' event and immediately joins!
 *  @memberof AI
 */
class ClientController_AI{
    constructor(){


        let io = require('socket.io-client');
        let serverUrl = 'http://localhost:3000';
        let socket = io.connect(serverUrl);

        this.idToJoin = process.argv[2];
        this.gameNameConcatenated = process.argv[3];
        this.agentName= process.argv[4];
        this.debugArg=process.argv[5];
        this.model=null;
        this.GameController=null;
        this.state = "notPlaying";

        if(this.debugArg==="debug"){
            this.debug=true;
        }


        socket.on('connect', data =>{
            console.log("connected!");
            let now = new Date().toISOString().replace('T', ' ').substr(0, 19);
            console.log("AI: "+socket.id+" connected to server: "+now);
            if(this.debug===true) {

                let message = {
                    id:socket.id,
                    game:this.gameNameConcatenated,
                    opponent:this.agentName
                };
                socket.emit('createNewGame', message);
            }
            else{
                socket.emit('joinGame', this.idToJoin );
            }

        });

        socket.on('playGame', data => {

            this.state = "playingGame";
            let gameNameParts=this.gameNameConcatenated.split(' ');
            let gameName=gameNameParts[0];

            if(gameName==="connect4") {
                this.model= new Connect4.Connect4(6,7);

                //------------  What AI we will use? ------------
                if(this.agentName==="random"){
                    this.agent=new AI.RandomAgent();
                }
                else if(this.agentName==="mcts_c4") {
                    let num_iter = 1000;
                    if(this.debug===true){
                        this.agent=new MCTS_Connect4.MCTS_Connect4_Agent(1,num_iter);
                    }
                    else{
                        this.agent=new MCTS_Connect4.MCTS_Connect4_Agent(2,num_iter);
                    }
                }
                else{
                    throw "Agent not available!";
                }
                this.game= new GC_Connect4.GameController_AI(socket,this.agent,this.model);
            }
            else if(gameName==="3dgo") {
                this.model = new ThreeDGo.ThreeDGo(null);
                //------------  What AI we will use? ------------
                if(this.agentName==="random"){
                    this.agent=new AI.RandomAgent();
                }
                else if(this.agentName==="mcts") {
                    let num_iter = 1000;

                    if(this.debug===true){
                        this.agent=new MCTS.MCTSAgent(1,num_iter);
                    }
                    else{
                        this.agent=new MCTS.MCTSAgent(2,num_iter);
                    }

                }
                else{
                    throw "Agent not available!";
                }
                this.game= new GC_ThreeDGo .GameController_AI(socket,this.agent,this.model);
            }
            else{
                throw "game not available!";
            }

            let now = new Date().toISOString().replace('T', ' ').substr(0, 19);
            console.log("AI: "+socket.id+" PLAY GAME: "+now);
        });

        socket.on('updateList', data => {
            let now = new Date().toISOString().replace('T', ' ').substr(0, 19);
            console.log("AI: "+socket.id+" UPDATE LIST: "+now);
        });

        socket.on('gameMessage',message => {
            if(this.state==="playingGame"){
                this.game.processMessageFromServer(message);
                //this.model.print();
            }
            else{
                alert("ERROR");
                console.log(this.state);
                console.log(message);
            }
        });

        socket.on('gameHasFinished', data => {
            process.exit();
        });

        socket.on('disconnect', data =>{
            process.exit();
        });
    }
}


let client= new ClientController_AI();