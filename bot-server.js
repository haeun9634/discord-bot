const express = require('express');
const { sendAuthRequest } = require('./bot'); 
require('dotenv').config();

const app = express();
app.use(express.json());

// Spring Boot에서 인증 요청을 보낼 때 실행
app.post('/send-auth', async (req, res) => {
    const { user, requestDTO } = req.body;
    if (!user || !requestDTO) {
        return res.status(400).json({ error: "Invalid request data" });
    }

    try {
        await sendAuthRequest(user, requestDTO);
        res.status(200).json({ message: "인증 요청 전송 성공" });
    } catch (error) {
        console.error("인증 요청 실패:", error);
        res.status(500).json({ error: "인증 요청 실패" });
    }
});

// Node.js 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Node.js 서버 실행 중: http://localhost:${PORT}`);
});
