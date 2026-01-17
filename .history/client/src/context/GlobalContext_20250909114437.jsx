import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import GlobalTheme from "./GlobalTheme";
import { createTheme, useMediaQuery } from "@mui/material";
import { SocketProvider } from "~/context/SocketContext";
import { VideoCallProvider } from "~/context/VideoCallContext";
import {
  notifiSound,
  callSound,
  notifiGlobalSound,
} from "~/assets/RingNotifi/audioNotifi";
import socket from "./SocketInitial";
import { chatReducer, initialChatState } from "./chatReducer";
export const CurrentUser = createContext();
export const useGlobalContext = () => {
  const context = useContext(CurrentUser);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};
export default function GlobalContext({ children }) {
  //info current user
  const [currentUser, setCurrentUser] = useState("");
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  // Theme settings
  const [primaryColor, setPrimaryColor] = useState(
    sessionStorage.getItem("primaryColor") || "rgba(44, 245, 22, 1)"
  );
  const [secondaryColor, setSecondaryColor] = useState(
    sessionStorage.getItem("secondaryColor") || "#2b2925ff"
  );
  const [darkMode, setDarkMode] = useState(
    sessionStorage.getItem("darkMode") === "true"
  );
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: primaryColor },
      secondary: { main: secondaryColor },
    },
  });

  //info device
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Xác định kích thước màn hình mobile
  //chat personna;
  const [messageState, dispatchMessageState] = useReducer(
    chatReducer,
    initialChatState
  );

  useEffect(() => {
    socket.on("personalChat", ({ senderEmail, message }) => {
      dispatchMessageState({
        type: "chat/receive",
        payload: { senderEmail, message },
      });
    });

    return () => {
      socket.off("personalChat");
    };
  }, []);
  useEffect(() => {
    socket.on("newNotifi", () => {
      // dispatchMessageState({
      //   type: "chat/receive",
      //   payload: { senderEmail, message },
      // });
      notifiGlobalSound.play();
      console.log("newNotifi");
    });

    return () => {
      socket.off("newNotifi");
    };
  }, []);
  useEffect(() => {
    socket.on("groupChat", () => {
      // dispatchMessageState({
      //   type: "chat/receive",
      //   payload: { senderEmail, message },
      // });
      notifiGlobalSound.play();
    });

    return () => {
      socket.off("groupChat");
    };
  }, []);
  // callSound.play();
  ///newNotifi
  useEffect(() => {
    function registerSocketEvents(store) {
      socket.on("new_notification", (data) => {
        store.dispatch(addNotification(data));
      });

      socket.on("new_message", (data) => {
        store.dispatch(addMessage(data));
      });

      socket.on("new_group_message", (data) => {
        store.dispatch(addGroupMessage(data));
      });
    }
  }, []);

  function sendMessageToFriend(message) {
    socket.emit("message", message);
    socket.emit("private_message", { senderId: userID, receiverId, message });
    setMessage("");
  }
  socket.on(
    "message",
    (mess) => (setListMessage([...listMessage, mess]), console.log(mess))
  );
  // Nhận tin nhắn riêng tư
  socket.on("private_message", ({ senderId, message }) => {
    setListMessage(() => [...listMessage, message]);
  });
  return (
    <>
      <CurrentUser.Provider
        value={{
          currentUser,
          setCurrentUser,
          currentUserInfo,
          setCurrentUserInfo,
          messageState,
          dispatchMessageState,
          primaryColor,
          secondaryColor,
          darkMode,
          setPrimaryColor,
          setSecondaryColor,
          setDarkMode,
          isMobile,
          notifiSound,
          callSound,
        }}
      >
        <SocketProvider userId={currentUserInfo?.userId}>
          {" "}
          <VideoCallProvider>
            <GlobalTheme theme={theme}>{children}</GlobalTheme>
          </VideoCallProvider>
        </SocketProvider>
      </CurrentUser.Provider>
    </>
  );
}
