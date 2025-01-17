import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const ChatRoomsList = ({ token, onSelectRoom }) => {
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
    // Fetch existing chat rooms
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

        // Parse and set chat rooms
        setChatRooms(data.map((room) => ({
          ...room,
          updatedAt: new Date(room.updatedAt),
        })));
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
      }
    };

    fetchChatRooms();

    // Set up WebSocket connection
    const socket = new SockJS("http://localhost:8080/ws/chat");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log("Connected to WebSocket for chat rooms");

        client.subscribe("/topic/chatrooms", (message) => {
          const updatedRoom = JSON.parse(message.body);

          // Convert updatedAt to Date object
          updatedRoom.updatedAt = new Date(updatedRoom.updatedAt);

          console.log("Received updated chat room from broker:", updatedRoom);

          setChatRooms((prevRooms) => {
            const existingRoomIndex = prevRooms.findIndex((room) => room.id === updatedRoom.id);
            
            let updatedRooms;
            if (existingRoomIndex > -1) {
              // Update the existing room and move it to the top
              updatedRooms = [...prevRooms];
              updatedRooms.splice(existingRoomIndex, 1); // Remove existing room
            } else {
              // Add new room
              updatedRooms = [...prevRooms];
            }

            updatedRooms.unshift(updatedRoom); // Add to the top

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
      <ul>
        {chatRooms.map((room) => (
          <li
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            style={{ cursor: "pointer", margin: "5px 0" }}
          >
            Chat Room: {room.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatRoomsList;
