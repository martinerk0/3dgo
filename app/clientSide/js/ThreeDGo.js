//const queue = require('./Queue');

// Queue from code.stephenmorley.org
function Queue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};

export class Spot{
    constructor(color,id,x,y,z){
        this.color=color;
        this.id=id;
        this.x=x;
        this.y=y;
        this.z=z;
    }
}

export class Node{
    constructor(id,dataStructure){
        this.id=id;
        this.data=dataStructure;
    }

}

export class UndirectedGraph{
    constructor(){
        //this.vertList2=[];
        this.vertList= new Map();
        //this.adjList2=[];
        this.adjList = new Map();
        //this.idCounter=0;
    }
    serialize(){
        let serializedGraph={
            vertList :  [...this.vertList],
            adjList: [...this.adjList]
        }
    }
    static deserialize(serializedGraph){
        let deserializedAdjList=[];
        for (let [key,value] of serializedGraph.adjList){
            let elem = [key,new Map(value) ];
            //let newElem = new Map(elem);
            deserializedAdjList.push(elem);
        }
        let newAdjList = new Map(deserializedAdjList);

        let deserializedGraph={
            vertList : new Map(serializedGraph.vertList),
            adjList: newAdjList
        };

        return deserializedGraph;

    }
    at(id){
        let stone =this.vertList.get(id);
        return stone;
    }
    addVertex(id,data){
        //this.vertList.push(new Node(id,data));
        this.vertList.set(id,data)

    }
    addEdge(from,to){
        if (this.adjList.has(from)){
            let neighMap = this.adjList.get(from);
            neighMap.set(to,true);
        }
        else{
            let neightMap = new Map();
            neightMap.set(to,true);
            this.adjList.set(from,neightMap);
        }

        if (this.adjList.has(to)){
            let neighMap = this.adjList.get(to);
            neighMap.set(from,true);
        }
        else{
            let neightMap = new Map();
            neightMap.set(from,true);
            this.adjList.set(to,neightMap);
        }
    }
    /**
     * returns array of neighbours of input vertex
     * @param id
     */
    getNeighbours(id){
        let neighMap =  this.adjList.get(id);
        let a = Array.from(neighMap.keys());
        let neighs= [];
        for (id of a){
            neighs.push(this.vertList.get(id))
        }
        return neighs;

    }

    createCopy(){
        let newCopy = new UndirectedGraph();
        newCopy.vertList =  new Map(this.vertList);
        newCopy.adjList =  new Map(this.adjList);
        return newCopy;
    }
}
let GameState = Object.freeze({NOT_GAME_STATE: "NOT_GAME_STATE", MAKING_MOVE: "MAKING_MOVE", WAITING_FOR_TURN: "WAITING_FOR_TURN",EVAL_PHASE:"EVAL_PHASE",GAME_ENDED:"GAME_ENDED"});


export class ThreeDGo {
    constructor(graph) {
        this.board = graph;
        this.evalBoard=null;    // this will be for evaluation phase, I will have two boards and render evalBoard on top of normal board!
        this.onMove = 1;  // 1 is first player, 2 is second player
        this.action = null;  // which action I took from parent to get to this node?
        this.passed = 0;
        this.komi = 0;
        this.blackScore = 0;
        this.whiteScore = 0;
        this.lastAddedStoneId=-1;
        this.state=null;
        this.gameState ="not initialized";
        this.selectState="not initialized";
        this.firstPlayerAck=null;
        this.secondPlayerAck=null;
    }
    initializeEvalPhase(){
        this.evalBoard = this.board.createCopy();
    }
    evalPut(move){
        this.board.at(move).color = this.onMove;
    }
    serialize(){
        let copy =  JSON.parse(JSON.stringify(this));
        copy.board = this.board.serialize();
        return copy
    }
    isOccupied(idOfSelectedStone){
        if (idOfSelectedStone==="p" || this.board.at(idOfSelectedStone).color===0){
            return false;
        }
        else{
            return true;
        }
    }
    //fromServerDeserialize(inputGame){
    //    let newBoard = new Map(JSON.parse(inputGame.board));
    //    this.board = newBoard;
    //    this.onMove = inputGame.onMove;
    //    this.passed = inputGame.passed ;
    //    this.komi = inputGame.komi;
    //
    //}
    updateState(new_state){
        this.state=new_state;
    }
    updateModel(newGameFromServer){
        let boardFromServer =  UndirectedGraph.deserialize(newGameFromServer.board);
        this.board= new UndirectedGraph();
        this.board.vertList = boardFromServer.vertList;
        this.board.adjList = boardFromServer.adjList;
        this.blackScore = newGameFromServer.blackScore;
        this.whiteScore = newGameFromServer.whiteScore ;
        this.onMove=newGameFromServer.onMove;
        this.lastAddedStoneId=newGameFromServer.lastAddedStoneId;

        if (newGameFromServer.evalBoard!==null){
            let evalBoardFromServer =   UndirectedGraph.deserialize(newGameFromServer.evalBoard);
            this.evalBoard= new UndirectedGraph();
            this.evalBoard.vertList =  evalBoardFromServer.vertList;
            this.evalBoard.adjList = evalBoardFromServer.adjList;
        }
    }
    mapToJson(map) {
        return JSON.stringify([...map]);
    }
    jsonToMap(jsonStr) {
        return new Map(JSON.parse(jsonStr));
    }
    getHeight(){
        return this.height;
    }
    getWidth(){
        return this.width;
    }
    processInputFromView(StoneSelected){
        let moveString = StoneSelected.toString();
        return  moveString;
    }

    /**
     * Retruns number of liberties of stone with given ID.
     * @param {number} stoneId id of stone
     * @returns {number} number of liberties of given stone
     */
    getNumberOfLiberties(stoneId){
        let data = this.libAndStones(stoneId,this.board,this.board.at(stoneId).color);
        return data[0];
    }

