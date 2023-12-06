const express = require("express");
const http = require("http");

const app = express();

const server = http.createServer(app);

const socket = require("socket.io");
const io = socket(server);

// Show express from which directory to start
// Serve the static HTML file
app.use(express.static("public"));
app.use(express.static("node_modules/socket.io/client-dist"));

let connectedPeers = [];
let conectedPeersNicNames = [];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "index.html");
});

// Listen for socket connections
io.on("connection", (socket) => {
  connectedPeers.push(socket.id);
  conectedPeersNicNames.push("Empty");

  connectedPeers.forEach(function (element) {
    io.to(element).emit("calleList-update", connectedPeers);
  });

  socket.on("disconnect", () => {
    let indexToRemove = connectedPeers.indexOf(socket.id);
    if (indexToRemove !== -1) {
      connectedPeers.splice(indexToRemove, 1);
      conectedPeersNicNames.splice(indexToRemove, 1);
    }

    // update all useres
    connectedPeers.forEach(function (element) {
      io.to(element).emit("calleList-update", connectedPeers);
      io.to(element).emit("calleList-nickNames-update", conectedPeersNicNames);
    });
  });

  // NickName updated by user Event hendler
  socket.on("user-nickname-update", (data) => {
    const { socketId, userNichName } = data;

    const index = connectedPeers.indexOf(socketId);

    if (index !== -1) {
      conectedPeersNicNames[index] = userNichName;
    }

    // update all useres with nichNames
    connectedPeers.forEach(function (element) {
      io.to(element).emit("calleList-nickNames-update", conectedPeersNicNames);
    });
  });

  socket.on("pre-offer", (data) => {
    const { calleePersonalCode, callType } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === calleePersonalCode
    );

    if (connectedPeer) {
      const data = {
        callerSocketId: socket.id,
        callType: callType,
      };

      io.to(calleePersonalCode).emit("pre-offer", data);
    } else {
      const data = {
        preOfferAnswer: "CALLEE_NOT_FOUND",
      };
      io.to(socket.id).emit("pre-offer-answer", data);
    }
  });

  socket.on("pre-offer-answer", (data) => {
    const { callerSocketId } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === callerSocketId
    );

    if (connectedPeer) {
      io.to(data.callerSocketId).emit("pre-offer-answer", data);
    }
  });

  socket.on("webRTC-signaling", (data) => {
    const { connectedUserSocketId } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit("webRTC-signaling", data);
    }
  });

  socket.on("user-hanged-up", (data) => {
    const { connectedUserSocketId } = data;
    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit("user-hanged-up");
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
