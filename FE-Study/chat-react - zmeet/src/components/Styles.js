import styled from "styled-components";

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

export const Button = styled.button`
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
  color: #fff;
  cursor: pointer;

  ${({ variant }) =>
    variant === "leave"
      ? `background: #ff4d4d; margin-left: 10px;`
      : `background: #4d79ff;`}
`;

export const MessageList = styled.ul`
  max-height: 400px;
  overflow-y: auto;
  padding: 0;
  list-style: none;
  width: 100%;
`;

export const MessageItem = styled.li`
  display: flex;
  justify-content: ${({ isMine }) => (isMine ? "flex-end" : "flex-start")};
  margin: 10px 0;
  align-items: center;
`;

export const ProfileImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: ${({ isMine }) => (isMine ? "0 10px 0 0" : "0 0 0 10px")};
`;

export const MessageBubble = styled.div`
  max-width: 60%;
  padding: 10px;
  border-radius: 10px;
  background-color: ${({ isMine }) => (isMine ? "#daf8cb" : "#f1f0f0")};
  text-align: left;
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const SenderName = styled.strong`
  font-size: 0.9em;
  color: #555;
`;

export const MessageContent = styled.div`
  margin-top: 5px;
`;

export const Emoji = styled.span`
  font-size: 1.5em;
`;

export const MessageTime = styled.div`
  font-size: 0.8em;
  color: #888;
  margin-top: 5px;
`;

export const InputContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
`;

export const MessageInput = styled.input`
  width: 80%;
  padding: 10px;
  margin-right: 5px;
  border-radius: 5px;
`;

export const SendButton = styled.button`
  padding: 10px;
  border-radius: 5px;
`;
