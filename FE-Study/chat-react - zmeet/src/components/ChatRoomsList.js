import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "./ChatRoomsList.css";
import ChatRoom from "./ChatRoom"; // ChatRoom 직접 불러오기

const ChatRoomsList = ({ token, userId, username }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [stompClient, setStompClient] = useState(null);

  // ✅ 채팅방 목록 불러오기 (초기 1회 실행)
  const fetchChatRooms = async () => {
    try {
      const response = await fetch("http://localhost:8080/chat/rooms/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat rooms");
      }

      const result = await response.json();
      console.log("Fetched chat rooms:", result);

      if (Array.isArray(result.data)) {
        // ✅ 최신 메시지 시간을 기준으로 정렬 (slice 사용하여 상태 변경 감지)
        const sortedRooms = result.data
          .slice()
          .sort((a, b) => new Date(b.latestMessageTime || b.lastestTime || 0) - new Date(a.latestMessageTime || a.lastestTime || 0));
        
        setChatRooms(sortedRooms);
      } else {
        console.error("Unexpected response format:", result);
        setChatRooms([]);
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      setChatRooms([]);
    }
  };

  useEffect(() => {
    fetchChatRooms(); // 초기 데이터 로드

    // ✅ WebSocket 연결 설정
    const socket = new SockJS("http://localhost:8080/ws/chat");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log("Connected to WebSocket");

        // ✅ 채팅방 목록을 구독
        client.subscribe("/topic/chatrooms", (message) => {
          const updatedChatRoom = JSON.parse(message.body);
          console.log("Received chat room update:", updatedChatRoom);

          setChatRooms((prevRooms) => {
            // 최신 메시지 시간 필드 확인 (lastestTime → latestMessageTime)
            const latestTime = new Date(updatedChatRoom.latestMessageTime || updatedChatRoom.lastestTime || 0);

            // 기존 채팅방에서 해당 채팅방 제거
            const filteredRooms = prevRooms.filter(room => room.chatRoomId !== updatedChatRoom.chatRoomId);
            
            // 최신 채팅방을 맨 위에 추가
            const newRooms = [updatedChatRoom, ...filteredRooms];

            // 최신 메시지 시간을 기준으로 정렬 (slice 사용하여 상태 변경 감지)
            return newRooms
              .slice()
              .sort((a, b) => new Date(b.latestMessageTime || b.lastestTime || 0) - new Date(a.latestMessageTime || a.lastestTime || 0));
          });
        });

        setStompClient(client);
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
      },
    });

    client.activate();

    return () => {
      client.deactivate(); // 컴포넌트 언마운트 시 연결 해제
    };
  }, [token]);

  return (
    <div className="chat-rooms-list">
      {!selectedRoomId ? (
        <>
          <h2>Your Chat Rooms</h2>
          <ul>
            {chatRooms.map((room) => (
              <li
                key={room.chatRoomId}
                className="chat-room-item"
                onClick={() => setSelectedRoomId(room.chatRoomId)}
              >
                <h3>{room.chatRoomName || "Unknown Room"}</h3>
                <p>Latest Message: {room.latestMessage || "No messages yet"}</p>
                <p>
                  🕒 {room.latestMessageTime || room.lastestTime
                    ? new Date(room.latestMessageTime || room.lastestTime).toLocaleString()
                    : "No time available"}
                </p>
                <div className="participants">
                  {room.userProfiles.length > 0
                    ? room.userProfiles.map((profile) => (
                        <span key={profile.id} className="participant-badge">
                          {profile.emoji}
                        </span>
                      ))
                    : "No participants"}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ChatRoom 
          token={token} 
          roomId={selectedRoomId} 
          userId={userId} 
          username={username} 
          onLeaveRoom={() => setSelectedRoomId(null)} // ✅ 뒤로 가기 버튼 핸들러 전달
        />
      )}
    </div>
  );
};

export default ChatRoomsList;
