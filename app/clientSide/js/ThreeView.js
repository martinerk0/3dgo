
import * as THREE from './three.module.js';
import {OrbitControls}  from '../lib/threejs-full-es6/sources/controls/OrbitControls.js';

/**
 * Manages 3D rendering
 * @memberof Client
 */
export class ThreeView {
    constructor(input_model) {
        document.getElementById("gameMenuDiv").hidden = true;
        document.getElementById("gameDiv").hidden = false;
        document.getElementById("waitForOpponentDiv").hidden = true;
        document.getElementById("playingGameDiv").hidden = false;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.objects = [];
        this.objectsUI=[];
        this.model = input_model;
        this.renderer = new THREE.WebGLRenderer({antialias:true});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.Enabled = true;
        //renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = false;       // this is for rendering UI sprites atop of other
        // UI camera - we will be using orthographic camera for sprite layout, and separate ortho scene
        let width = window.innerWidth;
        let height = window.innerHeight;
        this.cameraOrtho = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
        this.cameraOrtho.position.z = 10;

        this.sceneOrtho = new THREE.Scene();

        this.helper = false;

        if (this.helper===true) {
            let axisHelper = new THREE.AxisHelper(512);
            this.sceneOrtho.add(axisHelper);
        }


        let color =0xdddddd;
        //let color =0xccd3e8;
        //let color =0xb5a290;
        //let color =0xad731d;
        //let color =0xf2f2f2;
        this.scene.background = new THREE.Color(color);
        //this.scene.background = new THREE.Color( 0xefd1b5 );
        //this.scene.fog = new THREE.FogExp2( color, 0.01 );
        //this.scene.fog = new THREE.Fog( color, 5 );


        this.renderer.domElement.id = "canvasID";
        let gameDiv = document.getElementById("gameDiv");
        gameDiv.appendChild(this.renderer.domElement);

        THREE.DefaultLoadingManager.onLoad = ()  =>{

             console.log( 'everything loaded' ); // debug

            this.renderer.render(this.scene, this.camera);

        };
        window.addEventListener('resize',  this.onWindowResizeMy = ()=> {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(window.innerWidth, window.innerHeight);
        },false);


        //var plane = new THREE.GridHelper(100, 10);
        //this.scene.add(plane);

        this.camera.position.set(5, 5, 10);

        // CONTROLS
        let defineControls = true;
        //let defineControls=false;
        this.controls;
        if (defineControls) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.center.x = 0;
            this.controls.center.y = 0;
            this.controls.center.z = 0;
        }



        this.animation = true;


