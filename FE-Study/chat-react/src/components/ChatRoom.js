import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const ChatRoom = ({ token, roomId, userId, username, receivedMessages, setReceivedMessages }) => {
  const [message, setMessage] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Debug: Props 확인
  useEffect(() => {
    console.log("ChatRoom Props:", { token, roomId, userId, username });
  }, [token, roomId, userId, username]);

  useEffect(() => {
    if (!roomId || !token) {
      console.error("Missing roomId or token for WebSocket connection.");
      return;
    }

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

          client.subscribe(`/topic/${roomId}`, (messageOutput) => {
            const parsedMessage = JSON.parse(messageOutput.body);
            console.log("Received message from broker:", parsedMessage);

            // Debug: Sender and User ID 비교
            console.log(
              "Debug: Comparing senderId and userId",
              `senderId: ${parsedMessage.sender}, userId: ${userId}`,
              `Type: senderId(${typeof parsedMessage.sender}), userId(${typeof userId})`
            );

            // ID가 없을 경우 고유한 ID 생성
            if (!parsedMessage.id) {
              parsedMessage.id = `${parsedMessage.roomId}-${Date.now()}`;
            }

            setReceivedMessages((prevMessages) => {
              if (!prevMessages.some((msg) => msg.id === parsedMessage.id)) {
                return [...prevMessages, parsedMessage];
              }
              return prevMessages;
            });
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [receivedMessages]);

  const sendMessage = () => {
    if (!stompClient || !isConnected) {
      alert("WebSocket is not connected.");
      return;
    }

    if (!message.trim()) {
      alert("Message is empty.");
      return;
    }

    const messageDto = {
      id: `${roomId}-${Date.now()}`,
      content: message,
      chatRoomId: roomId,
      senderId: userId,
      senderName: username,
      sendAt: new Date().toISOString(),
    };

    console.log("Sending message:", messageDto);

    stompClient.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(messageDto),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setReceivedMessages((prevMessages) => [...prevMessages, messageDto]);
    setMessage("");
  };

  const fetchMessages = async () => {
    if (!roomId) {
      console.error("Missing roomId for fetching messages.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/chat/rooms/${roomId}/messages`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      const data = await response.json();

      setReceivedMessages((prevMessages) => {
        const uniqueMessages = data.filter(
          (newMessage) => !prevMessages.some((msg) => msg.id === newMessage.id)
        );
        return [...prevMessages, ...uniqueMessages];
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [roomId]);

  return (
    <div>
      <h2>Chat Room {roomId}</h2>
      <ul style={{ maxHeight: "300px", overflowY: "auto", padding: 0, listStyle: "none" }}>
        {receivedMessages.map((msg, idx) => (
          <li
            key={idx}
            style={{
              display: "flex",
              justifyContent: String(msg.sender) === String(userId) ? "flex-end" : "flex-start",
              margin: "10px 0",
            }}
          >
            <div
              style={{
                maxWidth: "60%",
                padding: "10px",
                borderRadius: "10px",
                backgroundColor: String(msg.sender) === String(userId) ? "#daf8cb" : "#f1f0f0",
                textAlign: "left",
              }}
            >
              <strong style={{ fontSize: "0.9em", color: "#555" }}>{msg.senderName}</strong>
              <div style={{ marginTop: "5px" }}>{msg.content}</div>
            </div>
          </li>
        ))}
        <div ref={messagesEndRef} />
      </ul>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "80%", padding: "10px", marginRight: "5px", borderRadius: "5px" }}
        />
        <button onClick={sendMessage} style={{ padding: "10px", borderRadius: "5px" }}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
