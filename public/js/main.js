//import { setSocketId } from './store.js';
import * as store from "./store.js";
import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as webRTCHandler from "./webRTCHandler.js";
import * as ui from "./ui.js";
import * as recordingUtils from "./recordingUtils.js";

const socket = io("/");
webRTCHandler.getLocalPreview();

console.log("Main Script loded");
wss.registerSocketEvents(socket);

//register event listener for personal code copy button
const personalCodeCopyButton = document.getElementById(
  "personal_code_copy_button"
);
personalCodeCopyButton.addEventListener("click", () => {
  const personalCode = store.getState().socketId;
  // get the socketId  and copy to the clipboard
  navigator.clipboard && navigator.clipboard.writeText(personalCode);
});

// register event listeners for connection buttons

const personalCodeChatButton = document.getElementById(
  "personal_code_chat_button"
);

const personalCodeVideoButton = document.getElementById(
  "personal_code_video_button"
);

personalCodeChatButton.addEventListener("click", () => {
  console.log("chat button clicked");
  store.state.callType = constants.callType.CHAT_PERSONAL_CODE;
  const calleePersonalCode = document.getElementById(
    "personal_code_input"
  ).value;
  const callType = constants.callType.CHAT_PERSONAL_CODE;

  webRTCHandler.sendPreOffer(callType, calleePersonalCode);

  // wss.sendPreOffer({callType, calleePersonalCode}) ;
});

personalCodeVideoButton.addEventListener("click", () => {
  console.log("video button clicked");
  store.state.callType = constants.callType.VIDEO_PERSONAL_CODE;
  const calleePersonalCode = document.getElementById(
    "personal_code_input"
  ).value;
  const callType = constants.callType.VIDEO_PERSONAL_CODE;

  webRTCHandler.sendPreOffer(callType, calleePersonalCode);
});

// event listeners for video call buttons

const micButton = document.getElementById("mic_button");
micButton.addEventListener("click", () => {
  const localStream = store.getState().localStream;
  const micEnabled = localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = !micEnabled;
  ui.updateMicButton(micEnabled);
});

const cameraButton = document.getElementById("camera_button");
cameraButton.addEventListener("click", () => {
  const localStream = store.getState().localStream;
  const cameraEnabled = localStream.getVideoTracks()[0].enabled;
  localStream.getVideoTracks()[0].enabled = !cameraEnabled;
  ui.updateCameraButton(cameraEnabled);
});

// Move local video
var draggableElement = document.getElementById("local_video");
var offsetX, offsetY;

draggableElement.addEventListener("mousedown", function (e) {
  console.log("Mouse Down  ->");
  // Store the initial mouse position
  offsetX = e.clientX - draggableElement.getBoundingClientRect().left;
  offsetY = e.clientY - draggableElement.getBoundingClientRect().top;

  // Change the cursor style
  draggableElement.style.cursor = "grabbing";

  // Add event listeners for moving and releasing the element
  document.addEventListener("mousemove", moveElement);
  document.addEventListener("mouseup", releaseElement);
});

// Function to move the element
function moveElement(e) {
  console.log("Mouse moving ->");
  draggableElement.style.left = e.clientX - offsetX - 500 + "px";
  draggableElement.style.top = e.clientY - offsetY - 30 + "px";
}

// Function to release the element
function releaseElement() {
  console.log("Mouse up ->");
  // Remove event listeners
  document.removeEventListener("mousemove", moveElement);
  document.removeEventListener("mouseup", releaseElement);

  // Reset cursor style
  draggableElement.style.cursor = "grab";
}

const switchForScreenSharingButton = document.getElementById(
  "screen_sharing_button"
);
switchForScreenSharingButton.addEventListener("click", () => {
  const screenSharingActive = store.getState().screenSharingActive;
  webRTCHandler.switchBetweenCameraAndScreenSharing(screenSharingActive);
});

const remoteVideo = document.getElementById("remote_video");

let isFullScreen = false;

remoteVideo.addEventListener("dblclick", () => {
  if (!isFullScreen) {
    if (remoteVideo.requestFullscreen) {
      remoteVideo.requestFullscreen();
    }

    isFullScreen = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }

    isFullScreen = false;
  }
});

// messenger

const newMessageInput = document.getElementById("new_message_input");
newMessageInput.addEventListener("keydown", (event) => {
  console.log("change occured");
  const key = event.key;

  if (key === "Enter") {
    webRTCHandler.sendMessageUsingDataChannel(event.target.value);
    ui.appendMessage(event.target.value, true);
    newMessageInput.value = "";
  }
});

const sendMessageButton = document.getElementById("send_message_button");
sendMessageButton.addEventListener("click", () => {
  const message = newMessageInput.value;
  webRTCHandler.sendMessageUsingDataChannel(message);
  ui.appendMessage(message, true);
  newMessageInput.value = "";
});

