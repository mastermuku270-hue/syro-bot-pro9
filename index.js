const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startSyroBotPro() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Syro Bot Pro', 'Chrome'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
    });

    // Pairing Code for Railway
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER;
        if (!phoneNumber) {
            console.log("❌ PHONE_NUMBER environment variable set nahi hai!");
            process.exit(1);
        }

        console.log(`\n🔥 [ SYRO BOT PRO ]`);
        console.log(`📱 Number: ${phoneNumber}`);

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n✅ PAIRING CODE: ${code}`);
                console.log(`WhatsApp पर जाकर ये code डाल दो`);
            } catch (err) {
                console.log("❌ Pairing error:", err);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('\n✅ [ SYRO BOT PRO ] Connected Successfully!');
        }
        if (connection === 'close') {
            console.log('❌ Connection closed');
            if (lastDisconnect?.error?.output?.statusCode !== 401) {
                setTimeout(() => startSyroBotPro(), 5000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const command = text.trim().toLowerCase();

        // +menu Command
        if (command === '+menu') {
            const ping = Date.now() - Date.now(); // simple ping

            const options = { timeZone: 'Asia/Kolkata' };
            const currentTime = new Date().toLocaleTimeString('en-IN', options);
            const currentDate = new Date().toLocaleDateString('en-IN', options);

            const menu = `🔥 *SYRO BOT PRO* 🔥\n\n` +
                        `⏰ Time: ${currentTime}\n` +
                        `📅 Date: ${currentDate}\n` +
                        `📍 Ping: ${ping}ms\n\n` +
                        `✅ Bot is Running!`;

            await sock.sendMessage(from, { text: menu });
        }
    });

    console.log("🤖 Bot Started...");
}

// Start the bot
startSyroBotPro().catch(err => {
    console.error("❌ Bot crashed:", err);
    process.exit(1);
});
