require('dotenv').config();
const axios = require('axios'); 
const { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, () => {
    console.log(`✅ 디스코드 봇이 로그인되었습니다: ${client.user.tag}`);
});

// ✅ Interaction 처리
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    const [action, userId] = interaction.customId.split('_');

    if (!userId) {
        await interaction.reply({ content: "❌ 오류 발생: 사용자 ID 없음", ephemeral: true });
        return;
    }

    try {
        // ✅ Interaction 만료 방지를 위해 즉시 응답 (3초 제한 방지)
        await interaction.deferReply({ ephemeral: true });

        // ✅ Spring Boot API 호출
        const response = await axios.patch(`${process.env.SPRING_SERVER_URL}/api/auth/user/verify`, null, {
            params: {
                userId: userId,
                approved: action === 'approve'
            }
        });

        console.log(`✅ Spring Boot 응답: ${JSON.stringify(response.data)}`);

        // ✅ Interaction이 만료되지 않았다면 editReply() 실행
        try {
            await interaction.editReply({ content: `✅ 처리 완료: ${action === 'approve' ? '승인 ✅' : '거절 ❌'}` });
        } catch (editError) {
            console.error("🚨 editReply() 응답 실패:", editError);
            if (editError.code === 'InteractionNotReplied') {
                await interaction.followUp({ content: "❌ 응답 시간이 초과되었습니다. 다시 시도해주세요.", ephemeral: true });
            }
        }

    } catch (error) {
        console.error("🚨 Spring Boot API 호출 실패:", error);

        if (error.response && error.response.status === 404) {
            console.warn("⚠ Unknown interaction - 응답이 만료됨. followUp()으로 처리");
            try {
                await interaction.followUp({ content: "❌ 응답 시간이 초과되었습니다. 다시 시도해주세요.", ephemeral: true });
            } catch (followUpError) {
                console.error("🚨 followUp() 응답 실패:", followUpError);
            }
            return;
        }

        try {
            await interaction.editReply({ content: "❌ 처리 중 오류 발생" });
        } catch (editError) {
            console.error("🚨 editReply() 응답 실패:", editError);
        }
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
            .setColor(0x00FF00);

        // ✅ 버튼 추가
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_${user.id}`)
                    .setLabel("승인 ✅")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`reject_${user.id}`)
                    .setLabel("거절 ❌")
                    .setStyle(ButtonStyle.Danger)
            );

        // ✅ 디스코드 채널에 메시지 전송
        await channel.send({
            content: `**${user.name} 께서 인증을 요청하셨어요!**`,
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
