import React, { useState } from "react";
import ChatRoom from "./components/ChatRoom";
import ChatRoomsList from "./components/ChatRoomsList";
import Login from "./components/Login";

function App() {
  const [token, setToken] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);

  if (!token) {
    return (
      <Login
        onLogin={(userToken, userId) => {
          setToken(userToken);
          setCurrentUserId(userId);
        }}
      />
    );
  }

  return (
    <div>
      <h1>WebSocket Chat Application</h1>
      {!selectedRoomId ? (
        <ChatRoomsList token={token} onSelectRoom={setSelectedRoomId} />
      ) : (
        <div>
          <ChatRoom
            token={token}
            roomId={selectedRoomId}
            currentUserId={currentUserId}
            receivedMessages={receivedMessages}
            setReceivedMessages={setReceivedMessages}
          />
          <button onClick={() => setSelectedRoomId(null)}>Back to Chat Rooms</button>
        </div>
      )}
    </div>
  );
}

export default App;
