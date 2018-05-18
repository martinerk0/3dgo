//const queue = require('./Queue');
// Queue from code.stephenmorley.org


function Queue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};


class Spot{
    constructor(color,id,x,y,z){
        this.color=color;
        this.id=id;
        this.x=x;
        this.y=y;
        this.z=z;
    }
}

class Node{
    constructor(id,dataStructure){
        this.id=id;
        this.data=dataStructure;
    }
}

class UndirectedGraph{
    constructor(){
        //this.vertList2=[];
        this.vertList= new Map();
        //this.adjList2=[];
        this.adjList = new Map();
        //this.idCounter=0;
    }
    serialize(){
        let serializedAdjList=[];
        for (let [key, value] of this.adjList) {
            serializedAdjList.push([key,[...value] ])
        }
        let serializedGraph={
            vertList :  [...this.vertList],
            adjList: serializedAdjList
        }
        return serializedGraph
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
        return this.vertList.get(id);
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
        // I need to copy objects inside maps too...
        let copy =  UndirectedGraph.deserialize(JSON.parse(JSON.stringify(this.serialize(this))));
        let copy2= new UndirectedGraph();
        //copy2.vertList = copy.vertList;
        //copy2.adjList = copy.adjList;
        //let newCopy = new UnorderedGraph();
        copy2.vertList =  new Map(copy.vertList);
        copy2.adjList =  new Map(copy.adjList);
        //return newCopy;
        return copy2;
    }

}

