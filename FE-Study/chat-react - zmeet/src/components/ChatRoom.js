import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { v4 as uuidv4 } from "uuid";
import * as S from "./Styles";

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

          // 실시간 메시지 수신
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

  // ✅ WebSocket 메시지 전송z
  
  const sendMessage = (event = null, messageType = "TALK") => {
      console.log(`sendMessage 실행됨: messageType=${messageType}`);
    // 이벤트 객체가 전달되었을 경우, Enter 키만 허용
    if (event && event.key !== "Enter") {
      return;
    }
  
    if (!stompClient || !isConnected) {
      alert("WebSocket is not connected.");
      return;
    }
  
    const chatMessage = {
      id: uuidv4(),
      type: messageType,
      roomId: roomId.toString()
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
    console.log(`http://localhost:8080/chat/rooms/${roomId}/users`);
    try {
      sendMessage(null, "EXIT"); // `EXIT` 메시지 WebSocket으로 전송
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
    <S.ChatContainer>
      <S.Button onClick={onLeaveRoom}>🔙 뒤로 가기</S.Button>
      <S.Button variant="leave" onClick={() => leaveChatRoom()}>🚪 채팅방 나가기</S.Button>

      <S.MessageList>
        {receivedMessages.map((msg) => (
          <S.MessageItem key={msg.id} isMine={String(msg.senderName) === String(username)}>
            {msg.senderIcon && <S.ProfileImage src={msg.senderIcon} alt="Sender Icon" isMine={String(msg.senderName) === String(username)} />}
            <S.MessageBubble isMine={String(msg.senderName) === String(username)}>
              <S.SenderName>{msg.senderName}</S.SenderName>
              <S.MessageContent>{msg.content}</S.MessageContent>
              {msg.emoji && <S.Emoji>{msg.emoji}</S.Emoji>}
              <S.MessageTime>{new Date(msg.sendAt).toLocaleString()}</S.MessageTime>
            </S.MessageBubble>
          </S.MessageItem>
        ))}
        <div ref={messagesEndRef} />
      </S.MessageList>

      <S.InputContainer>
        <S.MessageInput type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => sendMessage(e)} />
        <S.SendButton onClick={() => sendMessage()}>Send</S.SendButton>
      </S.InputContainer>
    </S.ChatContainer>
  );
};

export default ChatRoom;