const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = '9233588941:AAExCKc9KZjK-UDspUNwIWRUCAEdxV7GnYU';
const ADMIN_ID = '8516187208'; 
const PAYMENT_LINK = 'https://razorpay.me/@VRConnect?amount=CVDUr6Uxp2FOGZGwAHntNg%3D%3D'; 

const app = express();
app.get('/', (req, res) => res.send('Bot is Live!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server running...'));

const bot = new TelegramBot(token, { polling: true });
const users = {}; 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getGreeting = () => ["hie", "hii", "hello", "hiiii", "hyy"][Math.floor(Math.random() * 5)];
const getLocation = () => ["delhi", "mumbai", "jaipur", "pune", "bangalore", "indore", "chandigarh", "bhopal", "ahmedabad"][Math.floor(Math.random() * 9)];
const getAge = () => Math.floor(Math.random() * (35 - 19 + 1)) + 19;
const getTrapName = () => ["Pooja", "Neha", "Simran", "Shweta", "Kavya", "Riya", "Anjali", "Sneha"][Math.floor(Math.random() * 8)];
const getVipName = () => ["Pooja", "Neha", "Simran", "Shweta", "Kavya", "Riya", "Anjali", "Sneha", "Varsha Chouhan"][Math.floor(Math.random() * 9)];

// ==========================================
// 1. WARNING & WELCOME SCREEN
// ==========================================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (users[chatId] && users[chatId].state === 'SUSPENDED') return;

    const warningText = "⚠️ <b>ATTENTION!</b>\n\n<i>Please Talk Respectfully To everyone otherwise we Will block Your Account & Your Age must be 18+</i>";
    const options = {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: "✅ I Agree (18+)", callback_data: "agree_terms" }]] }
    };
    bot.sendMessage(chatId, warningText, options);
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    
    if (users[chatId] && users[chatId].state === 'SUSPENDED') {
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    if (query.data === 'agree_terms') {
        bot.deleteMessage(chatId, query.message.message_id).catch(() => {}); 
        if (!users[chatId]) {
            users[chatId] = { state: 'NEW', isVip: false, vipExpiry: null, msgCount: 0, nudges: [], richaTimeout: null, trapName: getTrapName(), vipName: "", abuseCount: 0 };
        }
        
        const welcomeText = "💖 ✨ <b>WELCOME TO FIND PARTNER</b> ✨ 💖\n\n<i>Nayi chat shuru karne ke liye niche click karein 👇</i>";
        const options = {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: "💞 Find GF 💘", callback_data: "find_gf" }]] }
        };
        bot.sendMessage(chatId, welcomeText, options);
        bot.answerCallbackQuery(query.id);
        return;
    }

    const user = users[chatId];
    if (!user) return;

    if (query.data === 'find_gf') {
        if (user.isVip && user.vipExpiry < Date.now()) {
            user.isVip = false;
            user.state = 'AWAITING_PAYMENT';
        }
        
        if (user.state === 'CHATTING_1' || user.state === 'CHATTING_2' || user.state === 'RICHA_CHAT') {
            bot.answerCallbackQuery(query.id);
            bot.sendMessage(chatId, "<i>Tum pehle se chat mein ho! Upar ladki ke message ka reply karo.</i>", { parse_mode: 'HTML' });
            return;
        }

        bot.answerCallbackQuery(query.id);
        bot.sendMessage(chatId, "<i>Searching GF... ⏳💖</i>", { parse_mode: 'HTML' });
        bot.sendChatAction(chatId, 'typing');
        await sleep(3000); 

        // BUG-FREE LURING TRAP (Aggressive messaging)
        if (user.state === 'NEW' || user.state === 'AWAITING_PAYMENT' || user.state === 'LURING') {
            user.state = 'LURING';
            
            if (user.nudges && user.nudges.length > 0) {
                user.nudges.forEach(clearTimeout);
            }
            user.nudges = [];
            
            const sendTrapMsg = (text, delay) => {
                user.nudges.push(setTimeout(() => { 
                    if (users[chatId] && users[chatId].state === 'LURING') {
                        bot.sendMessage(chatId, `<b>${users[chatId].trapName}:</b> ${text}`, { parse_mode: 'HTML' });
                    }
                }, delay));
            };

            bot.sendMessage(chatId, `<b>${user.trapName}:</b> hii`, { parse_mode: 'HTML' });
            sendTrapMsg('kaha gye', 4000);
            sendTrapMsg('koi h', 8000);
            sendTrapMsg('are u there', 12000);
            sendTrapMsg('bolo', 16000);
            sendTrapMsg('busy ho kya', 20000);
            sendTrapMsg('bologe kuch', 24000);
            sendTrapMsg('name', 28000);
            sendTrapMsg('u from', 32000);
        } 
        else if (user.state === 'CHAT_1_START' && user.isVip) {
            user.state = 'CHATTING_1';
            user.msgCount = 0;
            let newName = getVipName();
            while(newName === user.vipName) newName = getVipName();
            user.vipName = newName;
            bot.sendMessage(chatId, `<b>${user.vipName}:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
        }
        else if (user.state === 'CHAT_2_START' && user.isVip) {
            user.state = 'CHATTING_2';
            user.msgCount = 0;
            let newName = getVipName();
            while(newName === user.vipName) newName = getVipName();
            user.vipName = newName;
            bot.sendMessage(chatId, `<b>${user.vipName}:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
        }
        else if (user.state === 'RICHA_HANDOFF' && user.isVip) {
            bot.sendMessage(chatId, "<b>Richa:</b> name", { parse_mode: 'HTML' });
            user.state = 'RICHA_CHAT';
        }
    }
});

