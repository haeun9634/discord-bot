import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const ChatRoom = ({ token, roomId, receivedMessages, setReceivedMessages }) => {
  const [message, setMessage] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    // WebSocket 연결 설정
    const socket = new SockJS("http://localhost:8080/ws/chat");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log("Connected to WebSocket server");
        setIsConnected(true);

        // WebSocket 메시지 구독
        client.subscribe(`/topic/${roomId}`, (messageOutput) => {
          const parsedMessage = JSON.parse(messageOutput.body);

          // 실시간 메시지를 목록 아래에 추가
          setReceivedMessages((prevMessages) => [...prevMessages, parsedMessage]);
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

    // Cleanup WebSocket on component unmount or roomId change
    return () => {
      if (client && client.active) {
        client.deactivate();
      }
    };
  }, [roomId]);

  useEffect(() => {
    // 스크롤을 최신 메시지로 이동
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [receivedMessages]);

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
      id: Date.now(), // 클라이언트에서 고유 ID 생성 (임시)
      senderId: 1, // Replace with actual sender ID
      content: message,
      chatRoomId: roomId,
      sendAt: new Date().toISOString(), // 전송 시각 추가
    };

    try {
      // WebSocket을 통해 메시지 전송
      stompClient.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify(messageDto),
      });

      // 실시간 메시지를 목록에 바로 추가
      setReceivedMessages((prevMessages) => [...prevMessages, messageDto]);

      // 입력 필드 초기화
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/chat/rooms/${roomId}/messages`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      // 이전 메시지 목록을 상태에 추가 (위에 배치)
      setReceivedMessages((prevMessages) => [...data, ...prevMessages]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // 초기 메시지 로드
  useEffect(() => {
    if (roomId) {
      fetchMessages();
    }
  }, [roomId]);

  return (
    <div>
      <h2>Chat Room {roomId}</h2>
      <ul style={{ maxHeight: "300px", overflowY: "auto" }}>
        {receivedMessages.map((msg, idx) => (
          <li key={idx}>{msg.content}</li>
        ))}
        <div ref={messagesEndRef} />
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
