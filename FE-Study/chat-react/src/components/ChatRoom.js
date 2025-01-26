import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import "./ChatRoom.css";
import { Client } from "@stomp/stompjs";

const ChatRoom = ({ token, roomId, userId, username }) => {
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showUserList, setShowUserList] = useState(false); // 사용자 목록 표시 여부
  const [userList, setUserList] = useState([]); // 채팅방 사용자 목록
  const messagesEndRef = useRef(null);

  // useEffect(() => {
  //   if (!stompClient || !isConnected) return;
  
  //   // 채팅방 입장 시 즉시 읽음 상태 전송
  //   sendReadStatus(roomId);
  
  //   // 예: 5초마다 읽음 상태 업데이트
  //   const intervalId = setInterval(() => {
  //     sendReadStatus(roomId);
  //   }, 5000);
  
  //   return () => clearInterval(intervalId);
  // }, [stompClient, isConnected, roomId]);
  

  useEffect(() => {
    if (!roomId || !token) {
      console.error("Missing roomId or token for WebSocket connection.");
      return;
    }

    let client;

    const connectWebSocket = () => {
      console.log("Connecting to WebSocket with token:", userId);

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

          //특정 채팅방(roomId)의 메시지를 구독하고, 메시지를 실시간으로 수신합니다.
          client.subscribe(`/topic/${roomId}`, (messageOutput) => {
            const parsedMessage = JSON.parse(messageOutput.body);

            // 내가 보낸 메시지인지 확인
            if (String(parsedMessage.senderId) === String(userId)) {
              console.log("Skipping broadcast for my message:", parsedMessage);
              return; // 브로드캐스트된 내 메시지는 무시
            }

            setReceivedMessages((prevMessages) => {
              const uniqueMessages = prevMessages.filter(
                (msg) => msg.id !== parsedMessage.id // 기존 메시지와 중복 제거
              );
              return [...uniqueMessages, parsedMessage];
            });
            
          });

          // // 여기서 read 상태 변경 이벤트 구독 추가
          // client.subscribe(`/topic/${roomId}/read`, (message) => {
          //   const readStatus = JSON.parse(message.body);
          //   console.log(
          //     `User ${readStatus.userId} has read messages in room ${readStatus.chatRoomId}`
          //   );
          //   updateReadStatusInUI(readStatus); // 업데이트 함수 호출
          // });

          // // 채팅방 활성화 상태 전송
          // sendActiveStatus(client, roomId, true);
        },
        onStompError: (error) => {
          console.error("STOMP error:", error);
        },
        onWebSocketClose: () => {
          console.warn("WebSocket connection closed.");
          setIsConnected(false);

          // // 채팅방 비활성화 상태 전송
          // sendActiveStatus(client, roomId, false);
        },
      });

      client.activate();
      setStompClient(client);
    };

    connectWebSocket();

    return () => {
      if (client && client.active) {
        console.log("Deactivating WebSocket client.");
        sendActiveStatus(client, roomId, false); // 채팅방 비활성화 상태 전송
        client.deactivate();
      }
    };
  }, [roomId, token]);

  // 활성화 상태를 서버에 전송하는 함수
  const sendActiveStatus = (client, roomId, isActive) => {
    if (!client || !client.connected) return;

    client.publish({
      destination: `/app/chat/${roomId}/active`,
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        userId,
        roomId,
        active: isActive,
      }),
    });

    console.log(`Sent active status: ${isActive ? "active" : "inactive"}`);
  };

  const sendReadStatus = (roomId) => {
    if (!stompClient || !isConnected) {
      console.warn("WebSocket is not connected.");
      return;
    }
    console.log("Sending read status for room:", roomId); // 디버깅 로그

    // 서버에 읽음 상태 메시지 전송
    stompClient.publish({
      destination: `/app/chat/${roomId}/read`,
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        chatRoomId: roomId,
        userId: userId, // 사용자 ID를 포함시켜야 할 수 있음
      }),
    });
  };

  const updateReadStatusInUI = (readStatus) => {
    console.log("Updating read status:", readStatus); // 디버깅 로그

    setReceivedMessages((prevMessages) =>
      prevMessages.map((msg) =>
        readStatus.chatRoomId === msg.chatRoomId && readStatus.userId === msg.senderId
          ? { ...msg, isRead: true, readByUsersCount: readStatus.readByUsersCount }
          : msg
      )
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [receivedMessages]);

  const sendMessage = (type = "TALK", customContent = "") => {
    if (!stompClient || !isConnected) {
      alert("WebSocket is not connected.");
      return;
    }
  
    if (!message.trim() && type === "TALK") {
      alert("Message is empty.");
      return;
    }
    
  // 메시지 DTO 생성
  const messageDto = {
    id: `${roomId}-${Date.now()}`,
    content: customContent || message, // 초대 메시지 또는 일반 메시지 내용
    chatRoomId: roomId,
    senderId: userId,
    senderName: username,
    sendAt: new Date().toISOString(),
    messageType: type, // 메시지 타입
  };
  
    console.log("Sending message:", messageDto);
  
    // 메시지를 상태에 추가 (중복 방지)
    setReceivedMessages((prevMessages) => {
      if (prevMessages.some((msg) => msg.id === messageDto.id)) {
        return prevMessages;
      }
      return [...prevMessages, messageDto];
    });
  
    // 메시지 전송
    stompClient.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(messageDto), // 순환 참조 문제 없음
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    setMessage("");
  };

  const leaveChatRoom = async () => {
    try {
      const response = await fetch(`http://localhost:8080/chat/rooms/${roomId}/users`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to leave the chat room");
      }

      console.log("Left chat room successfully.");
      sendMessage("EXIT"); // WebSocket으로 나가기 메시지 전송
    } catch (error) {
      console.error("Error leaving chat room:", error);
    }
  };

  const inviteUser = async (inviteeId) => {
    try {
      const response = await fetch(`http://localhost:8080/chat/rooms/${roomId}/users?userId=${inviteeId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to invite user to chat room");
      }

      console.log(`User ${inviteeId} invited successfully.`);
      sendMessage("ENTER",`${inviteeId}`); // 초대 메시지 타입 전송
    } catch (error) {
      console.error("Error inviting user:", error);
    }
  };
  
// 채팅방 사용자 목록 가져오기
const fetchUserList = async () => {
  try {
    const response = await fetch(`http://localhost:8080/chat/rooms/${roomId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user list");
    }
    const data = await response.json();
    setUserList(data);
  } catch (error) {
    console.error("Error fetching user list:", error);
  }
};

const toggleUserList = () => {
  if (!showUserList) {
    fetchUserList(); // 사용자 목록 가져오기
  }
  setShowUserList(!showUserList); // 팝업 표시/숨기기 토글
};

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8080/chat/rooms/${roomId}/messages`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      const data = await response.json();

      setReceivedMessages((prevMessages) => {
        const uniqueMessages = data.filter(
          (newMessage) => !prevMessages.some((msg) => msg.id === newMessage.id)
        );
        return [...prevMessages, ...uniqueMessages].sort(
          (a, b) => new Date(a.sendAt) - new Date(b.sendAt)
        );
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [receivedMessages]);


  return (
    <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2>Chat Room {roomId}</h2>
      <button onClick={toggleUserList} style={{ cursor: "pointer", fontSize: "1.5em" }}>
        ☰
      </button>
    </div>
    <div>
        <button onClick={leaveChatRoom} style={{ cursor: "pointer", fontSize: "1.5em", marginRight: "10px" }}>
          나가기
        </button>
        <button onClick={() => inviteUser(prompt("Enter user ID to invite:"))} style={{ cursor: "pointer", fontSize: "1.5em" }}>
          초대하기
        </button>
      </div>
    {showUserList && (
      <div
        style={{
          position: "absolute",
          top: "50px",
          right: "10px",
          border: "1px solid #ccc",
          padding: "10px",
          background: "#fff",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          borderRadius: "5px",
        }}
      >
        <h4>Users</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {userList.map((user) => (
            <li key={user.id} style={{ marginBottom: "10px" }}>
              <span>{user.emoji}</span> <strong>{user.name}</strong>
            </li>
          ))}
        </ul>
      </div>
    )}
      <ul style={{ maxHeight: "300px", overflowY: "auto", padding: 0, listStyle: "none" }}>
        {receivedMessages.map((msg) => (
          <li
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: String(msg.senderId) === String(userId) ? "flex-end" : "flex-start",
              margin: "10px 0",
            }}
          >
            <div
              style={{
                maxWidth: "60%",
                padding: "10px",
                borderRadius: "10px",
                backgroundColor: String(msg.senderId) === String(userId) ? "#daf8cb" : "#f1f0f0",
                textAlign: "left",
              }}
            >
              <strong style={{ fontSize: "0.9em", color: "#555" }}>{msg.senderName}</strong>
              <div style={{ marginTop: "5px" }}>{msg.content}</div>
              <div style={{ fontSize: "0.8em", color: "#888", marginTop: "5px" }}>
                <span>{new Date(msg.sendAt).toLocaleString()}</span>
                <span style={{ marginLeft: "10px" }}>
                  {msg.isRead ? "Read" : "Unread"} ({msg.readByUsersCount} users)
                </span>
              </div>
            </div>
          </li>
        ))}
        <div ref={messagesEndRef} />
      </ul>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "80%", padding: "10px", marginRight: "5px", borderRadius: "5px" }}
        />
        <button
      onClick={() => sendMessage()} // 수정: 명시적으로 함수를 호출
      style={{ padding: "10px", borderRadius: "5px" }}
    >
      Send
    </button>

      </div>
    </div>
  );
};

export default ChatRoom;
