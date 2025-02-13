import React, { useState } from "react";
import ChatRoom from "./components/ChatRoom";
import ChatRoomsList from "./components/ChatRoomsList";
import Login from "./components/Login";

const App = () => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);

  const handleLogin = (token, userId, username) => {
    console.log("App: Received login data:", { token, userId, username });
    setToken(token);
    setUserId(userId);
    setUsername(username);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  
  return (
    <div>
      <h1>Welcome, {username}</h1>
      {currentRoomId ? (
        <div>
          {/* ChatRoom Component */}
          <ChatRoom
            token={token}
            roomId={currentRoomId}
            userId={userId}
            username={username}
            receivedMessages={receivedMessages}
            setReceivedMessages={setReceivedMessages}
          />
          {/* Button to return to ChatRoomsList */}
          <button
            onClick={() => setCurrentRoomId(null)}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Back to Chat Rooms
          </button>
        </div>
      ) : (
        <ChatRoomsList token={token} onSelectRoom={setCurrentRoomId} />
      )}
    </div>
  );
};

export default App;