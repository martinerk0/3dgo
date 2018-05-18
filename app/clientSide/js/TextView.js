export class TextView{
    constructor(model){
        this.model=model;
        document.getElementById("gameMenuDiv").hidden = true;
        document.getElementById("gameDiv").hidden = false;
        document.getElementById("waitForOpponentDiv").hidden = true;
        document.getElementById("playingGameDiv").hidden = false;

        // adding some input for Connect4
        let element = document.getElementById("gameDiv");

        let stateDiv= document.createElement("div");
        stateDiv.id = "stateDivID";
        element.appendChild(stateDiv);

        let outputDiv= document.createElement("div");
        outputDiv.id = "outputDivID";
        element.appendChild(outputDiv);


        let input = document.createElement("input"); // I create textbox
        input.type = "text";
        input.id = "inputTextbox";               // set id input textbox
        this.input=input;
        element.appendChild(input);

        let btn = document.createElement("button");
        btn.id = "gameMoveButton";
        element.appendChild(btn);
    }
    initialize()
    {

    }
    updateView(){
        this.print(this.model);
    }

    print(model){
        let board = JSON.parse(JSON.stringify(model.board));
        let transpose = m => m[0].map((x,i) => m.map(x => x[i]));
        let mm = transpose(board.map(r => r.reverse()));    // first reverse rows, then transpose it!
        //let mm=this.board;
        let newBoard="";
        for (let i = 0 ; i < mm.length; i++) {
            let str="";
            for (let j = 0 ; j < mm[0].length; j++) {
                str=str+mm[i][j];
            }
            //console.log(str);
            newBoard=newBoard+str+"<br/>";
        }

        let element = document.getElementById("stateDivID");
        element.innerHTML = this.model.state;

        element = document.getElementById("outputDivID");
        element.innerHTML = newBoard;
    }


}