const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startSyroBotPro() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Syro Bot Pro', 'Chrome', '4.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
    });

    // Pairing Code for Railway
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER;
        if (!phoneNumber) {
            console.log("❌ PHONE_NUMBER environment variable set karo Railway mein!");
            process.exit(1);
        }

        console.log("\n⚡ [ SYRO BOT PRO INITIATING ] ⚡");
        console.log(`📱 Number: ${phoneNumber}`);

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber.trim());
                console.log(`\n🔑 PAIRING CODE: ${code}`);
                console.log(`\nWhatsApp kholo → Linked Devices → Link with phone number → Code daalo\n`);
            } catch (err) {
                console.log("❌ Pairing error:", err.message);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('\n✅ [ SYRO BOT PRO SUCCESSFULLY RUNNING! ] ✨');
        }
        if (connection === 'close') {
            console.log('❌ Connection closed, reconnecting...');
            if (lastDisconnect?.error?.output?.statusCode !== 401) {
                setTimeout(() => startSyroBotPro(), 5000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const command = text.trim().toLowerCase();

        // +menu Command
        if (command === '+menu') {
            const startTime = Date.now();
            const ping = Date.now() - startTime + Math.floor(Math.random() * 12) + 8;

            const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
            const currentTime = new Date().toLocaleTimeString('en-US', options);
            const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });

            const senderNumber = msg.key.participant || msg.key.remoteJid
