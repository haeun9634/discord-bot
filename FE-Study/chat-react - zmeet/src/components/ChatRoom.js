import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { v4 as uuidv4 } from "uuid";

const ChatRoom = ({ token, roomId, userId, username, onLeaveRoom }) => {
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]); // 기존 및 실시간 메시지 저장
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  console.log("userId ",userId);

  // ✅ 서버에서 기존 메시지 가져오기
  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8080/chat/rooms/${roomId}/messages?page=0&size=20`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.text(); // 응답 메시지 확인
        throw new Error("Failed to fetch messages");
      }

      const result = await response.json();
      console.log("Fetched messages:", result);

      setReceivedMessages(result.sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt))); // 시간순 정렬
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (!roomId || !token) {
      console.error("Missing roomId or token for WebSocket connection.");
      return;
    }

    fetchMessages(); // ✅ 메시지 조회 API 호출

    let client;

    const connectWebSocket = () => {
      console.log("Connecting to WebSocket with token:", token);

      const socket = new SockJS("http://localhost:8080/ws/chat");
      client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("WebSocket connected.");
          setIsConnected(true);

          // ✅ 실시간 메시지 수신
          client.subscribe(`/topic/${roomId}`, (messageOutput) => {
            const parsedMessage = JSON.parse(messageOutput.body);
            console.log("Received real-time message:", parsedMessage);

            updateReceivedMessages(parsedMessage);
          });
        },
        onStompError: (error) => {
          console.error("STOMP error:", error);
        },
        onWebSocketClose: () => {
          console.warn("WebSocket connection closed.");
          setIsConnected(false);
        },
      });

      client.activate();
      setStompClient(client);
    };

    connectWebSocket();

    return () => {
      if (client && client.active) {
        console.log("Deactivating WebSocket client.");
        client.deactivate();
      }
    };
  }, [roomId, token]);

  // ✅ 메시지 목록 업데이트
  const updateReceivedMessages = (newMessage) => {
    setReceivedMessages((prevMessages) => {
      const isDuplicate = prevMessages.some((msg) => msg.id === newMessage.id);
      if (isDuplicate) return prevMessages;

      const updatedMessages = [...prevMessages, newMessage].sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt));

      return updatedMessages;
    });

    // ✅ 스크롤을 가장 아래로 이동
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // ✅ WebSocket 메시지 전송
  const sendMessage = () => {
    if (!stompClient || !isConnected) {
      alert("WebSocket is not connected.");
      return;
    }

    if (!message.trim()) {
      alert("Message is empty.");
      return;
    }

    console.log("Sending message - userId:", userId, "username:", username);

    const messageDto = {
      id: uuidv4(),
      content: message,
      roomId,
      senderId: userId,
      senderName: username,
      sendAt: new Date().toISOString(),
      messageType: "TALK",
    };

    console.log("Sending message:", messageDto);

    stompClient.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(messageDto),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setMessage("");
  };

  return (
    <div>
      {/* ✅ 뒤로 가기 버튼 */}
      <button 
        onClick={onLeaveRoom} 
        style={{ marginBottom: "10px", padding: "10px", background: "#ff4d4d", color: "#fff", borderRadius: "5px" }}
      >
        🔙 Back to Chat Rooms
      </button>

      <ul style={{ maxHeight: "400px", overflowY: "auto", padding: 0, listStyle: "none" }}>
        {receivedMessages.map((msg) => (
          <li
            key={`${msg.id}`}
            style={{
              display: "flex",
              justifyContent: String(msg.senderName) === String(userId) ? "flex-end" : "flex-start",
              margin: "10px 0",
              alignItems: "center",
            }}
          >
            {/* ✅ 아이콘 (프로필 이미지 등) */}
            {msg.senderIcon && (
              <img
                src={msg.senderIcon}
                alt="Sender Icon"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  margin: String(msg.senderId) === String(userId) ? "0 10px 0 0" : "0 0 0 10px",
                }}
              />
            )}

            <div
              style={{
                maxWidth: "60%",
                padding: "10px",
                borderRadius: "10px",
                backgroundColor: String(msg.senderId) === String(userId) ? "#daf8cb" : "#f1f0f0",
                textAlign: "left",
              }}
            >
              <strong style={{ fontSize: "0.9em", color: "#555" }}>{msg.senderName}</strong>
              <div style={{ marginTop: "5px" }}>{msg.content}</div>
              <div style={{ fontSize: "0.8em", color: "#888", marginTop: "5px" }}>
                <span>{new Date(msg.sendAt).toLocaleString()}</span>
              </div>
            </div>
          </li>
        ))}
        {/* ✅ 스크롤 자동 이동을 위한 빈 div */}
        <div ref={messagesEndRef} />
      </ul>

      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "80%", padding: "10px", marginRight: "5px", borderRadius: "5px" }}
        />
        <button
          onClick={() => sendMessage()} // ✅ 명시적으로 호출
          style={{ padding: "10px", borderRadius: "5px" }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
