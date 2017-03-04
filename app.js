var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
// var http = require('http')
// var io = require('socket.io');


var app = express();
// var server = http.Server(app);
// var websocket = io(server);
//
// websocket.on('connection', (socket) => {
//   console.log('A client just joined on', socket.id);
// });
//
// io.on('updateBoard', (newBoard) => {
//   // Save the message document in the `messages` collection.
//   // db.collection('messages').insert(message);
//
//   // The `broadcast` allows us to send to all users but the sender.
//   socket.broadcast.emit('updateBoard', board);
// });
// server.listen(3000, () => console.log('listening on *:3000'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// app.use(logger('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

var initialBoardLayout=[]
var isDefeated = false;
var winner;
var spy = {value: 'S', team: 'red'}
var att = {value: 6, team: 'blue'}
var def = {value: 3, team: 'red'}
var bomb = {value: 'B', team: 'blue'}
var board= [ ["", "","","","","","",""],
             ["", "","","","","","",""],
             ["", "","","","","","",""],
             ["", "","","","","","",""],
             ["", "","","","","","",""],
             ["", "","","","","","",""],
             ["", "","","","","","",""],
             ["", "","","","","","",""],
]
var currentPlayer = 'red';
function transpose(arr,arrLen) {
  for (var i = 0; i < arrLen; i++) {
    for (var j = 0; j <i; j++) {
      //swap element[i,j] and element[j,i]
      var temp = arr[i][j];
      arr[i][j] = arr[j][i];
      arr[j][i] = temp;
    }
  }
  return arr;
}
// var nextPlayer = function(){
//   return (currentPlayer === 'red') ? 'blue' : 'red'
// }
var updatePos = function(position1, position2){
  console.log('update')
  initialPiece = board[position1.row][position1.col];
  board[position2.row][position2.col] = initialPiece;
  board[position1.row][position1.col] = "";
  return board;
}
var battle = function(position1, position2) {
  var attacker = board[position1.row][position1.col];
  var defender = board[position2.row][position2.col];
  console.log('attacker', attacker)
  console.log('defender', defender)
  if (defender.value === 'F') {
    isDefeated = true;
    var winner = (defender.team === 'red') ? 'blue':'red'
    return attacker.value
  }
  if (defender.value === 'B') {
    if(attacker.value === 3) {
      board[position2.row][position2.col] = "";
      updatePos(position1, position2);
      return attacker.value.toString()
    }else{
      board[position1.row][position1.col] = "";
      board[position2.row][position2.col] = "";
      return attacker.value.toString()
    }
  }
  if (attacker.value === 'S') {
    board[position2.row][position2.col] =  "";
    updatePos(position1, position2);
    return attacker.value.toString()
  }
  if (defender.value === 'S') {
    console.log('spy defender')
    board[position2.row][position2.col] = "";
    updatePos(position1, position2);
    return attacker.value.toString()
  }
  if (attacker.value > defender.value) {
    board[position2.row][position2.col] = "";
    updatePos(position1, position2);
    return attacker.value.toString()
  } else {
    board[position1.row][position1.col] = "";
    return defender.value.toString()
  }
}
var makeMove = function(position, direction){
console.log('direction:',direction)
  if (direction === 'up') {
    console.log('up')
    if (board[position.row - 1][position.col] === "") {
      return updatePos({row: position.row, col: position.col},{row: position.row - 1, col: position.col});
    } else{
      return battle({row: position.row, col: position.col}, {row: position.row - 1, col: position.col})
    }
  }  if (direction === 'down') {
    console.log('down')
    if (board[position.row + 1][position.col] === "") {
      return updatePos({row: position.row, col: position.col},{row: position.row + 1, col: position.col});
    } else{
      return battle({row: position.row, col: position.col}, {row: position.row + 1, col: position.col})
    }
  }  if (direction === 'left') {
    console.log('left')
    if(board[position.row][position.col-1] === "") {
      return updatePos({row: position.row, col: position.col},{row: position.row, col: position.col - 1});
    } else{
      return battle({row: position.row, col: position.col}, {row: position.row , col: position.col - 1})
    }
  } if (direction === 'right') {
    console.log('right')
    if(board[position.row][position.col+1] === "") {
      return updatePos({row: position.row, col: position.col},{row: position.row, col: position.col + 1});
    } else{
      return battle({row: position.row, col: position.col}, {row: position.row, col: position.col + 1})
    }
  }
}
var checkValidMove=function(pos1,pos2) {
  if (pos2.row-pos1.row === 1) {
    return 'down'
  }
  if (pos2.row-pos1.row === -1) {
    return 'up'
  }
  if (pos2.col-pos1.col === 1) {
      return 'left'
    }
    if (pos2.col-pos1.col === -1) {
      return 'right'
  }
  return 'illegal move'
}
app.get('/',function(req,res) {
  res.send('hello world')
})

app.post('/test', function(req, res){
  console.log('body', req.body)

  res.json({
    final: 'hey'
  })
})
app.post('/setupboard',function(req,res) {
  newBoard = req.body.board;
  boardTranspose = transpose(newBoard, 8);
  board = newBoard;
  res.json('true');
})
app.post('/makemove', function(req, res) {
  console.log(req.body)
  var moves = req.body.move;
  var pos2 = moves[1];
  var pos1 = moves[0];
  var direction = checkValidMove(pos1,pos2);
  if(direction==='illegal move') {
    res.json({
      board: transpose(board),
      currentPlayer: currentPlayer,
      move: [pos1]
    });
  };

  var newboard = makeMove(pos1,direction);
  console.log(newboard)
  var nextPlayerVal = 'blue' //nextPlayer()
  // res.send(newboard);
  res.json({
    board: newboard,
    currentPlayer: nextPlayerVal,
    move: []
  });
})

app.listen(process.env.PORT||3000)
