import React, { useEffect, useState } from "react";

const ChatRoomsList = ({ token, onSelectRoom }) => {
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/chat/users/rooms", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch chat rooms");
        }
        return response.json();
      })
      .then((data) => {
        setChatRooms(data);
      })
      .catch((error) => {
        console.error("Error fetching chat rooms:", error);
      });
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
