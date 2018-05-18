const ThreeController = require('./serverSide/games/ThreeDGo/ThreeDGoController');
const Connect4Controller = require('./serverSide/games/Connect4/Connect4Controller');

/**
 * This function creates specific game controller which is then used by server
 * @param io
 * @param gameName
 * @param roomName
 * @param hostPlayer
 * @param joinPlayer
 * @param server
 * @returns {*}
 */
exports.createController = function (io,gameNameInput,roomName,hostPlayer,joinPlayer,server) {

    let controller;

    let gameNameParts=gameNameInput.split(' ');
    let gameName=gameNameParts[0];


    if(gameName==="connect4") {
        controller = new Connect4Controller.Connect4Controller(io,gameName,roomName,hostPlayer,joinPlayer,server);

    }
    else if(gameName==="3dgo") {
        controller =new ThreeController.ThreeDGoController(io,gameNameInput,roomName,hostPlayer,joinPlayer,server);
    }
    else{
        throw "game not available!";
    }


    return controller;
}


