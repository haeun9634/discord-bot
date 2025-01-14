import React, { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const ChatRoomsList = ({ token, onSelectRoom }) => {
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
    // 초기 채팅방 목록 조회
    fetch('http://localhost:8080/chat/users/rooms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => setChatRooms(data))
      .catch((error) => console.error('Error fetching chat rooms:', error));
  }, [token]);

  return (
    <div>
      <h2>Your Chat Rooms</h2>
      <ul>
        {chatRooms.map((room) => (
          <li key={room.id} onClick={() => onSelectRoom(room.id)}>
            Chat Room: {room.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatRoomsList;