    /**
     * returns true/false
     */
    isEnd(){
        if (this.passed===2){
            return true
        }
        else {
            return false
        }
    }

    computeWinner(whoami) {
       let w = this.evaluateBoard(whoami);
       if (w===0){
           return 0
       }
       else if ( w===1){
           if (whoami===1){
               return 1
           }
           else{
               return 2
           }
       }
       else{
           if (whoami===1){
               return 2
           }
           else{
               return 1
           }
       }

    }

    evaluateBoard(whoami) {
         let myCount = 0;
         let enemyCount = 0;
         if (whoami === 1) { //       # add komi
             myCount = this.komi;
         }
         else {
             enemyCount = this.komi;
         }

         for (let row of this.board) {
             for (let elem of row) {
                 if (elem === whoami) {
                     myCount = myCount + 1
                 }
                 else if (elem !== whoami && elem !== 0) {
                     enemyCount = enemyCount + 1;
                 }
                 else {

                 }
             }
         }
         if (myCount > enemyCount) {
             return 1
         }
         else if (myCount === enemyCount) {
             return 0
         }
         else {
             return -1
         }
    }

    play(move) { // real play used to moves
         if (move === "p") {
             this.passed=this.passed+1;
             if (this.onMove === 1) {
                 this.onMove = 2;
             }
             else {
                 this.onMove = 1;
             }
         }
         else {
             this.passed=0;
             //let x = move[0];
             //let y = move[1];
             this.board.at(move).color = this.onMove;
             if (this.onMove === 1) {
                 this.onMove = 2;
             }
             else {
                 this.onMove = 1;
             }

             this.board = this.removeEnemyAdjacentGroups(move, this.board);
         }
     }

    imaginary_play(board, move) {// imaginary play used to check for suicides
        let spot = board.vertList.get(move);
        spot.color = this.onMove;
    }
    canPlayAt(move) {
        if(move==="p"){
            return true
        }

        let pos = this.board.at(move);
        if (this.board.at(move).color === 0) {
            let copy_board = this.board.createCopy();
            this.imaginary_play(copy_board, move);
            let copy_boardEnemyRemoved = this.removeEnemyAdjacentGroups(move, copy_board);  // Step 2. (Capture) Removing from the board any stones of their opponent's color that have no liberties.
            let lib_stones = this.libAndStones(move, copy_boardEnemyRemoved, this.onMove);       // Step 3. (this-capture) Removing from the board any stones of their own color that have no liberties.
            // if after removal of enemy stones with no liberties
            // if there are my own stones with ZERO liberties, that means its suicide
            if (lib_stones[0] > 0) { // if it has more than zero liberties
                return true // it is valid move, play it!
            }
            else {
                return false;
            }
        }
        else{
            return false // playing was unsuccesful // print("You cant play here, its occupied intersection")

        }
    }
    removeEnemyAdjacentGroups(curr,board) {
        // move is the move current player already played on the board
        // now we need to check neightbours if they have 0 liberties
        // if they do, we delete them
        let neighs = board.getNeighbours(curr);

        for (let neigh of neighs){
            if (neigh.color !== 0 && neigh.color !== board.at(curr).color ) {        // it is  stone of different color
                let lib_stones = this.libAndStones(neigh.id, board, neigh.color); // gets numLiberties && list of stones
                board = this.removeGroupAt(lib_stones, board)       // delete them
            }
        }

        return board;
    }

    removeGroupAt(lib_stones,board) {
        if (lib_stones[0] == 0) {
            for (let pos of lib_stones[1]) {
                board.at(pos).color = 0
            }
        }
        return board
    }

    libAndStones(move,board,elem){
        if (board.at(move).color!==elem) {
            // print("this is incorrect intersection!")
            return [0, []]
        }

        let visited = [];               // visited means that I already added this node to Queue
        for (let elem of board.vertList){
            let newElem=false;
            visited.push(newElem)
        }



        let Q = new Queue();

        let wanted=[];

        Q.enqueue(move);        // I will work with tuples of positions, e.g. (x,y)
        let curr=move;
        visited[move]=true;


        let liberties_num=0;
        while (!Q.isEmpty()) {
            curr = Q.dequeue();
            let neighs = board.getNeighbours(curr);
            for (let neigh of neighs) {                                                // we check all its children
                if (visited[neigh.id] === true) {
                    continue;
                }
                else {
                    if (neigh.color === elem) {
                        Q.enqueue(neigh.id);
                    }
                    else if (neigh.color === 0) {
                        liberties_num = liberties_num + 1
                    }
                    else {
                        //console.log("error");
                    }
                    visited[neigh.id] = true;
                }
                //}

            }

            if (board.at(curr).color === elem) {                              // do our operation with node
                wanted.push(curr);
            }
        }

        return [liberties_num,wanted];
    }

    transformUserInputIntoMove(userInput){
        //user input is id of selected stone
        let moveStr = userInput.replace(/\n/g, '');
        if (moveStr==="p"){
            return moveStr
        }
        let move = parseInt(moveStr );

        if (  !Number.isNaN(move)  ){
            return move;
        }
        else{
            return false;
        }

    }
    initializeBoard(rows, cols) {
        let matrix = [];
        for(let  i=0; i<rows; i++) {
            let row=[];
            for (let j = 0 ; j <cols ; j++) {
                row.push(0);
            }
            matrix.push(row);
        }
        return matrix;
    }


    print(){
        let br = 0;
        let b = Array.from( this.board.vertList.values() );
        let str="";
        for (let v of b){
            str=str+v.color.toString();
        }
        console.log(str);
    }
}

