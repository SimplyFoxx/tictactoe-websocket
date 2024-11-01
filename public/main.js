const socket = io("localhost:4000", {});

const playField = document.getElementById("field");
const playButton = document.getElementById("play-button");
const pageTop = document.getElementById("page-top");
const buttons = playField.querySelectorAll("button");

playField.addEventListener("submit", (e) => {
  e.preventDefault();
});

buttons.forEach((button) => {
  button.addEventListener("click", function (event) {
    socket.emit("buttonClicked", socket.id, event.target.id);
  });
});

socket.on("clickMsg", (msg, butID) => {
  setSymbolToButton(butID, msg);
});

function setSymbolToButton(buttonID, symbol) {
  document.getElementById(buttonID).textContent = symbol;
}

function sendCoords(x, y) {
  socket.emit("buttonPress", x, y, socket.id);
}

playButton.addEventListener("submit", (e) => {
  e.preventDefault();
  socket.emit("join", socket.id);
});
playButton.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  socket.emit("rightclick", e);
});

socket.on("full", (msg) => {
  element = `
        <h2 id="player-limit">${msg}</h2>
    `;
  pageTop.insertAdjacentHTML("beforeend", element);
  setTimeout(deleteFullMsg, 2500);
});

socket.on("winner", (winner) => {
  element = `
        <h2 id="winner-text">${winner}</h2>
    `;
  pageTop.insertAdjacentHTML("beforeend", element);
  setTimeout(clearField, 4000);
});

function deleteFullMsg() {
  document.querySelectorAll("h2#player-limit").forEach((element) => {
    element.parentNode.removeChild(element);
  });
}
function clearField() {
  document.querySelectorAll("h2#winner-text").forEach((element) => {
    element.parentNode.removeChild(element);
  });
  document.querySelectorAll("h2#player-limit").forEach((element) => {
    element.parentNode.removeChild(element);
  });
  socket.emit("clear", null);
}
