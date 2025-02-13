require('dotenv').config();
const axios = require('axios'); 
const { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // 서버 관련 이벤트
        GatewayIntentBits.GuildMessages,    // 메시지 읽기
        GatewayIntentBits.MessageContent    // 메시지 내용 읽기
    ]
});

client.once(Events.ClientReady, () => {
    // console.log(`✅ 디스코드 봇이 로그인되었습니다: ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    // 버튼의 custom_id 값 확인 (approve_12345 또는 reject_12345 형태)
    const [action, userId] = interaction.customId.split('_');

    if (!userId) {
        return interaction.reply({ content: "❌ 오류 발생: 사용자 ID 없음", ephemeral: true });
    }

    // console.log(`🔗 Spring Boot API 호출: userId=${userId}, action=${action}`);

    // Spring Boot API 호출
    try {
        const response = await axios.patch(`${process.env.SPRING_SERVER_URL}/api/auth/user/verify`, null, {
            params: {
                userId: userId,
                approved: action === 'approve'
            }
        });

        console.log(`✅ Spring Boot 응답: ${response.data}`);
        await interaction.reply({ content: `처리 완료: ${action === 'approve' ? '✅ 승인' : '❌ 거절'}`, ephemeral: true });
    } catch (error) {
        console.error("🚨 Spring Boot API 호출 실패:", error);
        await interaction.reply({ content: "❌ 처리 중 오류 발생", ephemeral: true });
    }
});


// ✅ 인증 요청 메시지 전송 함수
async function sendAuthRequest(user, requestDTO) {
    try {
        const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);

        // ✅ Embed 메시지 생성
        const embed = new EmbedBuilder()
            .setTitle("📢 인증 요청")
            .setDescription(requestDTO.content)
            .setImage(requestDTO.imgUrl)
            .setColor(0x00FF00); // 초록색

        // ✅ 버튼 추가
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_${user.id}`)
                    .setLabel("승인 ✅")
                    .setStyle(ButtonStyle.Success), // 녹색
                new ButtonBuilder()
                    .setCustomId(`reject_${user.id}`)
                    .setLabel("거절 ❌")
                    .setStyle(ButtonStyle.Danger) // 빨간색
            );

        // ✅ 디스코드 채널에 메시지 전송
        await channel.send({
            content: `**${user.name} 께서 인증을 요청하셨어요 ! `,
            embeds: [embed],
            components: [buttons]
        });

        console.log("✅ 인증 요청 메시지 전송 성공");
    } catch (error) {
        console.error("🚨 인증 요청 메시지 전송 실패:", error);
    }
}

// ✅ 디스코드 봇 로그인
client.login(process.env.DISCORD_TOKEN);

// ✅ Spring Boot에서 메시지 요청을 받을 때 실행
module.exports = { sendAuthRequest };
