import * as store from "./store.js";
import * as ui from "./ui.js";
import * as  webRTCHandler from "./webRTCHandler.js"
import * as constants from "./constants.js"

let socketIo =  null ;  
export const registerSocketEvents = (socket) => {
socket.on("connect", () => {
    socketIo =  socket ;  
    console.log("succesfully connected to socket.io server");
    console.log(socket.id);
    document.title ="Socketid -> " + socket.id ;
    store.setSocketId(socket.id) ;
    ui.updatePersonalCode(socket.id) ;
  });

  socket.on("pre-offer", (data) => {
    webRTCHandler.handlePreOffer(data);
  });

  socket.on("pre-offer-answer", (data) => {
    webRTCHandler.handlePreOfferAnswer(data);
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

}


export const  sendPreOffer = (data) => {
    console.log("data ->" , data )
    socketIo.emit('pre-offer' , data) ;
} ;

export const sendPreOfferAnswer = (data) => {
  socketIo.emit("pre-offer-answer", data);
};

export const sendDataUsingWebRTCSignaling = (data) => {
  socketIo.emit("webRTC-signaling", data);
};


