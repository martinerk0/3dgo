export class Connect4{
    constructor(rows,cols,view){
        this.board = this.initializeBoard(cols,rows);
        this.rows = rows;
        this.cols =cols;
        this.howMany = 0; // What?
        this.onMove= 1;  // 1 is first player, 2 is second player
        this.chainLen=4;
        this.lastPlayedX = -1;
        this.lastPlayedY = -1;
        //this.playersConnected=0;
        this.height=rows;
        this.width=cols;
        this.state=null;
    }
    updateState(new_state){
        this.state=new_state;
    }
    updateModel(newGameFromServer){

        this.board=newGameFromServer.board;
        this.rows=newGameFromServer.rows;
        this.cols=newGameFromServer.cols;
        this.onMove=newGameFromServer.onMove;

    }
    getHeight(){
        return this.height;
    }
    getWidth(){
        return this.width;
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
    // who win match? 0- not ended, 1-fst , 2 -snd
    isEnd(){
        // ----------------  Row ----------------

        // I need to check all vertical, all horizontal and all diagonal positions
        let isEndRow = false;
        let row = this.board[this.lastPlayedX];
        let win_O=false;
        let win_X=false;


        // javascript sice

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
            //#------------ draw ------------

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
        //move[1] = parseInt(parts[1]);

        if (Number.isNaN(move) || Number.isNaN(move) ){
            return false;
        }
        else{
            return move;
        }

    }

    processInputFromView(StoneSelected){

        return  StoneSelected.x.toString();
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
}
