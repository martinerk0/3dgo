/**
 * Namespace for JSDoc Server side
 * @namespace Server
 */

/**
 * This class encapsulates running game.
 */
class RunningGame {
    constructor(hostPlayer, joinPlayer,game) {
        this.hostPlayer = hostPlayer;
        this.joinPlayer = joinPlayer;
        this.game = game;
    }
}

/**
 * This class encapsulates running game.
 */
class AvailableGame {
    constructor(hostName, number,game,opponent) {
        this.hostName = hostName;
        this.number = number;
        this.game=game;
        this.opponent=opponent;
    }
}

/**
 * This is the class that encapsulates server.            <br>
 * It manages incoming connections from clients.          <br>
 * It is using socket.io library, and express middleware. <br>
 * @memberof Server
 */
class Server
{
    constructor(input_portNum){
        let portnNum =parseInt(input_portNum);
        var express = require('express');
        var app = express();
        var http = require('http').Server(app);
        this.io = require('socket.io')(http,{'pingInterval': 2000, 'pingTimeout': 600000});
        var path = require('path');
        let Controller = require('./Controller');


        this.listOfConnectedClients = [];
        let listOfRooms = [];

        this.listOfRunningGames = [];
        this.listOfAvailableGames = [];
        this.listOfRunningAgentProcesses=[];

        //  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        [this.listOfBoards,this.listOfBoardNames] =  this.importBoards("./serverSide/boards/");


        let runningGameCounter = 1;
        let availableGameCounter = 1;
        let gameListRoom = 'gameRoom';

        app.use(express.static(path.join(__dirname, 'clientSide')));
        app.use(express.static(path.join(__dirname, 'clientSide/socket.io-client')));
        app.use(express.static('node_modules'));

        app.get('/', function (req, res) {
            res.sendFile(__dirname + '/clientSide/index.html');
        });

        this.io.on('connection', socket => {

            let name = socket.id;                        // this is the id of socket
            this.listOfConnectedClients.push(socket);          // add this client to list
            socket.join(gameListRoom);                   // join default room

            let serializedList2 = JSON.stringify(this.listOfAvailableGames);        // send newly connected client all available games!
            //let dataToSend = {listOfGames:this.listOfAvailableGames,listOfBoards:this.listOfBoards};
            let serializedListOfBoardNames=  JSON.stringify(this.listOfBoardNames);
            this.io.in(socket.id).emit('listOfBoards',serializedListOfBoardNames);
            this.io.in(socket.id).emit('updateList', serializedList2);

            console.log("User " + String(name) + " has connected.");

            socket.on('createNewGame', data => {

                let { id, game,opponent} = data;
                if(opponent==="human"){
                    console.log(id + " wants to create new game!");                   // it should print id of sender
                    let newGame = new AvailableGame(id, availableGameCounter,game,opponent);
                    this.listOfAvailableGames.push(newGame);

                    let serializedList = JSON.stringify(this.listOfAvailableGames);
                    this.io.emit('updateList', serializedList);             // broadcast it to every client
                    availableGameCounter = availableGameCounter + 1;
                }
                else {
                    console.log(id + " wants to create new game!");                   // it should print id of sender
                    let newGame = new AvailableGame(id, availableGameCounter,game,opponent);
                    this.listOfAvailableGames.push(newGame);
                    availableGameCounter = availableGameCounter + 1;


                    //let client_ai_process =  require('child_process').fork('./serverSide/artificial_intelligence/ClientController_AI.js',[id,game,opponent], {execArgv: ['--inspect-brk=5959']},{stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]}); // pusti pythoni kod
                    //let client_ai_process =  require('child_process').fork('./serverSide/artificial_intelligence/ClientController_AI.js',[id,game,opponent], {execArgv: ['--inspect-brk=5959']}); // pusti pythoni kod for DEGUD
                    let client_ai_process =  require('child_process').fork('./serverSide/artificial_intelligence/ClientController_AI.js',[id,game,opponent]); // pusti pythoni kod

                    this.listOfRunningAgentProcesses.push(client_ai_process);
                }
            });

            socket.on('cancelNewGame', data =>{
                //socket.broadcast.emit('message', data );
                let indexToDelete =this.listOfAvailableGames.findIndex(item => item.hostName === name);        // ES6 , delete user if he has created game
                if (indexToDelete > -1) {
                   this.listOfAvailableGames.splice(indexToDelete, 1);                              // remove it
                }
                else {
                    console.error(" socket.on('cancelNewGame', function(data){ error ")
                }
                let serializedList = JSON.stringify(this.listOfAvailableGames);
                this.io.emit('updateList', serializedList);             // broadcast it to every client
                console.log(name + " : " + data);
            });

            socket.on('finishedGame', game => {
                this.endThisRunningGame(game);
            });

            socket.on('joinGame', data => {
                // data = is id of game I want to join in string format
                console.log(name + " wants to play with: " + data);

                // 1. remove available game from available games
                let indexToDelete =this.listOfAvailableGames.findIndex(item => item.hostName === data);        // ES6 , delete user if he has created game

                if (indexToDelete === -1) {
                    console.error(" socket.on('cancelNewGame', function(data){ error ")
                }
                let currGameName= this.listOfAvailableGames[indexToDelete].game;
                this.listOfAvailableGames.splice(indexToDelete, 1);                              // remove it


                //2.  I need to send client which two players are playing the game and additional info: what game etc
                // for now its connect4
                let hostPlayer = data;
                let joinPlayer = name;
                let message = {
                    hostPlayer: hostPlayer,
                    joinPlayer: joinPlayer,
                    gameName:currGameName
                };
                let serializedGame = JSON.stringify(message);

                // I need to put these two sockets into the same room and delete them from gameList room
                // get two sockets from list of connected games
                let hostSocket = this.listOfConnectedClients.find(item => item.id === data);
                let joinSocket = this.listOfConnectedClients.find(item => item.id === name);

                // leave default room
                hostSocket.leave('gameRoom');
                joinSocket.leave('gameRoom');

                // join new room
                hostSocket.join(hostSocket.id);
                joinSocket.join(hostSocket.id);

                // add new room to the room list
                listOfRooms.push(hostSocket.id);

                // emit message tot this room => play game
                this.io.in(hostSocket.id).emit('playGame', serializedGame);

                // serialize list of available games
                let serializedList = JSON.stringify(this.listOfAvailableGames);

                // emit message to the default room => update list of available games
                this.io.in('gameRoom').emit('updateList', serializedList);



                //3. create new game instance with it's controller and put it into list of running games
                let game = new Controller.createController(this.io,currGameName,"defaultRoom",hostPlayer,joinPlayer,this);
                let newRunningGame = new RunningGame(data, name, game);  // data= host player, name= player who clicked join
                this.listOfRunningGames.push(newRunningGame);
                console.log("game initialized!");

            });

            socket.on('gameMessage', data => {
                // send message to game
                // I need to know which player is on the move => hold socket.io of that player
                console.log(data);
                //I want to resend this message to sender's room

                let currentGame = this.listOfRunningGames.find(item => item.hostPlayer === socket.id || item.joinPlayer === socket.id);
                currentGame.game.processMessage(data);

            });

            socket.on('disconnect', () => {

                let indexToDelete =this.listOfAvailableGames.findIndex(item => item.hostName === name);        // ES6 , delete user if he has created game
                if (indexToDelete > -1) {
                   this.listOfAvailableGames.splice(indexToDelete, 1);                              // remove it
                }
                else {
                    //console.error(" socket.on('disconnect') error, ID wasnt found in listOfAvailableGames! ")
                }

                // notify all other users that his game has been deleted
                // thus send new data!
                let serializedList = JSON.stringify(this.listOfAvailableGames);

                socket.broadcast.emit('userDisconnected', serializedList);

                console.log('user disconnected: '+socket.id);
            });

        });

        http.listen(portnNum, () => {
            console.log('listening on *:'+input_portNum);
        });

    }
    /**
     *  @param {RunningGame} data -  RunningGame that you want to end
     * @description this function is triggered by: <br>
     *     1. client clicking button "Finish game" <br>
     *     2. server game end condition            <br>
     */
    endThisRunningGame(data) {


        // data is instance of  RunningGame
        let finishedGame = JSON.parse(data);

        // delete this game from list of running games
        let indexToDelete = this.listOfRunningGames.findIndex(item => item.hostPlayer === finishedGame.hostPlayer);    // finds the game by host
        if (indexToDelete > -1) {
            this.listOfRunningGames.splice(indexToDelete, 1);                              // remove it
        } else {
            console.error("  finished game error - didnt delete an game! ")
        }
        // these two ppl are in the rooms specified by host.id
        let currRoomID = finishedGame.hostPlayer;

        // I want to send 'gameHasFinished' message to this particular room
        let serializedList = JSON.stringify(this.listOfAvailableGames);
        this.io.in(currRoomID).emit('gameHasFinished', serializedList);

        // get two sockets from list of connected games
        let hostSocket = this.listOfConnectedClients.find(item => item.id === finishedGame.hostPlayer);
        let joinSocket = this.listOfConnectedClients.find(item => item.id === finishedGame.joinPlayer);


        // Now I want them to  leave  host.socket.id room
        hostSocket.leave(currRoomID);
        joinSocket.leave(currRoomID);

        // And join 'gameRoom'
        hostSocket.join('gameRoom');
        joinSocket.join('gameRoom');



    }

    /**
     * Creates graphs from .obj files specified by path
     * @param path - relative path to board folder
     * @returns {Array} - array of [graphs,name] name is file name without .obj
     */
    importBoards(path){
        const fs = require('fs');
        const GraphLoader = require("./serverSide/games/ThreeDGo/ObjToGraph");

        let listOfBoardFileNames = fs.readdirSync(path);

        let listOfBoards = [];
        let listOfBoardNames = [];
        let loader =  new GraphLoader.ObjToGraphLoader();

        for (let boardName of listOfBoardFileNames ) {
            let graph = loader.convertObjToGraph(path+boardName);
            let parts = boardName.split('.');
            let name  = parts[0];
            listOfBoardNames.push("3dgo "+name);
            listOfBoards.push(graph)

        }
        return [listOfBoards,listOfBoardNames];
    }
}

let server = new Server(process.argv[2]);

