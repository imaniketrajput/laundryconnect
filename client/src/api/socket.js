import { io } from "socket.io-client";

const socket = io("https://laundryconnect-api.onrender.com", {
  autoConnect: false, 
});

export default socket;