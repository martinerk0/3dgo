const WIN_CONST = 1;
const LOSE_CONST = -1;
const DRAW_CONST = 0;


const CONST=1/Math.sqrt(2.0);

const Node = require('../Node');

class MCTS_Connect4_Agent {
    constructor(player, iters) {
        this.player = player; // whoami
        this.iterations = iters;
    }

    getPlay(game) {

        if (game.passed === 1) { //// returns true If I am winning
            if (game.evaluateBoard(game.onMove) === 1) {         //      // query board if we are "winning"
                return "p";
            }
        }

        let validMoves = game.getValidMoves();
        if (validMoves.length > 0 ){
            return  this.uctSearch(game);
        }
        else {
            return "p";
        }
    }


    uctSearch(state) {
        let root = new Node.Node(state, null);

        for (let i=0; i<this.iterations; i++) {               // budget
            let leafNode = this.treePolicy(root);                // from root, do tree policy and add one new leaf node
            let reward = this.defaultPolicy(leafNode.state);   // do playout with state, and compute reward for this state
            this.backup(leafNode, reward);        // update reward and count values on the path from leaf node to the root node
        }
        let bestChild = this.bestChild(root, 0);
        return bestChild.state.action;         // select best following child from root node
    }

    treePolicy(node) {
        while (node.state.terminal() === false) {
            if (node.fully_expanded() === false) {
                return this.expand(node);
            }
            else {
                node = this.bestChild(node, CONST);
            }
        }
        return node;
    }

    // default policy computes end reward for input state
    defaultPolicy(state) {
        let state2 = state.createCopy();                    // so we dont affect current state by playout
        while (state2.terminal() === false) {
            state2 = state2.next_state([]);
        }

        let reward = state2.evaluateBoard(this.player);  // compute winner/loser/draw reward for this player
        return reward;
    }

    expand(node) {
        let tried_actions = node.children.map(c => c.state.action);
        let new_state = node.state.next_state(tried_actions);

        node.addChild(new_state);

        return node.children[node.children.length-1];    //  get last added , can children size be 0?

    }

    bestChild(node, CONST) {
        let bestscore = -Number.MAX_VALUE;
        let bestchildren = [];
        for (let c of node.children) {
            let exploit = c.reward / c.visits;
            let explore = Math.sqrt(Math.log(2 * node.visits) / c.visits);
            let score = exploit + CONST * explore;
            if (score === bestscore) {
                bestchildren.push(c);
            }
            if (score > bestscore) {
                bestchildren = [c];
                bestscore = score;
            }
            if (bestchildren.length === 0) {
                console.log("no best child found!!!");
            }
        }
        let best_children = bestchildren[Math.floor(Math.random()*bestchildren.length)];
        if (best_children==undefined){
            throw "should not be undefined!"
        }
        else{
            return best_children;
        }
    }


    backup(node, reward) {
        while (node != null) {
            node.visits = node.visits + 1;
            node.reward = node.reward + reward;
            node = node.parent;
            reward = -reward;
        }
        return
    }

}

exports.MCTS_Connect4_Agent = MCTS_Connect4_Agent;