const Graph = require('./ThreeDGoServer');



class ObjToGraphLoader{
    constructor(){
        this.fs = require('fs');
    }
    convertObjToGraph2(pathToFile){

        let data = this.fs.readFileSync(pathToFile,"utf8");

        return data;
    }

    /**
     * Reads file in the following obj format:
     * 1. vertices in the form:  v  x_coord y_coord z_coord
     * 2.    edges in the form:  l  from_vertex to_vertex
     * and returns UndirectedGraph object
     * @param pathToFile
     * @returns {Graph}
     */
    convertObjToGraph(pathToFile){
        let vertexCounter=1;
        let graph =new Graph.UndirectedGraph();

        let data = this.fs.readFileSync(pathToFile,"utf8");

        let lines = data.split(/\r?\n/);
        // at the beginning we have vertices identified by v...

        // after that edges which are identified by l....
        let areEdges=false;

        for (let line of lines){
            let partsOfLine = line.split(" ");
            if(partsOfLine[0]==="#"){
                // it is comment,skip
            }
            else if (partsOfLine[0]===""){
                // eof
            }
            else if(partsOfLine[0]==="v"){
                //I need to add vertex to vert list
                let x = parseFloat(partsOfLine[1]);
                let y = parseFloat(partsOfLine[2]);
                let z = parseFloat(partsOfLine[3]);
                let vertex = new Graph.Spot(0,vertexCounter,x,y,z);
                graph.addVertex(vertexCounter,vertex);
                vertexCounter=vertexCounter+1;
            }
            else if(partsOfLine[0]==="l"){
                let from = parseInt(partsOfLine[1],10);
                let to = parseInt(partsOfLine[2],10);
                graph.addEdge(from,to)
            }
            else{
                throw "Bad obj format, only vertices and edges - check documentation";
            }
        }



        return graph;
    }
}


exports.ObjToGraphLoader = ObjToGraphLoader;