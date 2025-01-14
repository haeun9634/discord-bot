import React, { useState } from 'react';
import ChatRoom from './components/ChatRoom';
import ChatRoomsList from './components/ChatRoomsList';

function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);

  // JWT 토큰 (테스트용)
  const token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJob25nIiwidXNlcklkIjo0LCJpYXQiOjE3MzY3ODI4MzgsImV4cCI6MTczNjc4NjQzOH0.ILNrtAHGAIl6DsKLQcpGAWlamHycGjmSEkU_TsR18WbFv36S6z7B-rGAKtl0FCk6TeHHxPULNEhoGSLfzSupXQ';

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
