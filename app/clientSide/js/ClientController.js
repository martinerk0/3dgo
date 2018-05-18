// Client part of the client server code
/**
 * Namespace for JSDoc Client side
 * @namespace Client
 */

import {ThreeView} from './ThreeView.js';
import {TextView} from './TextView.js';
import {Connect4} from './Connect4.js';
import {ThreeDGo} from './ThreeDGo.js';
import {GameController} from './GameController.js';


/**
 *  Manages network connection to server. <br>
 *  Also renders Lobby.
 *  @memberof Client
 *  listents for events: <br>
 *   'connect','gameMessage','updateList','playGame', <br>
 *   'gameHasFinished','userDisconnected','disconnect' <br>
 */
class ClientController{
    constructor() {
        let socket = io();
        let currentGame;
        this.state = "gameMenu";
        let gameListRoom = "gameRoom"; // this is default room for all players that connects to the server
        this.model=null;
        this.view=null;
        this.GameController=null;

        socket.on('connect', ()=> {
            let sessionid = socket.io.engine.id; //
            let whoamiDiv = document.getElementById("whoami");
            whoamiDiv.innerHTML = sessionid;
        });

        /**
         * message is a list of names of
         */
        socket.on('listOfBoards', message=> {

            createListOfBoards(message); // from list of names, create boards

        });


        socket.on('gameMessage',message => {
            if(this.state==="playingGame"){
                this.GameController.processMessageFromServer(message)
            }
            else{
                alert("ERROR");
                console.log(this.state);
                console.log(message);
            }
        });

        socket.on('updateList', data => {

            console.log("update list!");
//         data is list of available games
            let availableList = JSON.parse(data);
            console.log(availableList);
            refreshListOfAvailableGames(availableList);
        });

        /**
         * @method
         * Initializes model,view and controller
         */
        socket.on('playGame', data => {
            $(".lobby" ).hide();

            let runningGame = JSON.parse(data);
            currentGame = runningGame;
            console.log(runningGame.hostPlayer + " is playing with: " + runningGame.joinPlayer);


            this.state = "playingGame";

            // we need to initialize game instance before actual game communication begins
            // that's why we send game name beforehand
            let gameNameParts=currentGame.gameName.split(' ');
            let gameName=gameNameParts[0];


            if(gameName==="connect4") {
                // While we focused on developing 3DGo, Connect4 functionality was left in here
                // together with text view to demonstrate how different games could be added
                this.model = new Connect4(6,7);
                this.view= new TextView(this.model);
            }
            else if(gameName==="3dgo") {

                this.model = new ThreeDGo(null);
                this.view= new ThreeView(this.model);
            }
            else{
                throw "game not available!";
            }



            this.GameController= new GameController(socket,this.view,this.model);

        });

        socket.on('gameHasFinished', data => {
            // both host and joined player have to get this message!
            // data is updated list of available games!
            // server sended this message indicating that other player or something terminated this game
            this.state = "gameMenu";           // return from  "playingGame" to  "gameMenu"

            document.getElementById("gameMenuDiv").hidden = false;
            document.getElementById("gameDiv").hidden = true;
            document.getElementById("waitForOpponentDiv").hidden = true;
            document.getElementById("playingGameDiv").hidden = true;
            $(".lobby" ).show();

            document.removeEventListener('mousedown',this.GameController.myMouseListener , false);


            this.view.destroy();
            this.view=null;

            this.model=null;
            this.view=null;
            this.GameController=null;



            let availableList = JSON.parse(data);
            refreshListOfAvailableGames(availableList)

        });

        socket.on('userDisconnected', data => {
            let availableList = JSON.parse(data);
            refreshListOfAvailableGames(availableList);
            console.log("user disconnected, updating available list!")
        });

        socket.on('disconnect', () => {
//        alert('Server is down');
            document.getElementById("gameMenuDiv").hidden = true; // hide everything
            document.getElementById("waitForOpponentDiv").innerHTML = "Server is Down, reload page or try later!";
//

            window.location.reload(true);
        });

// ------------------- functions -------------------
        var createListOfBoards = message =>{
            let select = document.getElementById("gameListSelect");
            let listOfGameNames = JSON.parse(message);
            for (let boardName of listOfGameNames ) {
                let  option = document.createElement("option");
                let parts = boardName.split(' ');
                option.value = boardName;
                option.innerHTML = parts[1];
                select.append(option);
            }

        };

        var refreshListOfAvailableGames = listOfGames => {
            if (this.state === "gameMenu") {
                createTable(listOfGames)
            }
            else {
                console.log(" else branch of refresh list...this should write if state is not gameMenu ")
            }
        };

        var createTable = listOfGames => {

            let gameList = document.getElementById("gameListDiv");
            gameList.innerHTML = '';                                // reset ul

            let table = document.createElement("table");
            table.id ="gameTable";
            table.setAttribute('class', 'table table-hover');

            let thead = document.createElement("thead");

            let  tr = document.createElement("tr");

            let  headingNum = document.createElement("th");
            headingNum.scope="col";
            headingNum.appendChild(document.createTextNode("#"));
            tr.appendChild(headingNum);

            let  h1 = document.createElement("th");
            h1.appendChild(document.createTextNode("player ID"));
            h1.scope="col";

            let  h2 = document.createElement("th");
            h2.appendChild(document.createTextNode("game type"));
            h2.scope="col";

            let  h3 = document.createElement("th");
            h3.appendChild(document.createTextNode("opponent"));
            h3.scope="col";


            let  h4 = document.createElement("th");
            h4.appendChild(document.createTextNode("play It"));
            h4.scope="col";

            tr.appendChild(h1);
            tr.appendChild(h2);
            tr.appendChild(h3);
            tr.appendChild(h4);

            thead.appendChild(tr);
            table.append(thead);

            let counter = 0;
            let  tbody = document.createElement("tbody");
            for (let onegame of listOfGames) {

                let row = document.createElement("tr");
                //let div = document.createElement("div");                  // create li
                //            let num =  counter.toString();
                let {hostName, number,game,opponent} = onegame;

                let  heading = document.createElement("th");
                heading.scope="row";
                heading.appendChild(document.createTextNode(counter.toString()));
                counter=counter+1;
                row.appendChild(heading);

                let  c1 = document.createElement("td");
                c1.appendChild(document.createTextNode(hostName));

                let  c2 = document.createElement("td");
                c2.appendChild(document.createTextNode(game));

                let  c3 = document.createElement("td");
                c3.appendChild(document.createTextNode(opponent));

                let  c4 = document.createElement("td");
                let btn = document.createElement("BUTTON");
                btn.id = hostName;
                btn.onclick = playGameFunction;
                btn.appendChild(document.createTextNode("Play Game!"));
                btn.setAttribute('class', 'btn btn-success');
                c4.appendChild(btn);

                row.appendChild(c1);
                row.appendChild(c2);
                row.appendChild(c3);
                row.appendChild(c4);
                tbody.appendChild(row);


            }
            table.appendChild(tbody);
            gameListDiv.appendChild(table);
        }

        //this function will start selected game from list of available games
        var playGameFunction = event =>{
            // send data to server that you want to play this game
            // and wait for response
            var element = event.target.id;              //get id of button which you selected!
            console.log("I want to joint to " + element)
            socket.emit('joinGame', element);
        };

        // this function will send message to the server that it wants to create new game
        // it doesn't create new game itself
        var createGame = event => {

            let e = document.getElementById("gameListSelect");
            let game = e.options[e.selectedIndex].value;


            let e2 = document.getElementById("opponentListSelect");
            let opponent = e2.options[e2.selectedIndex].value;


            // get game and opponent
            let message = {
                id:socket.id,
                game:game,
                opponent:opponent
            };

            socket.emit('createNewGame', message);
            waitForOpponent();
        };

        var waitForOpponent = () =>{
            console.log("waitForOpponent");
            document.getElementById("gameMenuDiv").hidden = true; // hide everything
            document.getElementById("waitForOpponentDiv").hidden = false; // show wait

            $(".lobby" ).hide();


            this.state = "waitForOpponent"
        };

        var cancelWaitingForOpponent = ()=> {
            socket.emit('cancelNewGame', socket.id);
            console.log("cancelled waiting for opponent");
            document.getElementById("gameMenuDiv").hidden = false;
            document.getElementById("waitForOpponentDiv").hidden = true;
            $(".lobby" ).show();


            this.state = "gameMenu"
        };

        var finishGame = () => {

            let serializedGame = JSON.stringify(currentGame);
            socket.emit('finishedGame', serializedGame);
        };


// ------------------- listeners -------------------

        let but1 = document.getElementById("cancelWaitingForOpponentButton");
        but1.addEventListener("click", cancelWaitingForOpponent);

        let but2 = document.getElementById("finishGameButton");
        but2.addEventListener("click", finishGame);


        let but3 = document.getElementById("createGameButton");
        but3.addEventListener("click", createGame);

    }
}

let client = new ClientController();
