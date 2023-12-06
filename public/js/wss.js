import * as store from "./store.js";
import * as ui from "./ui.js";
import * as webRTCHandler from "./webRTCHandler.js";
import * as constants from "./constants.js";
import * as main from "./main.js";

let socketIo = null;
export const registerSocketEvents = (socket) => {
  socket.on("connect", () => {
    socketIo = socket;
    console.log("succesfully connected to socket.io server");
    console.log(socket.id);
    document.title = "Socketid -> " + socket.id;
    store.setSocketId(socket.id);
    ui.updatePersonalCode(socket.id);
    store.state.remoteCalleListNichNames.length = 0;
    store.state.remoteCalleList.length = 0 ;
  });

  socket.on("calleList-update", (data) => {
    //console.log("Update ->" , data)
    store.setremoteCalleList(data);
    console.log("Update ->", store.state.remoteCalleList);
    main.updateCalleList();
  });

  socket.on("calleList-nickNames-update", (data) => {
    store.setRemoteCalleListNichNames(data);
    console.log("Remote nick names was set ->" , store.state.remoteCalleListNichNames)
    main.updateCalleList();
  });

  socket.on("pre-offer", (data) => {
    webRTCHandler.handlePreOffer(data);
  });

  socket.on("pre-offer-answer", (data) => {
    webRTCHandler.handlePreOfferAnswer(data);
  });

  socket.on("user-hanged-up", () => {
    webRTCHandler.handleConnectedUserHangedUp();
  });

  socket.on("webRTC-signaling", (data) => {
    switch (data.type) {
      case constants.webRTCSignaling.OFFER:
        webRTCHandler.handleWebRTCOffer(data);
        break;
      case constants.webRTCSignaling.ANSWER:
        webRTCHandler.handleWebRTCAnswer(data);
        break;
      case constants.webRTCSignaling.ICE_CANDIDATE:
        webRTCHandler.handleWebRTCCandidate(data);
        break;
      default:
        return;
    }
  });
};

//  Sent Event to App.js (node)
export const sendPreOffer = (data) => {
  console.log("data ->", data);
  socketIo.emit("pre-offer", data);
};

export const sendPreOfferAnswer = (data) => {
  socketIo.emit("pre-offer-answer", data);
};

export const sendDataUsingWebRTCSignaling = (data) => {
  socketIo.emit("webRTC-signaling", data);
};

export const sendUserHangeUp = (data) => {
  socketIo.emit("user-hanged-up", data);
};

export const sendUserNichNameUpdate = (data) => {
  socketIo.emit("user-nickname-update", data);
};