// ==========================================
// 2. MAIN CHAT LOGIC
// ==========================================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    
    // ADMIN MANUAL REPLY
    if (chatId.toString() === ADMIN_ID && msg.reply_to_message) {
        const replyText = msg.reply_to_message.text || msg.reply_to_message.caption;
        if (replyText) {
            const targetUserId = replyText.match(/\[ID: (\d+)\]/)?.[1];
            if (targetUserId && msg.text) {
                bot.sendMessage(targetUserId, `<b>Richa:</b> ${msg.text}`, { parse_mode: 'HTML' });
                if (users[targetUserId] && users[targetUserId].richaTimeout) {
                    clearTimeout(users[targetUserId].richaTimeout);
                    users[targetUserId].richaTimeout = null;
                }
            }
        }
        return;
    }

    const user = users[chatId];
    if (!user || user.state === 'SUSPENDED') return;

    if (user.nudges && user.nudges.length > 0) {
        user.nudges.forEach(clearTimeout);
        user.nudges = [];
    }

    // PAYMENT SCREENSHOT LISTENER
    if (user.state === 'AWAITING_PAYMENT') {
        if (msg.photo || msg.document) {
            bot.sendMessage(ADMIN_ID, `🧾 <b>Payment Proof Received</b> from User [ID: ${chatId}]\nCheck the screenshot and use <code>/approve ${chatId}</code> to activate VIP.`, {parse_mode: 'HTML'});
            bot.forwardMessage(ADMIN_ID, chatId, msg.message_id);
            bot.sendMessage(chatId, "<i>✅ Screenshot received! Admin is verifying your payment. Please wait for approval... ⏳</i>", {parse_mode: 'HTML'});
        } else if (msg.text && !msg.text.startsWith('/')) {
            sendPaywall(chatId);
        }
        return;
    }

    // THE LURING TRAP (Instant Popup on User Reply)
    if (user.state === 'LURING') {
        if (msg.text && msg.text.startsWith('/')) return; 
        user.state = 'AWAITING_PAYMENT';
        sendPaywall(chatId);
        return; 
    }

    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    // VIP AI CHAT
    if (user.state === 'CHATTING_1' || user.state === 'CHATTING_2') {
        let textLower = text.toLowerCase();
        let displayName = user.vipName;
        
        // --- 2 STRIKE ABUSE SYSTEM ---
        if (textLower.match(/\b(ai|chut|sex|chudegi|horny|boobs|dudh|size)\b/)) {
            user.abuseCount = (user.abuseCount || 0) + 1;
            if (user.abuseCount >= 2) {
                user.state = 'SUSPENDED';
                bot.sendMessage(chatId, "🚫 <b>Your Account has been Suspended for violating our policies.</b>", { parse_mode: 'HTML' });
            } else {
                bot.sendMessage(chatId, "⚠️ <b>Last warning Otherwise we will block Your Account Talk Respectfully 🌹</b>", { parse_mode: 'HTML' });
            }
            return; 
        }

        user.msgCount += 1;
        bot.sendChatAction(chatId, 'typing');
        await sleep(1500); 

        const leaveChat = async (nextState) => {
            if (displayName === "Varsha Chouhan") {
                bot.sendMessage(chatId, `<b>Varsha Chouhan:</b> meri insta id lelo varsha_chouhan7268 yaha msg krna 😘`, { parse_mode: 'HTML' });
                await sleep(1500);
            }
            bot.sendMessage(chatId, `<i>*${displayName} has left the chat.*</i> 💔\n\nDusri GF find karne ke liye wapas 'Find GF' dabayein.`, { parse_mode: 'HTML' });
            user.state = nextState;
            sendFindGfButton(chatId);
        };

        let limit = displayName === "Varsha Chouhan" ? 15 : 25;
        if (user.state === 'CHATTING_1' && user.msgCount >= limit) {
            await leaveChat('CHAT_2_START'); return;
        }
        if (user.state === 'CHATTING_2' && user.msgCount >= limit) {
            await leaveChat('RICHA_HANDOFF'); return;
        }

        let reply = "";

        if (textLower.match(/(see u|see you|pic|photo|meet|milna|dekhna|dekhu|mil)/)) {
            let action = Math.random();
            if (action > 0.5) { 
                reply = ["etni jaldi nahi", "nai", "nahi", "no", "baad me"][Math.floor(Math.random()*5)];
            } else { 
                await leaveChat(user.state === 'CHATTING_1' ? 'CHAT_2_START' : 'RICHA_HANDOFF'); return;
            }
        }
        else if (textLower.match(/(insta|\big\b|instagram|number|whatsapp|call|vc|video call|phone|mobile)/)) {
            reply = ["naa", "nahi", "sorry", "abhi ni", "baad me"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/(height|haight|lambai|lambi|tall)/)) {
            reply = ["5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\""][Math.floor(Math.random()*6)];
        }
        else if (textLower.match(/(kya kr|kkrh|kkrho|what do|kya kar|kuch kr|free ho)/)) {
            reply = ["kpde dhoye h", "kuch ni", "nothing", "free hu"][Math.floor(Math.random()*4)];
        }
        else if (textLower.match(/\b(hi|hello|hie|hy|hlo|helo|hey)\b/)) {
            reply = ["hmm", "kaha se ho aap?", "age kya hai tumhari?", "aur btao", "hmm, aap batao"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/\b(naam|name)\b/)) {
            reply = displayName;
        }
        else if (textLower.match(/\b(single)\b/)) {
            reply = ["haa", "yes", "hmm", "han", "haan"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/\b(bf|boyfriend|boy friend)\b/)) {
            reply = ["nahi", "no", "single hu", "naa"][Math.floor(Math.random()*4)];
        }
        else if (textLower.match(/\b(married|shadi|shaadi)\b/)) {
            reply = ["haa", "yes", "hm", "nahi", "no"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/\b(bachhe|bache|kids|child|bacche|bachey)\b/)) {
            reply = "ni h";
        }
        else if (textLower.match(/\b(kese|kesi|hru|how are|kya hal|kya haal)\b/)) {
            reply = ["bdhiya", "good", "mst", "achi", "fine"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/\b(kaha|from|where|jagah|city)\b/)) {
            reply = getLocation();
        }
        else if (textLower.match(/\b(age|saal|umar|old)\b/)) {
            reply = getAge().toString();
        }
        else {
            reply = ["hmm", "acha", "sahi h", "ohh", "nice", "ok", "hm"][Math.floor(Math.random()*7)];
        }

        bot.sendMessage(chatId, `<b>${displayName}:</b> ${reply}`, { parse_mode: 'HTML' });
    }
    
    // ADMIN CHAT (RICHA)
    else if (user.state === 'RICHA_CHAT' && user.isVip) {
        bot.sendMessage(ADMIN_ID, `📩 <b>Message from User</b> [ID: ${chatId}]\n\n${text}`, { parse_mode: 'HTML' });
        
        if (user.richaTimeout) clearTimeout(user.richaTimeout);
        
        user.richaTimeout = setTimeout(() => {
            if (users[chatId] && users[chatId].state === 'RICHA_CHAT') {
                bot.sendMessage(chatId, "<i>*Richa has left the chat.*</i> 💔\n\nDusri GF find karne ke liye wapas 'Find GF' dabayein.", { parse_mode: 'HTML' });
                users[chatId].state = 'CHAT_1_START'; 
                sendFindGfButton(chatId);
            }
        }, 60000); 
    }
});