class ThreeDGo {
    //---------- Go methods: ----------
    constructor(graph) {
        this.board = graph;
        this.evalBoard = null;
        this.onMove = 1;  // 1 is first player, 2 is second player
        this.action = null;  // which action I took from parent to get to this node?
        this.passed = 0;
        this.komi = 0;
        this.state=null;
        this.blackScore = 0;
        this.whiteScore = 0;
        this.lastAddedStoneId=-1;
        this.firstPlayerAck=null;
        this.secondPlayerAck=null;
        this.whichPlayerPassedFirst=null;
        this.koMap = new Map();
    }
    initializeEvalPhase(){
        this.evalBoard = this.board.createCopy();
    }
    evalPut(move,color){
        this.evalBoard.at(move).color = color;
    }
    /**
     * This method is becase 3dgo graph is using maps they cannot be copied by JSON.stringify
     */
    computeStats(){
        let firstCount = 0;
        let secondCount=0;
        for (let [id, stone] of this.evalBoard.vertList) {
            if(stone.color===1){
                firstCount=firstCount+1;
            }
            else if(stone.color===2){
                secondCount=secondCount+1;
            }
        }
        let winner;
        if(firstCount>secondCount){
            winner=1
        }
        else if(firstCount===secondCount) {
            winner=0
        }
        else{
            winner= 2
        }
        let stats={
            winner: winner,
            firstScore:firstCount,
            secondScore:secondCount
        }
        return stats;
    }
    getHeight(){
        return this.height;
    }
    getWidth(){
        return this.width;
    }
    /**
     * returns true/false
     */
    didPlayerPass(){
        if (this.passed===1){
            return true;
        }
        else {
            false;
        }
    }
    isEnd(){
        if (this.passed===2){
            return 1
        }
        else {
            return 0
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
    /**
     * @param whoami
     * @returns {number}
     */
    evaluateBoard(whoami) {
        let myCount = 0;
        let enemyCount = 0;
        if (whoami === 1) { //       # add komi
            myCount = this.komi;
        }
        else {
            enemyCount = this.komi;
        }

        for (let [stone_id,stone] of this.board.vertList){     // iterate through vertices=stones
            if (stone.color === whoami) {
                myCount = myCount + 1
            }
            else if (stone.color !== whoami && stone.color !== 0) {
                enemyCount = enemyCount + 1;
            }
            else {
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
    /**
     * @param move
     */
    play(move) { // real play used to moves
        if (move === "p") {
            this.passed=this.passed+1;
            if (this.onMove === 1) {
                this.onMove = 2;
            }
            else {
                this.onMove = 1;
            }
            this.lastAddedStoneId="p";
        }
        else {
            this.passed=0;

            this.board.at(move).color = this.onMove;
            if (this.onMove === 1) {
                this.onMove = 2;
            }
            else {
                this.onMove = 1;
            }
            this.lastAddedStoneId=move;

            this.board = this.removeEnemyAdjacentGroups(move, this.board,true);
            let boardString = this.createStringOfBoard(this.board);
            this.koMap.set(boardString,this.koMap.size);

        }
    }
    /**
     * imaginary play used to check for suicides
     * @param board
     * @param move
     */
    imaginary_play(board, move) {
        let spot = board.vertList.get(move);
        spot.color = this.onMove;
    }
    canPlayAt(move) {
        if(move==="p"){             // player can always play pass
            return true
        }


        let pos = this.board.at(move);
        if (this.board.at(move).color === 0) {
            let copy_board = this.board.createCopy();
            this.imaginary_play(copy_board, move);
            let copy_boardEnemyRemoved = this.removeEnemyAdjacentGroups(move, copy_board,false);  // Step 2. (Capture) Removing from the board any stones of their opponent's color that have no liberties.
            let lib_stones = this.libAndStones(move, copy_boardEnemyRemoved, this.onMove);       // Step 3. (this-capture) Removing from the board any stones of their own color that have no liberties.
            // if after removal of enemy stones with no liberties
            // if there are my own stones with ZERO liberties, that means its suicide
            if (lib_stones[0] > 0) { // if it has more than zero liberties
                // it looks like valid move, chceck for superko!
                let boardString = this.createStringOfBoard(copy_boardEnemyRemoved);
                //copy_boardEnemyRemoved is the new board, lets check if this position has already been played
                if(this.koMap.has(boardString)){

                    return false; // ko!
                }
                else{
                    //// it is not ko, add this new board to koMap
                    //this.koMap.set(boardString,this.koMap.size);
                    return true;
                }


            }
            else {
                return false;
            }
        }
        else{
            return false; // playing was unsuccesful // print("You cant play here, its occupied intersection")

        }
    }
    removeEnemyAdjacentGroups(curr,board,forRealDelete) {
        // move is the move current player already played on the board
        // now we need to check neightbours if they have 0 liberties
        // if they do, we delete them
        let neighs = board.getNeighbours(curr);

        for (let neigh of neighs){
            if (neigh.color !== 0 && neigh.color !== board.at(curr).color ) {        // it is  stone of different color
                let lib_stones = this.libAndStones(neigh.id, board, neigh.color); // gets numLiberties && list of stones
                board = this.removeGroupAt(lib_stones, board,forRealDelete)       // delete them
            }
        }
        return board;
    }
    removeGroupAt(lib_stones,board,forRealDelete) {
        if (lib_stones[0] == 0) {
            for (let pos of lib_stones[1]) {
                board.at(pos).color = 0
            }
            // increase score of players
            if (forRealDelete===true) {
                if (this.onMove === 2) {
                    this.blackScore = this.blackScore + lib_stones[1].length;
                }
                else if (this.onMove === 1) {
                    this.whiteScore = this.whiteScore + lib_stones[1].length;
                }
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

            }

            if (board.at(curr).color === elem) {                              // do our operation with node
                wanted.push(curr);
            }
        }

        return [liberties_num,wanted];
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

    //---------- MCTS methods: ----------
    getValidMoves() {
        let listOfValidMoves = [];
        for (let [toKey,value] of this.board.vertList ){
            if (this.canPlayAt(toKey)) {
                listOfValidMoves.push(toKey)
            }
        }

        return listOfValidMoves;
    }
    /**
     * Is used in mcts simulations
     * @param self
     * @param triedMoves
     */
    next_state(triedMoves){
        if (this.passed==1){                        // if previous player passed
            if (this.evaluateBoard(this.onMove)){   // if I am winning, then pass, because you win!
                let newState = this.createCopy();
                newState.play("p");
                newState.action = "p";
                newState.passed = 2;
                return newState;
            }
        }


        let legalMoves=this.getValidMoves();
        //validMoves=list(set(legalMoves)-set(triedMoves))  # legal moves: [1,2,3,4,5], tried moves: [1,4,5] so valid are [2,3]
        let validMoves = legalMoves.filter(x => !triedMoves.includes(x));


        if (validMoves.length>0) {
            //# play    move

            let chosen = this.randomIntFromInterval(0, validMoves.length - 1);

            let newState = this.createCopy();
            newState.play(validMoves[chosen]);
            newState.action = validMoves[chosen];
            newState.passed = 0;
            return newState;
        }
        else {
            //# play  pass
            let newState = this.createCopy();
            newState.play("p");
            newState.action = "p";
            newState.passed = 1;
            return newState;
        }
    }
    /**
     * returns random integer from specified interval
     * @param min
     * @param max
     * @returns {number}
     */
    randomIntFromInterval(min,max){
        return Math.floor(Math.random()*(max-min+1)+min);
    }
    num_moves() {
        return this.getValidMoves().length;
    }
    /**
     * Creates copy of this instance
     * @param newGameFromServer
     * @returns {ThreeDGo}
     */
    createCopy(){
        let newGameFromServer = this;
        let copy = new ThreeDGo();
        let boardFromServer =  UndirectedGraph.deserialize(newGameFromServer.board);
        let boardFromServerGraph= new UndirectedGraph();
        boardFromServerGraph.vertList = boardFromServer.vertList;
        boardFromServerGraph.adjList = boardFromServer.adjList;
        copy.board=boardFromServerGraph.createCopy();
        copy.blackScore = newGameFromServer.blackScore;
        copy.whiteScore = newGameFromServer.whiteScore ;
        copy.action=newGameFromServer.action;
        copy.onMove=newGameFromServer.onMove;
        copy.lastAddedStoneId=newGameFromServer.lastAddedStoneId;

        if (newGameFromServer.evalBoard!==null){
            let evalBoardFromServer =   UndirectedGraph.deserialize(newGameFromServer.evalBoard);
            copy.evalBoard= new UndirectedGraph();
            copy.evalBoard.vertList =  evalBoardFromServer.vertList;
            copy.evalBoard.adjList = evalBoardFromServer.adjList;
        }
        return copy;
    }
    terminal(){
        let res = this.isEnd();

        if (res===1){
            return true
        }
        else {
            return false
        }
    }
    createStringOfBoard(board){
        let stringRepresentation="";
        for (var [key, value] of board.vertList) {
            stringRepresentation+=value.color.toString()

        }
        return stringRepresentation;
    }
    //---------- I/O methods: ----------
    serialize(){
         let copy =  JSON.parse(JSON.stringify(this));
         copy.board = this.board.serialize();
         if (this.evalBoard!==null) {
             copy.evalBoard = this.evalBoard.serialize();
         }
         return copy
    }
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
    processInputFromView(StoneSelected){
        let moveString = StoneSelected.x.toString()+" "+StoneSelected.y.toString()
        return  moveString;
    }
    transformUserInputIntoMove(userInput){
        //user input is id of selected stone
        let moveStr = userInput.replace(/\n/g, '');
        if (moveStr==="p"){
            return moveStr
        }
        //let parts = moveStr.split(" ");
        //let move = [];
        let move = parseInt(moveStr );
        //move[1] = parseInt(parts[1]);

        if (  !Number.isNaN(move) && this.board.vertList.has(move)  ){
            return move;
        }
        else{
            return false;
        }

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

exports.Spot = Spot;
exports.UndirectedGraph = UndirectedGraph;
exports.ThreeDGo = ThreeDGo;


