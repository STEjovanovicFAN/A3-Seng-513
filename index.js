var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var nickNames = ["Bo-Dar", "Sprog", "Clunk", "Grinner", "Black Finger", "Nux", "Mudguts"];
var nickNamesCounter = 0;
var uniqueUsers = [];
var DEFAULT_COLOR = "000000";
var onlineUsers = [];
var connSockets = [];
var chatHistory = [];
var boldChatHistory = [];

//if local host tryes to access server, send it the index html
//need  to send a name as well
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//listen for client msg, if it gets a message broadcast to all clients
io.on('connection', function(socket){
  socket.on('chat message', function(msg, user, color){
    var split = msg.split(" ");
    var name;
    //if its a command for "/nick"
    if(split[0] === "/nick"){
      name = split[1];
      var check = false;
      //check if the names taken
      for(var i = 0; i < uniqueUsers.length; i++){
        if(uniqueUsers[i] === name){
          check = true;
        }
      }

      //if name is unique send it out and store it
      if(check === false){
        //find index
        var index = onlineUsers.indexOf(user);
        //update index
        onlineUsers[index] = name;
        //update the online users list to everyone
        io.emit('onUsers', onlineUsers);

        //also update unique users
        var index2 = uniqueUsers.indexOf(user);
        uniqueUsers[index2] = name;

        //uniqueUsers.push(name);
        socket.emit('name', name);
      }
    }

    //if its a request to change the color
    else if(split[0] === "/nickcolor") {
      var newColor = split[1];
      //set the new color for this user to be the new color
      socket.emit('color', newColor);
    }

    //otherwise its a message
    else{
      var person = user;
      var date = new Date();
      var hour = date.getHours();
      var min = date.getMinutes();

      //if min
      if (min < 10){
        min = "0" + min;
      }
      io.emit('chat message', msg, hour, min, person, color);
    }
  });

  //store chat string inside the array
  socket.on('store message',function(fullMessage, boldMessage){
    chatHistory.push(fullMessage);
    boldChatHistory.push(boldMessage);
  });

});

//check if the user is connected or disconnected
io.on('connection', function(socket){
  //print that user is connected when the user connects
  console.log("a user connected");
  //store the socket
  connSockets.push(socket);

  //generate a nickname for the user
  var name = nickNames[nickNamesCounter];
  nickNamesCounter += 1;
  console.log(name);
  //log the nickname
  uniqueUsers.push(name);
  onlineUsers.push(name);

  //send the nickname to the user
  socket.emit('name', name, DEFAULT_COLOR, chatHistory, boldChatHistory);

  //update the online users list to everyone
  io.emit('onUsers', onlineUsers);

  //when the user disconnects take him off the onlineUser list
  socket.on('disconnect', function(){
    console.log('user disconnected');
    //console.log("user that dc'ed " + user);

    //find the socket index
    var index = connSockets.indexOf(socket);
    //remove from the onlineUsers and connSockets list
    connSockets.splice(index,1);
    onlineUsers.splice(index,1);

    //update the list
    io.emit('onUsers', onlineUsers);
  });
});

//print message on command prompt to signal that the server is running
http.listen(port, function(){
  console.log('listening on: ' + port);
});
