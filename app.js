const express = require('express');
const http = require('http');


const app = express();
const fs = require('fs');




const server = http.createServer(app);


const socket = require('socket.io');
const io = socket(server);

// Show express from which directory to start 
// Serve the static HTML file
app.use(express.static('public'));
app.use(express.static('node_modules/socket.io/client-dist'));

let connectedPeers = [] ;

app.get('/', (req, res) => {
 
  res.sendFile(__dirname + 'index.html');
});



// Listen for socket connections
io.on('connection', (socket) => {
  console.log('A user connected');
 // console.log(socket.id) ;
  connectedPeers.push(socket.id);
  console.log(connectedPeers) ;

    

 socket.on('disconnect', () => {
   console.log('User disconnected ');

   let indexToRemove = connectedPeers.indexOf(socket.id);
   if (indexToRemove !== -1) connectedPeers.splice(indexToRemove, 1);
   console.log(connectedPeers) ;
  });

  socket.on('pre-offer' , (data) => {
    console.log("pre-offer Event arive ") ;
    console.log(data) ;
    const { calleePersonalCode, callType } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === calleePersonalCode
    );

    console.log("ID exist -> " , connectedPeer);
    
    if (connectedPeer) {
      const data = {
        callerSocketId: socket.id,
        callType: callType ,
      };

      console.log("target ID  -> " , data);
      console.log("calleePersonalCode ->" , calleePersonalCode)
      io.to(calleePersonalCode).emit("pre-offer", data);
    }
    else {
      const data = {
        preOfferAnswer: "CALLEE_NOT_FOUND",
      };
      io.to(socket.id).emit("pre-offer-answer", data);
    }

  });


  socket.on("pre-offer-answer", (data) => {
    console.log("answer rexived - >" , data)
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


});
  



// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
