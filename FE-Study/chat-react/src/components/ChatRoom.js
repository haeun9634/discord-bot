import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const ChatRoom = ({ token, roomId, receivedMessages, setReceivedMessages }) => {
  const [message, setMessage] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

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
        onConnect: () => {
          console.log("WebSocket connected.");
          setIsConnected(true);

          client.subscribe(`/topic/${roomId}`, (messageOutput) => {
            const parsedMessage = JSON.parse(messageOutput.body);

            // 중복 메시지 방지 (ID로 확인)
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
      id: Date.now(),
      content: message,
      chatRoomId: roomId,
      sendAt: new Date().toISOString(),
    };

    console.log("Sending message:", messageDto);

    stompClient.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(messageDto),
      headers: {
        Authorization: `Bearer ${token}`, // 토큰 추가
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

      // 중복 방지 (ID로 확인)
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
      <ul style={{ maxHeight: "300px", overflowY: "auto" }}>
        {receivedMessages.map((msg, idx) => (
          <li key={idx}>
            <strong>{msg.senderName}</strong>: {msg.content}
          </li>
        ))}
        <div ref={messagesEndRef} />
      </ul>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