// ==========================================
// 3. COLORFUL PAYWALL & VIP 
// ==========================================
function sendPaywall(chatId) {
    const paywallText = `🔒 <b>VIP Pass Required</b> ✨\n\nAage baat continue rakhne ke liye 24-hours ka VIP pass lein.\n<b>Membership Fee: ₹99</b>\n\n⚠️ <i>Payment karne ke baad apna Payment Screenshot yahin par bhejein!</i>\n\n<span class="tg-spoiler">This is a strictly digital entertainment service providing 24-hour access to automated virtual personas and manual chat support. By proceeding with the payment, you acknowledge that you are purchasing a digital membership for entertainment purposes only. No physical product is involved, and fees are strictly non-refundable.</span>`;
    
    bot.sendMessage(chatId, paywallText, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: "💖 Pay ₹99 & Unlock Chat ✨", url: PAYMENT_LINK }]] }
    });
}

function sendFindGfButton(chatId) {
    bot.sendMessage(chatId, "Menu:", {
        reply_markup: { inline_keyboard: [[{ text: "💞 Find GF 💘", callback_data: "find_gf" }]] }
    });
}

bot.onText(/\/approve (.+)/, (msg, match) => {
    if (msg.chat.id.toString() !== ADMIN_ID) return;
    
    const targetId = match[1];
    if (users[targetId]) {
        users[targetId].isVip = true;
        users[targetId].vipExpiry = Date.now() + (24 * 60 * 60 * 1000); 
        users[targetId].state = 'CHAT_1_START';
        bot.sendMessage(ADMIN_ID, `✅ User ${targetId} VIP activated for 24h.`);
        bot.sendMessage(targetId, "✅ <b>Payment Successful!</b> ✨\nVIP Pass Active for 24 hours.\n\nNayi chat ke liye niche click kare 👇", {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: "💞 Find GF 💘", callback_data: "find_gf" }]] }
        });
    }
});
                 
