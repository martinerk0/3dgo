# 3dgo
Client server app that allows you play 3d go and other games in browser. <br>

Written in ES2015 Javascript, python and  C++. <br>

[You can play current build here](http://3dgo.martincerven.com) <br>

#### How to play: <br>
 Select type of game which you want to play and click create new game or join existing game.
 After that play valid moves until game finishes or click


#### It is composed of: <br>
 - server lobby that lets clients create 1 vs AI game or 1vs1 with another human player <br>
 - AI client that spawns Python/C++ process  <br>
 - 3d rendering using three.js <br>
 
 #### Supported browsers: <br>
 - latest Chrome <br>
 - latest Safari <br>
 - latest Firefox with <b>dom.moduleScripts.enabled</b> flag enagled in <b>about:config</b>  <br>
 
 #### How to add another game: <br>
 While primarily meant for 3dgo, you can add any game by implementing Game controller, Model and View for your game.
