class Node {
    constructor(state, parent) {
        this.visits = 0;
        this.parent = parent;
        this.reward = 0.0;
        this.children = [];
        this.state = state;
    }

    /**
     * Takes child state and adds it to the list of children
     * NOTE: childState is completely deep copied state!
     * @param childState
     */
    addChild(childState) {
        let child = new Node(childState, this);
        this.children.push(child);
    }

    update(reward) {
        this.reward += reward;
        this.visits += 1;
    }

    fully_expanded() {
        if (this.children.length === this.state.num_moves()) {
            return true;
        }
        else {
            return false;
        }
    }
}

exports.Node = Node;

