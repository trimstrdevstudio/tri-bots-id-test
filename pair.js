const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const MESSAGE = process.env.MESSAGE || `
*TRI BOTS ID - SESSION GENERATED SUCCESSFULLY* ✅

*Your WhatsApp session is now connected!*
You can use this session with any TRI BOTS ID compatible bot

*🌟 STAR OUR REPOSITORY 🌟*
https://github.com/tri-mstr-dev/TRI-CONTROLS-BOT

*💬 SUPPORT & UPDATES 💬*
https://whatsapp.com/channel/0029VazawLiDp2QEO1Ttwg28

*🛠️ DEVELOPED BY 🛠️*
TRI MSTR DEV STUDIO

*🤖 TRI CONTROLS BOT 🤖*
Advanced WhatsApp Bot Solution
`;

const uploadToPastebin = require('./Paste');  // Assuming you have a function to upload to Pastebin
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");

// Ensure the directory is empty when the app starts
if (fs.existsSync('./auth_info_baileys')) {
    fs.emptyDirSync(__dirname + '/auth_info_baileys');
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    async function TRI_BOTS_ID() {
        const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_baileys`);
        try {
            let TriSocket = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
            });

            if (!TriSocket.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await TriSocket.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            TriSocket.ev.on('creds.update', saveCreds);
            TriSocket.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    try {
                        await delay(10000);
                        if (fs.existsSync('./auth_info_baileys/creds.json'));

                        const auth_path = './auth_info_baileys/';
                        let user = TriSocket.user.id;

                        // Upload the creds.json to Pastebin directly
                        const credsFilePath = auth_path + 'creds.json';
                        const pastebinUrl = await uploadToPastebin(credsFilePath, 'creds.json', 'json', '1');

                        const Session_Id = pastebinUrl;  // Use the Pastebin URL as the session ID

                        let msgsss = await TriSocket.sendMessage(user, { text: Session_Id });
                        await TriSocket.sendMessage(user, { text: MESSAGE }, { quoted: msgsss });
                        await delay(1000);
                        try { await fs.emptyDirSync(__dirname + '/auth_info_baileys'); } catch (e) {}

                    } catch (e) {
                        console.log("Error during file upload or message send: ", e);
                    }

                    await delay(100);
                    await fs.emptyDirSync(__dirname + '/auth_info_baileys');
                }

                // Handle connection closures
                if (connection === "close") {
                    let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                    if (reason === DisconnectReason.connectionClosed) {
                        console.log("Connection closed!");
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.log("Connection Lost from Server!");
                    } else if (reason === DisconnectReason.restartRequired) {
                        console.log("Restart Required, Restarting...");
                        TRI_BOTS_ID().catch(err => console.log(err));
                    } else if (reason === DisconnectReason.timedOut) {
                        console.log("Connection TimedOut!");
                    } else {
                        console.log('Connection closed with bot. Please run again.');
                        console.log(reason);
                        await delay(5000);
                        exec('pm2 restart tri-bots-id');
                    }
                }
            });

        } catch (err) {
            console.log("Error in TRI_BOTS_ID function: ", err);
            exec('pm2 restart tri-bots-id');
            console.log("Service restarted due to error");
            TRI_BOTS_ID();
            await fs.emptyDirSync(__dirname + '/auth_info_baileys');
            if (!res.headersSent) {
                await res.send({ code: "Try After Few Minutes" });
            }
        }
    }

   return await TRI_BOTS_ID();
});

module.exports = router;