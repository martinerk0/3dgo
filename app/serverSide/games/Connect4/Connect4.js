class Connect4{
    constructor(rows,cols){
        this.name= "connect4";
        this.board = this.initializeBoard(cols,rows);
        this.rows = rows;
        this.cols =cols;
        this.howMany = 0; // What?
        this.onMove= 1;  // 1 is first player, 2 is second player
        this.chainLen=4;
        this.lastPlayedX = -1;
        this.lastPlayedY = -1;
        //this.playersConnected=0;
        this.action=null;
    }

    serialize(){
        return this;
    }
    print(){
        let board = JSON.parse(JSON.stringify(this.board));
        let transpose = m => m[0].map((x,i) => m.map(x => x[i]));
        let mm = transpose(board.map(r => r.reverse()));    // first reverse rows, then transpose it!
        //let mm=this.board;
        for (let i = 0 ; i < mm.length; i++) {
            let str="";
            for (let j = 0 ; j < mm[0].length; j++) {
                str=str+mm[i][j];
            }
            console.log(str);
        }
    }
    // who win match? 0- not ended, 1-fst , 2 -snd , 42- draw
    isEnd(){

        if (this.lastPlayedX==-1 || this.lastPlayedY==-1){
            return 0
        }
        // ----------------  Row ----------------

        // I need to check all vertical, all horizontal and all diagonal positions
        let isEndRow = false;
        let row = this.board[this.lastPlayedX];
        let win_O=false;
        let win_X=false;


        let positions = row.length-this.chainLen+1;
        for (let i =  0; i <positions ; i++) {
            let currPart = row.slice(i,this.chainLen+i);
            win_X = currPart.every( ch => { return ch===1 });
            win_O = currPart.every( ch => { return ch===2 });
            if (win_X || win_O) {
                isEndRow = true;
                break;
            }
        }
        // chceck all horizontal positions
        if (isEndRow){
            if (win_X) {
                return 1;
            }
            else if (win_O) {
                return 2;
            }
            else{
                return 0;
            }
        }


        // ----------------  Column  ----------------

        let isEndCollumn = false;
        win_O=false;
        win_X=false;


        // potrebujem dostat y-ovy column ako list...
        let column=[];
        for (let row of this.board) {
            column.push(row[this.lastPlayedY])
        }

        positions = column.length-this.chainLen+1;

        for (let i =  0; i <positions ; i++) {
            let currPart = column.slice(i,this.chainLen+i);
            win_X = currPart.every( ch => { return ch===1 });
            win_O = currPart.every( ch => { return ch===2 });
            if (win_X || win_O) {
                isEndCollumn  = true;
                break;
            }
        }
        // chceck all horizontal positions
        if (isEndCollumn ){
            if (win_X) {
                return 1;
            }
            else if (win_O) {
                return 2;
            }
            else{
                return 0;
            }
        }
        // ----------------  Right Diagonal  ----------------


        // chceck right diagonal -> diagonal going from left to right
        let isEndDiagRight = false;
        win_O=false;
        win_X=false;

        let x = this.lastPlayedX;
        let y = this.lastPlayedY;

        let diag = this.getRightDiag(this.board,x,y);

        positions = diag.length-this.chainLen+1;


        for (let i =  0; i <positions ; i++) {
            let currPart = diag.slice(i,this.chainLen+i);
            win_X = currPart.every( ch => { return ch===1 });
            win_O = currPart.every( ch => { return ch===2 });
            if (win_X || win_O) {
                isEndDiagRight  = true;
                break;
            }
        }
        // chceck all horizontal positions
        if (isEndDiagRight  ){
            if (win_X) {
                return 1;
            }
            else if (win_O) {
                return 2;
            }
            else{
                return 0;
            }
        }
        // ----------------  Left Diagonal  ----------------

        let isEndDiagLeft = false;
        win_O=false;
        win_X=false;

        x = this.lastPlayedX;
        y = this.lastPlayedY;

        diag = this.getLeftDiag(this.board,x,y);

        positions = diag.length-this.chainLen+1;


        for (let i =  0; i <positions ; i++) {
            let currPart = diag.slice(i,this.chainLen+i);
            win_X = currPart.every( ch => { return ch===1 });
            win_O = currPart.every( ch => { return ch===2 });
            if (win_X || win_O) {
                isEndDiagLeft  = true;
                break;
            }
        }
        // chceck all horizontal positions
        if (isEndDiagLeft  ){
            if (win_X) {
                return 1;
            }
            else if (win_O) {
                return 2;
            }
            else{
                return 0;
            }
        }

        //#------------ draw ------------
        if (this.getValidMoves().length===0){
            return 42// # this means draw
        }
        else
        {
            // didnt ended

            return 0
        }
    }
    //# gets all valid moves
    getValidMoves() {
        let listOfValidMoves = [];
        for (let i = 0; i < this.cols; i++) {
            if (this.canPlayAt(i)) {
                listOfValidMoves.push(i)
            }
        }
        return listOfValidMoves;
    }
    getRightDiag(matrix, row, col) {
        let mi = Math.min(row, col);
        let maxHeightIndex = matrix.length - 1;
        let maxWidthIndex = matrix.length - 1;
        let lis = [];
        let crow = row - mi;
        let ccol = col - mi;
        while (true) {
            if (crow <= maxHeightIndex && ccol <= maxWidthIndex) {
                lis.push(matrix[crow][ccol]);
                crow = crow + 1;
                ccol = ccol + 1;
            }
            else {
                break;
            }
        }
        return lis
    }
    getLeftDiag(matrix, row, col) {
        let maxHeightIndex = matrix.length - 1;
        let maxWidthIndex = matrix[row].length - 1;
        let crow = row;
        let ccol = col;
        let diag = [];
        while (crow > 0 && ccol < maxWidthIndex) {// # go right and up
            crow = crow - 1;
            ccol = ccol + 1;
        }

        while (crow <= maxHeightIndex && ccol >= 0) { //# go left and down
            diag.push(matrix[crow][ccol]);
            crow = crow + 1;
            ccol = ccol - 1;
        }
        return diag;
    }
    getAllValidMoves() {
        let arrayOfValidMoves=[];
        for (let i =0  ; i <this.cols ; i++) {
            if (this.canPlayAtCollumn(i)){
                arrayOfValidMoves.push(i);
            }
        }
        return listOfValidMoves;
    }
    transformUserInputIntoMove(userInput){
        let moveStr = userInput.replace(/\n/g, '');
        //let move = moveStr.split(" ");
        //let move = [];
        let move = parseInt(moveStr);
        console.log(move);
        //move[1] = parseInt(parts[1]);

        if (  !Number.isNaN(move)  && move>=0 && move<this.cols    ){
            return move;
        }
        else{
            return false;
        }

    }
    canPlayAt(x){
        let count=0;
        for (let i =  0; i < this.rows ; i++) {
            if (this.board[x][i]===0){
                count=count+1
            }
        }
        if (count>0){
            return true;
        }
        else{
            return false;
        }
    }
    // play at x'th position
    play(x){
        if (this.canPlayAt(x)) {
            let y = this.getPos(x);
            this.board[x][y] = this.onMove;
            this.lastPlayedX = x;
            this.lastPlayedY = y;
            if (this.onMove === 1) {
                this.onMove = 2
            }
            else {
                this.onMove = 1
            }
        }
    }
    // get how many free spaces are at x'th collumn
    getPos(x){
        let count=0;
        for (let i =  0; i <this.rows ; i++) {
            if (this.board[x][i]===0){
                count+=1;
            }
        }
        return this.rows-count;
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

    // MCTS methods
    updateModel(newGameFromServer){
        this.board = newGameFromServer.board;
        this.rows = newGameFromServer.rows;
        this.cols =newGameFromServer.cols;
        this.howMany = newGameFromServer.howMany; // What?
        this.onMove= newGameFromServer.onMove;  // 1 is first player, 2 is second player
        this.chainLen=newGameFromServer.chainLen;
        this.lastPlayedX =newGameFromServer.lastPlayedX;
        this.lastPlayedY = newGameFromServer.lastPlayedY;
    }
    terminal(){
        let res = this.isEnd();
        // possible results are = 0 - draw, or 1,2,42
        if (res===0){
            return false
        }
        else {
            return true
        }
    }
    next_state(triedMoves){
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
    createCopy(){
        let newCopy = new Connect4(this.rows,this.cols);
        newCopy.board = JSON.parse(JSON.stringify(this.board));
        newCopy.onMove=this.onMove;
        newCopy.chainLen=this.chainLen;
        newCopy.lastPlayedX  = this.lastPlayedX;
        newCopy.lastPlayedX = this.lastPlayedY;

        return newCopy;

    };
    num_moves(){
        return this.getValidMoves().length;
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

    /**
     * Game has ended, who won?
     */
    evaluateBoard(playerWhoAsks){
        let res = this.isEnd();
        if (res==42){        //draw
            return 0
        }
        else if(res ==1){
            if(playerWhoAsks==1){
                return 1
            }
            else{
                return -1
            }
        }
        else if(res ==2){
            if(playerWhoAsks==2){
                return 1
            }
            else{
                return -1
            }
        }
        if (res==0){
            throw "game has not ended, why evaluate?"
        }
    }

}

exports.Connect4 = Connect4;
