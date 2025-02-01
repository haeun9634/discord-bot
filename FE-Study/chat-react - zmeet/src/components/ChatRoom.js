import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { v4 as uuidv4 } from "uuid";

const ChatRoom = ({ token, roomId, userId, username, onLeaveRoom }) => {
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

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
        const errorMessage = await response.text();
        throw new Error("Failed to fetch messages");
      }

      const result = await response.json();
      console.log("Fetched messages:", result);

      setReceivedMessages(result.sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt)));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (!roomId || !token) {
      console.error("Missing roomId or token for WebSocket connection.");
      return;
    }

    fetchMessages();

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

    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // ✅ WebSocket 메시지 전송
  
  const sendMessage = (messageType = "TALK") => {
    if (!stompClient || !isConnected) {
      alert("WebSocket is not connected.");
      return;
    }

    const chatMessage = {
      id: uuidv4(),
      type: messageType,
      roomId: roomId.toString(),
      senderId: userId,
      senderName: username,
      sendAt: new Date().toISOString(),
    };

    if (messageType === "TALK") {
      if (!message.trim()) {
        alert("Message is empty.");
        return;
      }
      chatMessage.content = message;
    } else {
      chatMessage.content = `${username}님이 퇴장하셨습니다.`;
    }

    stompClient.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(chatMessage),
      headers: { Authorization: `Bearer ${token}` },
    });

    if (messageType === "TALK") {
      setMessage("");
    }
  };

  // ✅ 채팅방 나가기 버튼 클릭 시 실행
  const leaveChatRoom = async () => {
    try {
      sendMessage("EXIT"); // `EXIT` 메시지 WebSocket으로 전송
      await fetch(`http://localhost:8080/chat/rooms/${roomId}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      onLeaveRoom(); // 채팅방 목록으로 이동
    } catch (error) {
      console.error("Failed to leave chat room:", error);
    }
  };

  return (
    <div>
      {/* ✅ 뒤로 가기 버튼 */}
      <button
        onClick={onLeaveRoom}
        style={{
          marginBottom: "10px",
          padding: "10px",
          background: "#4d79ff",
          color: "#fff",
          borderRadius: "5px",
        }}
      >
        🔙 뒤로 가기
      </button>

      {/* ✅ 채팅방 나가기 버튼 */}
      <button
        onClick={leaveChatRoom}
        style={{
          marginBottom: "10px",
          padding: "10px",
          background: "#ff4d4d",
          color: "#fff",
          borderRadius: "5px",
          marginLeft: "10px",
        }}
      >
        🚪 채팅방 나가기
      </button>
      <ul style={{ maxHeight: "400px", overflowY: "auto", padding: 0, listStyle: "none" }}>
        {receivedMessages.map((msg) => (
          <li
            key={`${msg.id}`}
            style={{
              display: "flex",
              justifyContent: String(msg.senderId) === String(userId) ? "flex-end" : "flex-start",
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
                display: "flex",
                alignItems: "center",
                gap: "5px", // ✅ 메시지와 이모지 간격 조절
              }}
            >
              <strong style={{ fontSize: "0.9em", color: "#555" }}>{msg.senderName}</strong>
              <div style={{ marginTop: "5px" }}>{msg.content}</div>

              {/* ✅ 이모지 표시 (null이 아닐 경우) */}
              {msg.emoji && (
                <span style={{ fontSize: "1.5em" }}>{msg.emoji}</span>
              )}

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
          onClick={() => sendMessage()}
          style={{ padding: "10px", borderRadius: "5px" }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
