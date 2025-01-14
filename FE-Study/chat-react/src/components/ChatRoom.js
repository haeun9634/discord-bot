import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const ChatRoom = ({ token, roomId, receivedMessages, setReceivedMessages }) => {
  const [message, setMessage] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (roomId) {
      connectWebSocket();
    }

    return () => {
      if (stompClient && stompClient.active) {
        stompClient.deactivate();
      }
    };
  }, [roomId]);

  const connectWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws/chat");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log("Connected to WebSocket server");
        setIsConnected(true);
        client.subscribe(`/topic/${roomId}`, (messageOutput) => {
          // 메시지 파싱 후 실제 내용만 추가
          const parsedMessage = JSON.parse(messageOutput.body);
          setReceivedMessages((prevMessages) => [
            ...prevMessages,
            parsedMessage.content,  // content만 추출하여 추가
          ]);
        });
      },
      onStompError: (error) => {
        console.error("STOMP error:", error);
      },
      onWebSocketClose: () => {
        console.warn("WebSocket connection closed");
        setIsConnected(false);
      },
      debug: (str) => console.log(str),
    });

    client.activate();
    setStompClient(client);
  };

  const sendMessage = () => {
    if (!stompClient || !isConnected) {
      console.error("WebSocket is not connected.");
      return;
    }

    if (message.trim() === "") {
      console.error("Message is empty.");
      return;
    }

    const messageDto = {
      senderId: 1, // Replace with actual sender ID
      content: message,
      chatRoomId: roomId,
    };

    try {
      stompClient.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify(messageDto),
      });
      setMessage("");  // 메시지 전송 후 입력란 비우기
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div>
      <h2>Chat Room {roomId}</h2>
      <ul>
        {receivedMessages.map((msg, idx) => (
          <li key={idx}>{msg}</li>  // 여기서는 메시지 내용을 출력
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

export default ChatRoom;