        var animate = ()=> {

                if(this.renderer===null){
                    return;
                }


                this.renderer.render(this.scene, this.camera);
                this.renderer.render(this.sceneOrtho, this.cameraOrtho);


            requestAnimationFrame(animate);

        };
        animate(this.animation);

    }
    showLiberties(idOfSelectedStone){
        console.log("showing liberties");

        let numberOfLiberties = this.model.getNumberOfLiberties(idOfSelectedStone);
        console.log(numberOfLiberties);

        let libertySprite = this.makeTextSprite( "  "+numberOfLiberties.toString()+"  ",
            {
                fontsize: 32,
                borderColor: {r: 0, g: 0, b: 0, a: 1.0},
                backgroundColor: {r: 229, g: 68, b: 130, a: 1.0}
            }
        );
        let stone = this.model.board.at(idOfSelectedStone);

        let k = this.scene.children.find(
            element => {
                if (element.hasOwnProperty('isSphere')){
                    if (element.stoneId === idOfSelectedStone){
                        return true
                    }
                    else{
                        return false;
                    }
                }
                else{
                    return false;
                }
            }
        );

        libertySprite.name = "libertyCount";
        libertySprite.scale.set(2,1,1);
        libertySprite.position.set(stone.x, stone.y, stone.z);
        this.scene.add(libertySprite);

    }
    hideLiberties(){
        console.log("hiding liberties");
        this.scene.remove(this.scene.getObjectByName("libertyCount"));
    }
    highlightSelectedStone(idOfSelectedStone){
        console.log("higlighting selected stone");

        let outline= this.scene.getObjectByName("stoneHighlight");

        if (idOfSelectedStone!=="p" && idOfSelectedStone!==-1 ){

            let lastPlayedStone = this.scene.children.find(
                element => {
                    if (element.hasOwnProperty('isSphere')){
                        if (element.stoneId === idOfSelectedStone){
                            return true
                        }
                        else{
                            return false;
                        }
                    }
                    else{
                        return false;
                    }
                }
            );
            outline.position.copy(lastPlayedStone.position);
            outline.visible = true;
        }
        else{
            outline.visible = false;
        }
        this.renderer.render(this.scene, this.camera);
    }
    cancelHighlighting() {
        console.log("cancel higlighting selected stone");

        let outline= this.scene.getObjectByName("stoneHighlight");
        outline.visible = false;
    }
    initialize(){
        this.addLightsAndPlane(this.scene);
        this.addStonesToScene(this.model, this.scene, this.objects);
        this.renderLines(this.scene);
        this.initializeGUI(this.sceneOrtho,this.objectsUI);
    }
    /**
     *  adds Stones and highlights to scene
     * @param model data of the game
     * @param scene three.js scene that we will add objects to
     * @param objects   list of objects for bookkeeping
     */
    addStonesToScene(model, scene, objects){
        for (let [id, stone] of model.board.vertList){
            let geometry = new THREE.SphereGeometry(1, 32, 32);
            let alpha = 0.5;
            let  beta = 0.5;
            let gamma = 0.5;

            var diffuseColor = new THREE.Color().setRGB(20, 30, 255);


            let material = new THREE.MeshPhysicalMaterial( {
                color: diffuseColor,
                metalness: 0,
                roughness: 0.5,
                clearCoat:  1.0 - alpha,
                clearCoatRoughness: 1.0 - beta,
                reflectivity: 1.0 - gamma,
                opacity : 0.3,
                transparent : true
            } );

            let sphere = new THREE.Mesh(geometry, material);
            sphere.castShadow = true;
            sphere.stoneId = id;
            sphere.isSphere = true;
            sphere.position.x =  stone.x;
            sphere.position.y = stone.y;
            sphere.position.z = stone.z;
            sphere.scale.set(0.4, 0.15, 0.4);
            scene.add(sphere);
            objects.push(sphere);


            let geometry2 = new THREE.SphereGeometry(1, 32, 32);
            //var material2 = new THREE.MeshNormalMaterial( { color: 0xff0000, wireframe: true } );
            var material2 = new THREE.MeshPhongMaterial( {

                //color: 0x0000000,
                specular: 0x404040,
                reflectivity: 0.6,
                shininess: 0.6,
            } );
            let sphereEval = new THREE.Mesh(geometry2, material2);
            sphereEval.castShadow = true;
            sphereEval.stoneId = id;
            sphereEval.isSphereEval = true;
            sphereEval.position.x =  stone.x;
            sphereEval.position.y = stone.y;
            sphereEval.position.z = stone.z;
            sphereEval.scale.set(0.3, 0.3, 0.3);
            //sphereEval.scale.multiplyScalar(3);
            sphereEval.visible=false;
            scene.add(sphereEval);
            objects.push(sphereEval);


            // add outline of last added stone or display that player passed

            let outlineMaterial1 = new THREE.MeshBasicMaterial( { color: 0xf5d122, side: THREE.BackSide } );
            let outlineMesh1 = new THREE.Mesh( geometry, outlineMaterial1 );
            outlineMesh1.position.set(0, 0, 0);
            outlineMesh1.visible = false;
            outlineMesh1.scale.set(0.40, 0.15, 0.4);
            outlineMesh1.scale.multiplyScalar(1.3);
            outlineMesh1.name = "lastStoneAddedOutline";
            scene.add( outlineMesh1 );

            // add highlight for selection stone

            let outlineMaterial2 = new THREE.MeshBasicMaterial( { color: 0x0099ff, side: THREE.BackSide } );
            let outlineMesh2 = new THREE.Mesh( geometry, outlineMaterial2 );
            outlineMesh2.position.set(0, 0, 0);
            outlineMesh2.visible = false;
            outlineMesh2.scale.set(0.40, 0.15, 0.4);
            outlineMesh2.scale.multiplyScalar(1.3);
            outlineMesh2.name = "stoneHighlight";
            scene.add( outlineMesh2 );


            // add liberty sprite to scene
        }
    }
    renderLines(scene) {
        // I'm going to draw edge e(i,j)

        for (let [fromKey,neighbourMap] of this.model.board.adjList){
            let from = this.model.board.at(fromKey);
            for (let [toKey,value] of neighbourMap ){
                let to = this.model.board.at(toKey);

                this.renderLine(scene, from.x, from.y, from.z,
                                       to.x,   to.y,   to.z
                );

            }
        }
    }
    addLightsAndPlane(input_scene) {
        // PLANE CODE
        let floorTex = THREE.ImageUtils.loadTexture("js/assets/floor-wood.jpg");
        //floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
        //floorTex.repeat.set( 100, 100 );

        let plane = new THREE.Mesh(new THREE.BoxGeometry(1000, 1000, 1, 3), new THREE.MeshPhongMaterial({
            //emissive : new THREE.Color( 0.3, 0.3, 0.3 ),
            //emissiveIntensity: 0.5,
            map: floorTex
        }));

        plane.position.y =-80;
        plane.position.z = 0;
        plane.rotation.x = -0.5 * Math.PI;
        plane.receiveShadow = false;
        this.scene.add(plane);





        let spotLight = new THREE.SpotLight(0x404040,0.1);
        this.camera.add(spotLight);
        spotLight.position.set(0,100,0);
        spotLight.distance=1000;
        spotLight.castShadow = true;
        spotLight.shadow.camera.near = 1;
        spotLight.shadow.camera.far = 2000;

        this.scene.add(spotLight);


        if (this.helper===true) {
            let lightHelper = new THREE.SpotLightHelper(spotLight);
            this.scene.add(lightHelper);
        }


        let spotLight2 = new THREE.SpotLight(0x404040,4);
        this.camera.add(spotLight2);
        spotLight2.position.set(0,-10,0);
        spotLight2.target = plane;
        spotLight2.distance=1000;
        spotLight2.castShadow = true;
        spotLight2.angle = 1.5;
        spotLight2.shadow.camera.near = 1;
        spotLight2.shadow.camera.far = 2000;

        this.scene.add(spotLight2);

        if (this.helper===true) {
            let lightHelper2 = new THREE.SpotLightHelper(spotLight2);
            this.scene.add(lightHelper2);
        }

        if (this.helper===true) {
            this.scene.add(new THREE.AxesHelper(10));
        }

    }
    initializeGUI(scene, objects) {

        let topLeftY = this.cameraOrtho.top;
        let topLeftX = this.cameraOrtho.left;
        let width = 256;
        let height =32;
        let passTexture = THREE.ImageUtils.loadTexture("js/assets/passTexture.png");
        //var geometry2 = new THREE.BoxGeometry(4, 1, 0.01);
        let passButton = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.1, 3), new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: passTexture
        }));
        passButton.position.x = topLeftX+width/2;
        passButton.position.y = topLeftY-height*5/2;
        passButton.position.z = 0;
        //passButton.rotation.y = 0.3 * Math.PI;

        //var axisHelper = new THREE.AxisHelper( 512 );
        //passButton.add( axisHelper );
        passButton.isPass = true;
        passButton.name="passButton";
        scene.add(passButton );
        objects.push(passButton );

        // black player bar
        let width2=width/2;
        let height2=height;

        let texture = this.createTexture(width2,height2,"Black captured: "+this.model.blackScore.toString(),'black','white');
        let score1 = new THREE.Mesh(new THREE.BoxGeometry(width2, height2, 0.1, 3), new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: texture
        }));
        score1.position.x = topLeftX+width2/2;
        score1.position.y = topLeftY-height2/2;
        score1.position.z = 0;
        score1.my_width=width2;
        score1.my_height=height2;
        score1.name="blackScore";
        scene.add(score1 );
        objects.push(score1 );






        // white score
        let texture2 = this.createTexture(width2,height2,"White captured: "+this.model.whiteScore.toString(),'white','black');
        let score2 = new THREE.Mesh(new THREE.BoxGeometry(width2, height2, 0.1, 3), new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: texture2
        }));
        score2.position.x = topLeftX+width2*(3/2);
        score2.position.y = topLeftY-height2/2;
        score2.position.z = 0;
        score2.name="whiteScore";
        score2.my_width=width2;
        score2.my_height=height2;
        //score2.rotation.x = -0.5 * Math.PI;
        scene.add(score2);
        objects.push(score2);


        // status bar
        let statusTexture = this.createTexture(width, height,"Status: "+this.model.whiteScore.toString(),'green','black');
        let statusBar = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.1, 3), new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: statusTexture
        }));
        statusBar.position.x =  topLeftX+width/2;
        statusBar.position.y =topLeftY-height*3/2;
        statusBar.my_width=width;
        statusBar.my_height=height;
        statusBar.position.z = 0;
        statusBar.name="statusBar";
        //statusBar.rotation.x = -0.5 * Math.PI;
        scene.add(statusBar);
        objects.push(statusBar);



        var light = new THREE.AmbientLight( 0x404040,15 ); // soft white light
        scene.add( light );


        // add cancel and ack button in the eval phase -> hide them for now


        // status bar
        //let topLeftY = this.cameraOrtho.top;
        //let topLeftX = this.cameraOrtho.left;
        let halfWidth=width/2;
        let ackTexture = this.createTexture(halfWidth, height,"Accept scoring",'green','black');
        let ackButton= new THREE.Mesh(new THREE.BoxGeometry(halfWidth, height, 0.1, 3), new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: ackTexture
        }));
        ackButton.position.x =  topLeftX+halfWidth/2;
        ackButton.position.y =topLeftY-height*5/2;
        ackButton.my_width=halfWidth;
        ackButton.my_height=height;
        ackButton.position.z = 0;
        ackButton.name="ackButton";
        ackButton.visible=false;
        //ackButton.rotation.x = -0.5 * Math.PI;
        scene.add(ackButton);
        objects.push(ackButton);

        //cancel button

        let cancelTexture = this.createTexture(halfWidth, height,"Cancel and resume play",'red','black');
        let cancelButton= new THREE.Mesh(new THREE.BoxGeometry(halfWidth, height, 0.1, 3), new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: cancelTexture
        }));
        cancelButton.position.x =  topLeftX+halfWidth*(3/2);
        cancelButton.position.y =topLeftY-height*5/2;
        cancelButton.my_width=halfWidth;
        cancelButton.my_height=height;
        cancelButton.position.z = 0;
        cancelButton.visible=false;
        cancelButton.name="cancelButton";
        //cancelButton.rotation.x = -0.5 * Math.PI;
        scene.add(cancelButton);
        objects.push(cancelButton);

    }
    createTexture(width,height,input_text,backgroundColor,textColor){
        let text = input_text;

        let bitmap = document.createElement('canvas');
        let g = bitmap.getContext('2d');
        bitmap.width = width;
        bitmap.height =height;
        g.fillStyle = backgroundColor;
        g.fillRect(0, 0, bitmap.width, bitmap.height);
        g.font = 'Bold '+(height/3).toString()+'px Arial';

        g.fillStyle = textColor;
        g.fillText(text,width/20, height*(3/4));
        //g.strokeStyle = 'black';
        //g.strokeText(text, 0, 500);

        // canvas contents will be used for a texture
        let texture = new THREE.Texture(bitmap);
        texture.needsUpdate = true;
        return texture;
    }
    renderLine(scene, x1, y1, z1, x2, y2, z2) {
        let material = new THREE.LineBasicMaterial({
            color: 0xffffff
        });

        let geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(x1, y1, z1),
            new THREE.Vector3(x2, y2, z2),
            new THREE.Vector3(x1, y1, z1)
        );

        let line = new THREE.Line(geometry, material);
        scene.add(line);
    }
    coordsOfSelectedStone(inputEvent) {
        //let returnObject = {x: -1, y: -1};
        let returnObject = {id: -1};
        inputEvent.preventDefault();

        var elem = this.renderer.domElement;
         var   boundingRect = elem.getBoundingClientRect();
         let posx = (inputEvent.clientX-boundingRect.left);
         let posy = (inputEvent.clientY-boundingRect.top);

        console.log(posx.toString()+"  "+posy.toString());

        this.mouse.x = ( posx / this.renderer.domElement.clientWidth ) * 2 - 1;
        this.mouse.y = -( posy / this.renderer.domElement.clientHeight ) * 2 + 1;


        // Test for pass button click
        this.raycaster.setFromCamera(this.mouse, this.cameraOrtho);
        let intersects2 = this.raycaster.intersectObjects(this.objectsUI);
        if (intersects2.length > 0) {
            let object= intersects2[0].object;
            if (object.name  === "passButton"){
                returnObject.id ="p";
                return returnObject;
            }
            else if (object.name  === "ackButton"){
                returnObject.id ="ack";
                return returnObject;
            }
            else if (object.name  === "cancelButton"){
                returnObject.id ="cancel";
                return returnObject;
            }
        }


        //test for stones
        this.raycaster.setFromCamera(this.mouse, this.camera);

        let intersects = this.raycaster.intersectObjects(this.objects);

        if (intersects.length > 0) {
            var stone = intersects[0].object;       // I selected this stone -> I need to get coords
            //returnObject.x = stone.coordX;
            //returnObject.y = stone.coordY;

            if (typeof stone.isPass  !== "undefined"){
                returnObject.id ="p";
            }
            else  if (typeof stone.stoneId  !== "undefined"){
                returnObject.id =stone.stoneId;
            }


        }

        //console.log("who is on the move "+model.blackOnMove.toString());
        return returnObject;
    }
    updateView() {
        if (this.model.gameState==="GAME_ENDED"){
            // write finish screen and who won!

        }
        else if(this.model.gameState==="EVAL_PHASE"){

            //display agree buttons for both players

            // add cancel button so we can go back to playing

             //render territory somehow atop existing stones - we also need to signify that we are in eval phase
            for (let i = 0; i < this.scene.children.length; i++) {
                if (this.scene.children[i].hasOwnProperty('isSphere')) {
                    // draw it according to model
                    let currSphere = this.scene.children[i];
                    //var color = this.model.getPosition(currSphere.coordX, currSphere.coordY).getStoneColor();
                    let stone = this.model.board.at(currSphere.stoneId);
                    if (stone.color === 1) {            //"BLACK"
                        this.scene.children[i].material.color.setRGB(20, 20, 20);
                        //this.scene.children[i].material.opacity = 0.9;
                        this.scene.children[i].material.transparent = false;
                        //scene.children[i].material.op

                    }
                    else if (stone.color === 2) {       //"WHITE"
                        this.scene.children[i].material.color.setRGB(70, 70, 70);
                        //this.scene.children[i].material.opacity = 0.9;
                        this.scene.children[i].material.transparent = false;
                    }
                    else if (stone.color === 0) {         //"BLANK"
                        this.scene.children[i].material.color.setRGB(20, 30, 255);
                        this.scene.children[i].material.opacity = 0.3;
                        this.scene.children[i].material.transparent = true;
                        this.scene.children[i].visible = false;
                    }
                }
            }
            let baf = 0;

            for (let i = 0; i < this.scene.children.length; i++) {
                if (this.scene.children[i].hasOwnProperty('isSphereEval')) {
                    // draw it according to model
                    let currSphereEval = this.scene.children[i];
                    currSphereEval.visible=true;
                    //var color = this.model.getPosition(currSphere.coordX, currSphere.coordY).getStoneColor();
                    let stoneEval = this.model.evalBoard.at(currSphereEval.stoneId);

                    if (stoneEval.color === 1) {            //"BLACK"
                        currSphereEval.material.color.setRGB(10, 10, 10);
                        //currSphereEval.material.opacity = 0.9;
                        currSphereEval.material.transparent = false;
                        //scene.children[i].material.op

                    }
                    else if (stoneEval.color === 2) {       //"WHITE"
                        currSphereEval.material.color.setRGB(50, 50, 50);
                        //currSphereEval.material.opacity = 0.9;
                        currSphereEval.material.transparent = false;
                    }
                    else if (stoneEval.color === 0) {         //"BLANK"
                        this.scene.children[i].material.color.setRGB(20, 30, 255);
                        this.scene.children[i].material.opacity = 0.2;
                        this.scene.children[i].material.transparent = true;
                        //this.scene.children[i].visibility= false;

                    }
                }
            }
            this.showEvalPhase();
            this.updateStatusBar()
        }
        else{
            this.hideEvalPhase();
            this.hideMarkers();

            let blackScore = this.sceneOrtho.getObjectByName("blackScore");
            let width2=blackScore.my_width;
            let height2=blackScore.my_height;
            let newBlackTexture =   this.createTexture(width2,height2,"Black captured: "+this.model.blackScore.toString(),'black','white');
            let blackMaterial = new THREE.MeshPhongMaterial({
                color: 0x3c3c3c,
                map: newBlackTexture
            });
            blackScore.material= blackMaterial;
            //blackScore.map = newBlackTexture;
            blackScore.material.map.needsUpdate = true;



            let whiteScore= this.sceneOrtho.getObjectByName("whiteScore");
            let newWhiteTexture =  this.createTexture(width2,height2,"White captured: "+this.model.whiteScore.toString(),'white','black');
            let whiteMaterial = new THREE.MeshPhongMaterial({
                color: 0x3c3c3c,
                map: newWhiteTexture
            });
            whiteScore.material= whiteMaterial;
            whiteScore.material.map.needsUpdate = true;


            for (let i = 0; i < this.scene.children.length; i++) {
                if (this.scene.children[i].hasOwnProperty('isSphere')) {
                    // draw it according to model
                    let currSphere = this.scene.children[i];
                    currSphere.visible = true;
                    //var color = this.model.getPosition(currSphere.coordX, currSphere.coordY).getStoneColor();
                    let stone = this.model.board.at(currSphere.stoneId);
                    if (stone.color === 1) {            //"BLACK"
                        currSphere.material.color.setRGB(7, 7, 7);
                        currSphere.material.transparent = false;
                    }
                    else if (stone.color === 2) {       //"WHITE"
                        currSphere.material.color.setRGB(50, 50, 50);
                        currSphere.material.transparent = false;
                    }
                    else if (stone.color === 0) {         //"BLANK"
                        currSphere.material.color.setRGB(20, 30, 255);
                        currSphere.material.opacity = 0.2;
                        currSphere.material.transparent = true;
                    }
                }
            }

            let outline= this.scene.getObjectByName("lastStoneAddedOutline");
            // set position of last played stone
            //set visible to true


            if (this.model.lastAddedStoneId!=="p" && this.model.lastAddedStoneId!==-1 ){

                let lastPlayedStone = this.scene.children.find(
                    element => {
                        if (element.hasOwnProperty('isSphere')){
                            if (element.stoneId === this.model.lastAddedStoneId){
                                return true
                            }
                            else{
                                return false;
                            }
                        }
                        else{
                            return false;
                        }
                    }
                );
                outline.position.copy(lastPlayedStone.position);
                outline.visible = true;
            }
            else{
                outline.visible = false;
            }
            this.renderer.render(this.scene, this.camera);
            this.renderer.render(this.sceneOrtho,this.cameraOrtho);

            this.updateStatusBar()
        }
    }
    displayGameEnded(stats){


        let winner = stats.winner;
        let firstScore= stats.firstScore;
        let secondScore= stats.secondScore;

        let winnerMessage="";

        if (winner===1){
            winnerMessage="First Player won";
        }
        else if (winner===2){
            winnerMessage="Second Player won";
        }
        else{
            winnerMessage="Draw! ";
        }


        //remove all sprites and just print one large sprite with who won, and score!
        let width = window.innerWidth;
        let height = window.innerHeight;

        
        let winTexture = this.createTexture(width, height,"",'white','black');
        let winBackground= new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.1, 3), new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: winTexture
        }));
        let topLeftY = this.cameraOrtho.top;
        let topLeftX = this.cameraOrtho.left;
        winBackground.position.x =  0;
        winBackground.position.y =0;
        //winBackground.my_width=halfWidth;
        //winBackground.my_height=height;
        winBackground.position.z = 0 ;
        winBackground.visible=true;
        winBackground.name="winBackground";
        this.sceneOrtho.add(winBackground);

        // then create one clickable button

        let width2=400;
        let height2=50;

        let winButtonTexture = this.createTexture(width2, height2,winnerMessage+", click finish to go back to lobby",'red','black');
        let winButton= new THREE.Mesh(new THREE.BoxGeometry(width2, height2, 0.1, 3), new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: winButtonTexture
        }));
        winButton.position.x = 0 ;
        winButton.position.y =0;
        //winButton.my_width=halfWidth;
        //winButton.my_height=height;
        winButton.position.z = 0;
        winButton.visible=true;
        winButton.name="winButton";
        this.sceneOrtho.add(winButton);


        //this.renderer.render(this.scene, this.camera);
        this.renderer.render(this.sceneOrtho,this.cameraOrtho);

    }
    showEvalPhase(){
        // hide pass button

        let pass= this.sceneOrtho.getObjectByName("passButton");
        pass.visible=false;

        // show buttons
        let ack= this.sceneOrtho.getObjectByName("ackButton");
        ack.visible=true;

        let cancel= this.sceneOrtho.getObjectByName("cancelButton");
        cancel.visible=true;

        //show images that players acked

    }
    hideEvalPhase(){

        //hide  ack and cancel btns
        let ack= this.sceneOrtho.getObjectByName("ackButton");
        ack.visible=false;

        let cancel= this.sceneOrtho.getObjectByName("cancelButton");
        cancel.visible=false;

        let pass= this.sceneOrtho.getObjectByName("passButton");
        pass.visible=true;
    }

    hideMarkers(){
        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i].hasOwnProperty('isSphereEval')) {
                let currSphereEval = this.scene.children[i];
                currSphereEval.visible=false;

            }
        }
    }
    showMarkers(){
        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i].hasOwnProperty('isSphereEval')) {
                let currSphereEval = this.scene.children[i];
                currSphereEval.visible=true;

            }
        }
    }


    updateStatusBar(){

        let statusBar= this.sceneOrtho.getObjectByName("statusBar");
        let width3=statusBar.my_width;
        let height3=statusBar.my_height;

        let message = this.model.selectState + "   "+this.model.gameState;

        let statusTexture = this.createTexture(width3, height3,message,'green','black');
        let statusBarMaterial = new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: statusTexture
        });
        statusBar.material=statusBarMaterial;
        statusBar.material.map.needsUpdate = true;
    }
    updateStatusBar2(message){

        let statusBar= this.sceneOrtho.getObjectByName("statusBar");
        let width3=statusBar.my_width;
        let height3=statusBar.my_height;

        let statusTexture = this.createTexture(width3, height3,message,'green','black');
        let statusBarMaterial = new THREE.MeshPhongMaterial({
            color: 0x3c3c3c,
            map: statusTexture
        });
        statusBar.material=statusBarMaterial;
        statusBar.material.map.needsUpdate = true;
    }
    destroy(){


        //clearScene(this.scene);
        this.animation=false;
        let element = document.getElementById("canvasID");
        element.parentNode.removeChild(element);


        document.removeEventListener('mousedown',this.onWindowResizeMy , false);

        this.scene =null;
        this.raycaster = null;
        this.mouse = null;
        this.camera = null;
        this.objects = null;
        this.model =null;
        this.renderer = null;
    }
    //---BEGIN---- code from lee stemkostki tutorials https://stemkoski.github.io/Three.js/ -------
    makeTextSprite(message, parameters) {
        if (parameters === undefined) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";
        var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 18;
        var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 4;
        var borderColor = parameters.hasOwnProperty("borderColor") ? parameters["borderColor"] : {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0
        };
        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ? parameters["backgroundColor"] : {
            r: 255,
            g: 255,
            b: 255,
            a: 1.0
        };
        var textColor = parameters.hasOwnProperty("textColor") ? parameters["textColor"] : {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0
        };

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;
        var metrics = context.measureText(message);
        var textWidth = metrics.width;

        context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

        context.lineWidth = borderThickness;
        this.roundRect(context, borderThickness / 2, borderThickness / 2, (textWidth + borderThickness) * 1.1, fontsize * 1.4 + borderThickness, 8);

        context.fillStyle = "rgba(" + textColor.r + ", " + textColor.g + ", " + textColor.b + ", 1.0)";
        context.fillText(message, borderThickness, fontsize + borderThickness);

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        //var spriteMaterial = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false } );
        var spriteMaterial = new THREE.SpriteMaterial({map: texture});
        var sprite = new THREE.Sprite(spriteMaterial);
        //sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
        sprite.scale.set(100,50,1.0);
        return sprite;
    }
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    //--- END ---- code from lee stemkostki tutorials https://stemkoski.github.io/Three.js/ -------
}

