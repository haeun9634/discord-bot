import React, { useState } from 'react';
import ChatRoom from './components/ChatRoom';
import ChatRoomsList from './components/ChatRoomsList';

function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);

  // JWT 토큰 (테스트용)
  const token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJob25nIiwidXNlcklkIjo0LCJpYXQiOjE3MzY4Mzc1MzQsImV4cCI6MTczNjg0MTEzNH0.90a2erZUkfh6hPV3_jU_IETpEPROuC5uLuXdKaSXd2gMXQ3rfhB3PfUWq_DccBAt-fIDHp2vhv1-Ds7OpHJCmw';

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
