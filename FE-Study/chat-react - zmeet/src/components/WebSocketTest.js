import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

const WebSocketTest = () => {
  const [stompClient, setStompClient] = useState(null);
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws/chat");
    const client = Stomp.over(socket);

    client.connect(
      {},
      (frame) => {
        console.log("Connected: " + frame);

        // 구독하기 (채팅방과 관련된 메시지를 받을 경로 설정)
        client.subscribe("/topic/1", (messageOutput) => {
          setReceivedMessages((prevMessages) => [
            ...prevMessages,
            messageOutput.body,
          ]);
        });
      },
      (error) => {
        console.log("Error: ", error);
      }
    );
    setStompClient(client);

    return () => {
      if (stompClient) stompClient.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (stompClient && message.trim() !== "") {
      const messageDto = {
        senderId: 1,
        content: message,
        chatRoomId: 1,
      };
      stompClient.send("/app/chat/1", {}, JSON.stringify(messageDto));
      setMessage(""); // 메시지 전송 후 입력란 비우기
    }
  };

  return (
    <div>
      <h2>WebSocket Chat Test</h2>
      <ul>
        {receivedMessages.map((msg, idx) => (
          <li key={idx}>{msg}</li>
        ))}
      </ul>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
};

export default WebSocketTest;