// recording

const startRecordingButton = document.getElementById("start_recording_button");
startRecordingButton.addEventListener("click", () => {
  recordingUtils.startRecording();
  ui.showRecordingPanel();
});

const stopRecordingButton = document.getElementById("stop_recording_button");
stopRecordingButton.addEventListener("click", () => {
  recordingUtils.stopRecording();
  ui.resetRecordingButtons();
});

const pauseRecordingButton = document.getElementById("pause_recording_button");
pauseRecordingButton.addEventListener("click", () => {
  recordingUtils.pauseRecording();
  ui.switchRecordingButtons(true);
});

const resumeRecordingButton = document.getElementById(
  "resume_recording_button"
);
resumeRecordingButton.addEventListener("click", () => {
  recordingUtils.resumeRecording();
  ui.switchRecordingButtons();
});

// hang up
const hangUpButton = document.getElementById("hang_up_button");
hangUpButton.addEventListener("click", () => {
  webRTCHandler.handleHangUp();
});
const hangUpChatButton = document.getElementById("finish_chat_call_button");
hangUpChatButton.addEventListener("click", () => {
  webRTCHandler.handleHangUp();
});

//  Handle Remote conaction list

var selectElement = document.getElementById("RemoteConactions");

// Add a new option dynamically
function addSocketItem(fruitName) {
  var option = document.createElement("option");
  option.value = fruitName;
  option.text = fruitName;
  selectElement.add(option);
}

export function updateCalleList() {
  console.log(
    "store.state.remoteCalleListNichNames ->",
    store.state.remoteCalleListNichNames
  );
  selectElement.innerHTML = "";
  store.state.remoteCalleListNichNames.forEach(function (element) {
    console.log(element);
    if (element !== store.state.userNichName && element !== "Empty") addSocketItem(element);
  });

  if (selectElement.options[0] != null) {
    selectElement.options[0].selected = true;
    selectElement.focus();
  }
}

var selectElement = document.getElementById("RemoteConactions");
var inputElement = document.getElementById("personal_code_input");

// Add event listener to the change event of the select element
selectElement.addEventListener("change", function () {
  let selectedSocketIndex = store.state.remoteCalleListNichNames.indexOf(selectElement.value);
  console.log("Index" ,selectedSocketIndex) ;
   if (selectedSocketIndex != -1 ) {
     console.log("testpoint" ,store.state.remoteCalleList[selectedSocketIndex])
     inputElement.value =  store.state.remoteCalleList[selectedSocketIndex]
   }
  
});

selectElement.addEventListener("click", function () {
  
  let selectedSocketIndex = store.state.remoteCalleListNichNames.indexOf(selectElement.value);
 console.log("Index" ,selectedSocketIndex) ;
  if (selectedSocketIndex != -1 ) {
    console.log("testpoint" ,store.state.remoteCalleList[selectedSocketIndex])
    inputElement.value =  store.state.remoteCalleList[selectedSocketIndex]
  }
 
});

selectElement.addEventListener("keydown", function (event) {
  if (event.key === "Enter" || event.code === "Enter") {
    let selectedSocketIndex = store.state.remoteCalleListNichNames.indexOf(selectElement.value);
    console.log("Index" ,selectedSocketIndex) ;
     if (selectedSocketIndex != -1 ) {
       console.log("testpoint" ,store.state.remoteCalleList[selectedSocketIndex])
       inputElement.value =  store.state.remoteCalleList[selectedSocketIndex]
     }
  }
});

var nicNameParagraph = document.getElementById("personal_code_title_paragraph");
var nicNameText = document.getElementById("nickName");

nicNameText.addEventListener("click", function () {
  if (nicNameText.value != "") {
    nicNameParagraph.innerHTML = nicNameText.value;
    store.state.userNichName = nicNameText.value;
    nicNameText.value = "";
  }
});

nicNameText.addEventListener("keydown", function (event) {
  if (event.key === "Enter" || event.code === "Enter") {
    if (nicNameText.value != "") {
      nicNameParagraph.innerHTML = nicNameText.value;
      store.state.userNichName = nicNameText.value;
      nicNameText.value = "";
    }
  }
});

var publishButton = document.getElementById("publish_nichname");
publishButton.addEventListener("click", function () {
  if (nicNameText.value != "") {
    nicNameParagraph.innerHTML = nicNameText.value;
    store.state.userNichName = nicNameText.value;
    nicNameText.value = "";
    store.state.remoteCalleListNichNames.length = 0;
    publishNichMame();
  }
});

export function publishNichMame() {
  const data = {
    socketId: store.state.socketId,
    userNichName: store.state.userNichName,
  };
  wss.sendUserNichNameUpdate(data);
}
