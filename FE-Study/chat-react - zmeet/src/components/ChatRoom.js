import React, { useEffect, useState, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { v4 as uuidv4 } from "uuid";
import * as S from "./Styles";

const ChatRoom = ({ token, roomId, username, onLeaveRoom }) => {
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesTopRef = useRef(null);
  const isFetchingRef = useRef(false);

  console.log("ChatRoomID!! ",roomId);

  // ✅ 기존 메시지 가져오기
  const fetchMessages = useCallback(async (newPage = 0) => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;

    try {
      const response = await fetch(
        `http://localhost:8080/api/chat/rooms/${roomId}/messages?page=${newPage}&size=15`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch messages");

      const result = await response.json();
      console.log("📩 가져온 메시지:", result);

      if (result.length === 0) {
        setHasMore(false);
      } else {
        setReceivedMessages((prev) => [...result, ...prev]); // 🔥 위쪽에 추가
        setPage(newPage);
      }
    } catch (error) {
      console.error("❌ 메시지 가져오기 실패:", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [roomId, token, hasMore]);

  useEffect(() => {
    if (!roomId || !token) return;
    fetchMessages(0); // ✅ 최초 메시지 로드

    let client;
    const connectWebSocket = () => {
      console.log("🌐 WebSocket 연결 시도");

      const socket = new SockJS("http://localhost:8080/ws");
      client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("✅ WebSocket 연결 성공");
          setIsConnected(true);

          // ✅ 실시간 메시지 수신
          client.subscribe(`/topic/${roomId}`, (messageOutput) => {
            const parsedMessage = JSON.parse(messageOutput.body);
            console.log("🔔 실시간 메시지 수신:", parsedMessage);
            updateReceivedMessages(parsedMessage);
          });
        },
        onStompError: (error) => {
          console.error("❌ STOMP 오류:", error);
        },
        onWebSocketClose: () => {
          console.warn("🔌 WebSocket 연결 종료");
          setIsConnected(false);
        },
      });

      client.activate();
      setStompClient(client);
    };

    connectWebSocket();

    return () => {
      if (client && client.active) {
        client.deactivate();
      }
    };
  }, [roomId, token, fetchMessages]);

  // ✅ 메시지 목록 업데이트
  const updateReceivedMessages = (newMessage) => {
    setReceivedMessages((prevMessages) => {
      const fixedMessage = { ...newMessage, id: newMessage.id || uuidv4() };
      const isDuplicate = prevMessages.some((msg) => msg.id === fixedMessage.id);
      if (isDuplicate) return prevMessages;

      return [...prevMessages, fixedMessage].sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt));
    });

    // ✅ 최신 메시지 위치로 스크롤 이동
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // ✅ WebSocket 메시지 전송
  const sendMessage = (event = null, messageType = "TALK") => {
    if (event && event.key !== "Enter") {
      return;
    }

    if (!stompClient || !isConnected) {
      alert("WebSocket is not connected.");
      return;
    }

    const chatMessage = {
      type: messageType,
      roomId: roomId.toString(),
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

    console.log(chatMessage);
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
      sendMessage(null, "EXIT");
      await fetch(`http://localhost:8080/api/chat/rooms/${roomId}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      onLeaveRoom();
    } catch (error) {
      console.error("Failed to leave chat room:", error);
    }
  };

   // ✅ 이전 메시지 로드 버튼 클릭
  const loadPreviousMessages = () => {
    fetchMessages(page - 1);
  };

  // ✅ 다음 메시지 로드 버튼 클릭
  const loadNextMessages = () => {
    fetchMessages(page + 1);
  };
  

  return (
    <S.ChatContainer ref={chatContainerRef}>
      <S.Button onClick={onLeaveRoom}>🔙 뒤로 가기</S.Button>
      <S.Button variant="leave" onClick={() => leaveChatRoom()}>🚪 채팅방 나가기</S.Button>

      <S.MessageList>
        <div ref={messagesTopRef} />
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

       {/* 버튼을 통해 이전/다음 메시지 로드 */}
       <S.Button onClick={loadPreviousMessages}>📜 이전 메시지</S.Button>
      <S.Button onClick={loadNextMessages}>📜 다음 메시지</S.Button>

      <S.InputContainer>
        <S.MessageInput type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage(e)} />
        <S.SendButton onClick={() => sendMessage()}>Send</S.SendButton>
      </S.InputContainer>
    </S.ChatContainer>
  );
};

export default ChatRoom;
