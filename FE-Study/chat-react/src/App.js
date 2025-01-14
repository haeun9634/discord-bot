import React, { useState } from 'react';
import ChatRoom from './components/ChatRoom';
import ChatRoomsList from './components/ChatRoomsList';

function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);

  // JWT 토큰 (테스트용)
  const token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJob25nIiwidXNlcklkIjo0LCJpYXQiOjE3MzY4NDA3NjUsImV4cCI6MTczNjg0NDM2NX0.a4ynTvZ471T1sk7-WHUDNv2kdNGu_dTtJaKiBSUZ8YsHV-v18xSqDCBbDglZARonjvLkn34eshibCeXdwOjdxQ';

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
