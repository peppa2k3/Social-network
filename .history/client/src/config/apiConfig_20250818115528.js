// import { io } from "socket.io-client";
const URL_Socket = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const URL_recommendSystem =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/";
//import.meta.env.VITE_API_BASE_URL || "https://hai2806.pythonanywhere.com/";
// export const socket = io(URL);
//RESTFUl API backend
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/";

export { API_BASE_URL, URL_Socket, URL_recommendSystem };
