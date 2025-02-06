import React, { useState } from "react";
import ChatRoom from "./components/ChatRoom";
import ChatRoomsList from "./components/ChatRoomsList";
import Login from "./components/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App = () => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [studentNumber, setStudentNumber] = useState(null);

  const handleLogin = (token, studentNumber) => {
    console.log("App: Received login data:", { token, studentNumber });
    setToken(token);
    setStudentNumber(studentNumber); // ✅ studentNumber 저장
  };
  

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  
  return (
    <div>
      <h1>Welcome</h1>
      {currentRoomId ? (
        <div>
          {/* ChatRoom Component */}
          <ChatRoom
            token={token}
            roomId={currentRoomId}
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
        <ChatRoomsList token={token}
         onSelectRoom={setCurrentRoomId} 
         studentNumber={studentNumber}/>
      )}
    </div>
  );
};

export default App;