import React, { useState } from "react";

const ChatRoomManager = ({ token, refreshChatRooms }) => {
  const [newRoomName, setNewRoomName] = useState("");
  const [inviteRoomId, setInviteRoomId] = useState("");
  const [inviteUserId, setInviteUserId] = useState("");
  const [leaveRoomId, setLeaveRoomId] = useState("");

  // 채팅방 생성
const createChatRoom = async () => {
    try {
      const response = await fetch(`http://localhost:8080/chat/rooms?name=${encodeURIComponent(newRoomName)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to create chat room");
      }
      setNewRoomName("");
      refreshChatRooms(); // 채팅방 목록 새로고침
    } catch (error) {
      console.error("Error creating chat room:", error);
    }
  };
  
  // 사용자 초대
  const inviteUserToChatRoom = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/chat/rooms/${inviteRoomId}/users?userId=${encodeURIComponent(inviteUserId)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to invite user to chat room");
      }
      setInviteRoomId("");
      setInviteUserId("");
      refreshChatRooms(); // 채팅방 목록 새로고침
    } catch (error) {
      console.error("Error inviting user to chat room:", error);
    }
  };
  

  // 채팅방 나가기
  const leaveChatRoom = async () => {
    try {
      const response = await fetch(`http://localhost:8080/chat/rooms/${leaveRoomId}/users`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to leave chat room");
      }
      setLeaveRoomId("");
      refreshChatRooms(); // 채팅방 목록 새로고침
    } catch (error) {
      console.error("Error leaving chat room:", error);
    }
  };

  return (
    <div>
      <h2>Manage Chat Rooms</h2>

      {/* 채팅방 생성 */}
      <div>
        <h3>Create Chat Room</h3>
        <input
          type="text"
          placeholder="Enter room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button onClick={createChatRoom}>Create</button>
      </div>

      {/* 사용자 초대 */}
      <div>
        <h3>Invite User to Chat Room</h3>
        <input
          type="text"
          placeholder="Enter room ID"
          value={inviteRoomId}
          onChange={(e) => setInviteRoomId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter user ID"
          value={inviteUserId}
          onChange={(e) => setInviteUserId(e.target.value)}
        />
        <button onClick={inviteUserToChatRoom}>Invite</button>
      </div>

      {/* 채팅방 나가기 */}
      <div>
        <h3>Leave Chat Room</h3>
        <input
          type="text"
          placeholder="Enter room ID"
          value={leaveRoomId}
          onChange={(e) => setLeaveRoomId(e.target.value)}
        />
        <button onClick={leaveChatRoom}>Leave</button>
      </div>
    </div>
  );
};

export default ChatRoomManager;
