import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "./ChatRoomsList.css";
import ChatRoomManager from "./ChatRoomManager"; // 경로가 잘못되었으면 정확히 수정

const ChatRoomsList = ({ token, onSelectRoom }) => {
  const [chatRooms, setChatRooms] = useState([]);

  // fetchChatRooms 함수 useEffect 외부로 이동
  const fetchChatRooms = async () => {
    try {
      const response = await fetch("http://localhost:8080/chat/users/rooms", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch chat rooms");
      }
      const data = await response.json();
      setChatRooms(data);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  };

  useEffect(() => {
    fetchChatRooms();

    const socket = new SockJS("http://localhost:8080/ws/chat");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log("Connected to WebSocket");

        client.subscribe("/topic/chatrooms", (message) => {
          const updatedRoom = JSON.parse(message.body);

          // 채팅방 목록 업데이트 및 정렬
          setChatRooms((prevRooms) => {
            const existingRoomIndex = prevRooms.findIndex(
              (room) => room.chatRoom.id === updatedRoom.chatRoom.id
            );

            let updatedRooms = [...prevRooms];

            if (existingRoomIndex > -1) {
              // 기존 채팅방 업데이트 및 맨 앞으로 이동
              updatedRooms.splice(existingRoomIndex, 1); // 기존 항목 제거
            }

            // 맨 앞에 추가
            updatedRooms.unshift(updatedRoom);

            return updatedRooms;
          });
        });
      },
      onStompError: (error) => {
        console.error("STOMP error:", error);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [token]);

  return (
    <div className="chat-rooms-list">
      <h2>Your Chat Rooms</h2>
      <ul>
        {chatRooms.map((room) => (
          <li
            key={room.chatRoom.id}
            className="chat-room-item"
            onClick={() => onSelectRoom(room.chatRoom.id)}
          >
            <h3>{room.chatRoom.name}</h3>
            <p>Latest Message: {room.latestMessage || "No messages yet"}</p>
            <div className="participants">
              {room.userProfiles.map((profile) => (
                <span key={profile.id} className="participant-badge">
                  {profile.emoji}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <ChatRoomManager token={token} refreshChatRooms={fetchChatRooms} />
    </div>
  );
};

export default ChatRoomsList;
