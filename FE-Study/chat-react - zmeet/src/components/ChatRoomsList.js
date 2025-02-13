import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "./ChatRoomsList.css";
import ChatRoom from "./ChatRoom"; // ChatRoom 직접 불러오기

const ChatRoomsList = ({ token, studentNumber, userId, username }) => {
  const [chatRooms, setChatRooms] = useState([]); // 채팅방 목록
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);

  // ✅ 1️⃣ 채팅방 목록 불러오기 (API 호출)
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
        // 최신 메시지 기준으로 정렬
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
    fetchChatRooms(); // ✅ 최초 API 호출 (채팅방 목록 가져오기)
  }, [token]);

  useEffect(() => {
    if (chatRooms.length === 0) return; // ✅ 채팅방 목록이 없으면 WebSocket 구독하지 않음.

    // ✅ 2️⃣ WebSocket 연결 설정
    const socket = new SockJS("http://localhost:8080/ws/chat");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log("Connected to WebSocket");

        // ✅ 모든 채팅방 구독 (이제 하나의 채널에서 모든 정보 처리)
chatRooms.forEach((room) => {
  client.subscribe(`/topic/${room.chatRoomId}`, (message) => {
    const updatedMessage = JSON.parse(message.body);
    console.log("🔔 새 메시지 수신:", updatedMessage);

    // ✅ 1️⃣ 채팅방 내부 메시지 추가 (채팅 화면 업데이트)
    if (updatedMessage.type === "TALK" || updatedMessage.type === "EXIT") {
      setReceivedMessages((prevMessages) => [...prevMessages, updatedMessage]);
    }
    // ✅ 2️⃣ 채팅방 목록 업데이트 (EXIT, TALK 모두 적용)
    setChatRooms((prevRooms) => {
      // 퇴장(`EXIT`)한 사용자가 현재 사용자라면 목록에서 제거
      if (updatedMessage.type === "EXIT" && updatedMessage.senderName === username) {
        return prevRooms.filter((room) => room.chatRoomId !== updatedMessage.roomId);
      }

      // 채팅방 찾기
      const existingRoom = prevRooms.find((r) => r.chatRoomId === updatedMessage.roomId);

      // 기존 데이터 유지하면서 최신 정보 업데이트
      const mergedRoom = {
        ...existingRoom,
        latestMessage: updatedMessage.content, // 최신 메시지 업데이트
        lastestTime: updatedMessage.sendAt, // 최신 시간 업데이트
        latestMessageType: updatedMessage.type, // 메시지 타입 저장
      };

      // 기존 목록에서 해당 채팅방 제거 후 다시 추가 (정렬 유지)
      const filteredRooms = prevRooms.filter((r) => r.chatRoomId !== updatedMessage.roomId);
      return [mergedRoom, ...filteredRooms].sort(
        (a, b) => new Date(b.lastestTime) - new Date(a.lastestTime)
      );
    });
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
      client.deactivate(); // ✅ 컴포넌트 언마운트 시 WebSocket 연결 해제
    };
  }, [token, chatRooms]); // ✅ chatRooms가 변경될 때마다 다시 구독

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
          onLeaveRoom={() => setSelectedRoomId(null)}
        />
      )}
    </div>
  );
};

export default ChatRoomsList;
