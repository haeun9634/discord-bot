package com.example.domain.chat.Controller;

import com.example.domain.chat.*;
import com.example.domain.chat.Repository.ChatRoomRepository;
import com.example.domain.chat.Service.ChatRoomService;
import com.example.domain.chat.Service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.socket.WebSocketSession;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatRoomService chatRoomService;
    private final MessageService messageService;

    @PostMapping("/rooms")
    public ResponseEntity<ChatRoom> createChatRoom(@RequestBody String name) {
        return ResponseEntity.ok(chatRoomService.createChatRoom(name));
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Void> deleteChatRoom(@PathVariable Long id) {
        chatRoomService.deleteChatRoom(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/rooms/{roomId}/users/{userId}")
    public ResponseEntity<Void> addUserToChatRoom(@PathVariable Long roomId, @PathVariable Long userId) {
        chatRoomService.addUserToChatRoom(roomId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/rooms/{roomId}/users/{userId}")
    public ResponseEntity<Void> removeUserFromChatRoom(@PathVariable Long roomId, @PathVariable Long userId) {
        chatRoomService.removeUserFromChatRoom(roomId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/messages")
    public ResponseEntity<Void> sendMessage(@RequestBody MessageDto messageDto) {
        messageService.saveMessage(messageDto.getChatRoomId(), messageDto.getSenderId(), messageDto.getContent());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<Message>> getMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(messageService.getMessagesByChatRoom(roomId));
    }
    private WebSocketChatHandler webSocketChatHandler;

    @PostMapping("/rooms/{roomId}/connect")
    public ResponseEntity<Void> connectToChatRoom(@PathVariable Long roomId, WebSocketSession session) {
        webSocketChatHandler.joinChatRoom(roomId, session);
        return ResponseEntity.ok().build();
    }

}
