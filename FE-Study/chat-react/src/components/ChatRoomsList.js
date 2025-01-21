import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const ChatRoomsList = ({ token, onSelectRoom }) => {
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
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
          setChatRooms((prevRooms) => {
            const existingRoomIndex = prevRooms.findIndex(
              (room) => room.chatRoom.id === updatedRoom.chatRoom.id
            );
            let updatedRooms = [...prevRooms];
            if (existingRoomIndex > -1) {
              // Update existing room
              updatedRooms[existingRoomIndex] = updatedRoom;
            } else {
              // Add new room
              updatedRooms.unshift(updatedRoom);
            }
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
    <div>
      <h2>Your Chat Rooms</h2>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {chatRooms.map((room) => (
          <li
            key={room.chatRoom.id}
            onClick={() => onSelectRoom(room.chatRoom.id)}
            style={{
              border: "1px solid #ccc",
              borderRadius: "5px",
              padding: "10px",
              margin: "5px 0",
              cursor: "pointer",
              background: "#f9f9f9",
            }}
          >
            <h3>{room.chatRoom.name}</h3>
            <p>Latest Message: {room.latestMessage || "No messages yet"}</p>
            <div>
              Participants:
              {room.userProfiles.map((profile) => (
                <span
                  key={profile.id}
                  style={{
                    display: "inline-block",
                    margin: "0 5px",
                    padding: "5px",
                    border: "1px solid #ddd",
                    borderRadius: "50%",
                    backgroundColor: "#eee",
                  }}
                >
                  {profile.emoji}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatRoomsList;

