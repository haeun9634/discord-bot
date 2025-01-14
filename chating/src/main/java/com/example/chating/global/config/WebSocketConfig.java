package com.example.chating.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker //웹 소켓 활성화
public class WebSockConfig implements WebSocketMessageBrokerConfigurer {
//내장 매시지 브로커
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/sub"); //메시지 브로커의 Prefix 등록, /sub 경로로 요청
        config.setApplicationDestinationPrefixes("/pub");// 도착 경로에 관한 Prefixes ㅓㄹ정.
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-stomp").setAllowedOriginPatterns("*").withSockJS();
        //웹소켓 연결에 필요한 엔드포인트 지정, setAllowed 모든 출처에 대한 Cors 설정
    }

}