const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "public")));

let socketsConnected = new Set();
let players = new Set();
let pX = "";
let pO = "";
let turns = 0;

io.on("connection", onConnect);

function onConnect(socket) {
  console.log(`Client connected: ${socket.id}`);
  socketsConnected.add(socket.id);

  io.emit("clients-total", socketsConnected.size);

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
    socketsConnected.delete(socket.id);
  });

  socket.on("join", (data) => {
    if (data == null) {
      return;
    }
    if (players.size < 2) {
      players.add(data);
      if (players.size % 2) {
        console.log(`player ${data} is now player X`);
        pX = data;
      } else {
        console.log(`player ${data} is now player O`);
        pO = data;
      }
    } else {
      if (!players.has(data)) {
        console.log("Player limit full");
        socket.emit("full", "Game is full");
      } else {
        return;
      }
    }
  });

  socket.on("buttonClicked", (playerID, buttonID) => {
    if (players.has(playerID)) {
      const coordinates = getCoordinates(buttonID)
      if (playerID == pX && turns % 2 == 0) {
        //console.log(`buttonID: ${buttonID} coords: ${coordinates.x},${coordinates.y} symbol: ${checkCoord(coordinates.x, coordinates.y))}`)
        if (checkCoord(coordinates.x, coordinates.y) == null) {
          io.emit("clickMsg", "X", buttonID);
          setSymbol(coordinates.x, coordinates.y, "X");
          turns++
        }
        else{
          return
        }
      } else if (playerID == pO && turns % 2 == 1) {
        //console.log(`buttonID: ${buttonID} coords: ${coordinates.x},${coordinates.y} symbol: ${checkCoord(coordinates.x, coordinates.y))}`)
        if (checkCoord(coordinates.x, coordinates.y) == null) {
          io.emit("clickMsg", "O", buttonID);
          setSymbol(coordinates.x, coordinates.y, "O");
          turns++
        }
        else{
          return
        }
      } else {
        return;
      }
    } else {
      return;
    }
  });

  socket.on("rightclick", () => {
    for (let i = 1; i < 4; i++) {
      for (let k = 1; k < 4; k++) {
        console.log(checkCoord(i, k));
      }
      console.log(" ");
    }
  });

  socket.on("clear", () => {
    players.clear();
    field.clear();
    combinations.splice(0, combinations.length);
    pX = "";
    pO = "";
    turns = 0;

    for (let i = 1; i <= 9; i++) {
      io.emit("clickMsg", "", i);
    }
  });
}

const field = new Set();
const combinations = [];

function checkCoord(X, Y) {
  for (const [x, y, symbol] of combinations) {
    if (x == X && y == Y) {
      return symbol;
    }
  }
  return null;
}

function getCoordinates(id) {
  if (id < 1 || id > 9) {
    return null;
  }

  const x = Math.floor((id - 1) / 3) + 1;
  const y = ((id - 1) % 3) + 1;

  return { x, y };
}

function checkWin(symbol) {
  //Columns
  if (
    checkCoord(1, 1) == symbol &&
    checkCoord(1, 2) == symbol &&
    checkCoord(1, 3) == symbol
  ) {
    winner(symbol);
  } else if (
    checkCoord(2, 1) == symbol &&
    checkCoord(2, 2) == symbol &&
    checkCoord(2, 3) == symbol
  ) {
    winner(symbol);
  } else if (
    checkCoord(3, 1) == symbol &&
    checkCoord(3, 2) == symbol &&
    checkCoord(3, 3) == symbol
  ) {
    winner(symbol);
  }

  //Rows
  else if (
    checkCoord(1, 1) == symbol &&
    checkCoord(2, 1) == symbol &&
    checkCoord(3, 1) == symbol
  ) {
    winner(symbol);
  } else if (
    checkCoord(1, 2) == symbol &&
    checkCoord(2, 2) == symbol &&
    checkCoord(3, 2) == symbol
  ) {
    winner(symbol);
  } else if (
    checkCoord(1, 3) == symbol &&
    checkCoord(2, 3) == symbol &&
    checkCoord(3, 3) == symbol
  ) {
    winner(symbol);
  }

  //Across
  else if (
    checkCoord(1, 1) == symbol &&
    checkCoord(2, 2) == symbol &&
    checkCoord(3, 3) == symbol
  ) {
    winner(symbol);
  } else if (
    checkCoord(3, 1) == symbol &&
    checkCoord(2, 2) == symbol &&
    checkCoord(1, 3) == symbol
  ) {
    winner(symbol);
  } else {
    return;
  }
}

function winner(symbol) {
  io.emit("winner", `PLAYER '${symbol}' WON`);
}

function setSymbol(x, y, symbol) {
  const coords = `${x},${y}`;
  if (field.has(coords)) {
    console.log("This tile is already taken");
    return;
  } else {
    field.add(coords);
    combinations.push([x, y, symbol]);
    console.log(`Added combination: [${x}, ${y}, '${symbol}']`);
    checkWin(symbol);
  }
}
