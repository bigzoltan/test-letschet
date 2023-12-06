
console.log("Store  Script loded"); 


export let state = {
    socketId: null,
    localStream: null,
    remoteStream: null,
    screenSharingActive: false,
    screenSharingStream: null,
    allowConnectionsFromStrangers: false,
    callType: null ,
    callInProgress: false ,
    remoteCalleList: [] ,
    remoteCalleListNichNames: [] ,
    userNichName: null ,
  };
  
   export  const setSocketId = (socketId) => {
    state = {
      ...state,
      socketId : socketId ,
    };
   
  };

 
export const setLocalStream = (stream) => {
  state = {
    ...state,
    localStream: stream,
  };
};

export const setAllowConnectionsFromStrangers = (allowConnection) => {
  state = {
    ...state,
    allowConnectionsFromStrangers: allowConnection,
  };
};

export const setScreenSharingActive = (screenSharingActive) => {
  state = {
    ...state,
    screenSharingActive,
  };
};

export const setScreenSharingStream = (stream) => {
  state = {
    ...state,
    screenSharingStream: stream,
  };
};

export const setRemoteStream = (stream) => {
  state = {
    ...state,
    remoteStream: stream,
  };
};

export const setcallInProgress = (callInProgress) => {
  state = {
    ...state,
    callInProgress: callInProgress,
  };
};


export const setremoteCalleList = (remoteCalleList) => {
  state = {
    ...state,
    remoteCalleList: remoteCalleList,
  };
};

export const setRemoteCalleListNichNames = (remoteCalleListNichNames) => {
  state = {
    ...state,
    remoteCalleListNichNames: remoteCalleListNichNames ,
  };
};

export const getState = () => {
  return state;
};
