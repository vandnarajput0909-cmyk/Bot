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

// TRAP NAMES (Before Payment - No Varsha)
const getTrapName = () => ["Pooja", "Neha", "Simran", "Shweta", "Kavya", "Riya", "Anjali", "Sneha"][Math.floor(Math.random() * 8)];
// VIP NAMES (After Payment - Varsha Included)
const getVipName = () => ["Pooja", "Neha", "Simran", "Shweta", "Kavya", "Riya", "Anjali", "Sneha", "Varsha Chouhan"][Math.floor(Math.random() * 9)];

// ==========================================
// 1. WARNING & WELCOME SCREEN
// ==========================================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const warningText = "⚠️ <b>ATTENTION!</b>\n\n<i>Please Talk Respectfully To everyone otherwise we Will block Your Account & Your Age must be 18+</i>";
    const options = {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: "✅ I Agree (18+)", callback_data: "agree_terms" }]] }
    };
    bot.sendMessage(chatId, warningText, options);
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    
    if (query.data === 'agree_terms') {
        bot.deleteMessage(chatId, query.message.message_id).catch(() => {}); 
        
        if (!users[chatId]) {
            users[chatId] = { state: 'NEW', isVip: false, vipExpiry: null, msgCount: 0, nudges: [], richaTimeout: null, trapName: getTrapName(), vipName: "" };
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
        
        // Prevent restarting if already in a chat
        if (user.state === 'CHATTING_1' || user.state === 'CHATTING_2' || user.state === 'RICHA_CHAT') {
            bot.answerCallbackQuery(query.id);
            bot.sendMessage(chatId, "<i>Tum pehle se chat mein ho! Upar ladki ke message ka reply karo.</i>", { parse_mode: 'HTML' });
            return;
        }

        bot.answerCallbackQuery(query.id);
        bot.sendMessage(chatId, "<i>Searching GF... ⏳💖</i>", { parse_mode: 'HTML' });
        bot.sendChatAction(chatId, 'typing');
        await sleep(3000); 

        // Luring Phase (Trap)
        if (user.state === 'NEW' || user.state === 'AWAITING_PAYMENT') {
            user.state = 'LURING';
            user.nudges = [];
            bot.sendMessage(chatId, `<b>${user.trapName}:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
            
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'LURING') bot.sendMessage(chatId, `<b>${user.trapName}:</b> name ?`, { parse_mode: 'HTML' }) }, 5000));
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'LURING') bot.sendMessage(chatId, `<b>${user.trapName}:</b> aap kaha se ho`, { parse_mode: 'HTML' }) }, 10000));
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'LURING') bot.sendMessage(chatId, `<b>${user.trapName}:</b> are u there`, { parse_mode: 'HTML' }) }, 15000));
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'LURING') bot.sendMessage(chatId, `<b>${user.trapName}:</b> ??`, { parse_mode: 'HTML' }) }, 20000));
        } 
        
        // VIP CHAT 1
        else if (user.state === 'CHAT_1_START' && user.isVip) {
            user.state = 'CHATTING_1';
            user.msgCount = 0;
            // Get new random name avoiding previous name
            let newName = getVipName();
            while(newName === user.vipName) newName = getVipName();
            user.vipName = newName;
            
            bot.sendMessage(chatId, `<b>${user.vipName}:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
        }
        
        // VIP CHAT 2
        else if (user.state === 'CHAT_2_START' && user.isVip) {
            user.state = 'CHATTING_2';
            user.msgCount = 0;
            let newName = getVipName();
            while(newName === user.vipName) newName = getVipName();
            user.vipName = newName;

            bot.sendMessage(chatId, `<b>${user.vipName}:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
        }
        
        // RICHA MANUAL HANDOFF
        else if (user.state === 'RICHA_HANDOFF' && user.isVip) {
            bot.sendMessage(chatId, "<b>Richa:</b> name", { parse_mode: 'HTML' });
            user.state = 'RICHA_CHAT';
        }
    }
});

// ==========================================
// 2. SMART CHAT, ABUSE FILTER & VARSHA LOGIC
// ==========================================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!text || text.startsWith('/')) return;

    if (chatId.toString() === ADMIN_ID && msg.reply_to_message) {
        const replyText = msg.reply_to_message.text;
        const targetUserId = replyText.match(/\[ID: (\d+)\]/)?.[1];
        if (targetUserId) {
            bot.sendMessage(targetUserId, `<b>Richa:</b> ${text}`, { parse_mode: 'HTML' });
            if (users[targetUserId] && users[targetUserId].richaTimeout) {
                clearTimeout(users[targetUserId].richaTimeout);
                users[targetUserId].richaTimeout = null;
            }
        }
        return;
    }

    const user = users[chatId];
    if (!user) return;

    if (user.nudges && user.nudges.length > 0) {
        user.nudges.forEach(clearTimeout);
        user.nudges = [];
    }

    // THE LURING TRAP (First Reply = Paywall)
    if (user.state === 'LURING') {
        user.state = 'AWAITING_PAYMENT';
        sendPaywall(chatId);
        return; 
    }

    // AI CHAT
    if (user.state === 'CHATTING_1' || user.state === 'CHATTING_2') {
        let textLower = text.toLowerCase();
        let displayName = user.vipName;
        
        // --- ABUSE & AI FILTER ---
        if (textLower.match(/\b(ai|chut|sex|chudegi|horny|boobs|dudh|size)\b/)) {
            bot.sendMessage(chatId, "⚠️ <b>Last warning Otherwise we will block Your Account Talk Respectfully 🌹</b>", { parse_mode: 'HTML' });
            return; 
        }

        user.msgCount += 1;
        bot.sendChatAction(chatId, 'typing');
        await sleep(1500); 

        // HELPER FUNCTION: To handle leaving including Varsha's Insta Drop
        const leaveChat = async (nextState) => {
            if (displayName === "Varsha Chouhan") {
                bot.sendMessage(chatId, `<b>Varsha Chouhan:</b> meri insta id lelo varsha_chouhan7268 yaha msg krna 😘`, { parse_mode: 'HTML' });
                await sleep(1500);
            }
            bot.sendMessage(chatId, `<i>*${displayName} has left the chat.*</i> 💔\n\nDusri GF find karne ke liye wapas 'Find GF' dabayein.`, { parse_mode: 'HTML' });
            user.state = nextState;
            sendFindGfButton(chatId);
        };

        // Chat Limits (Varsha leaves at 15 for "thodi baat", others at 25)
        let limit = displayName === "Varsha Chouhan" ? 15 : 25;
        if (user.state === 'CHATTING_1' && user.msgCount >= limit) {
            await leaveChat('CHAT_2_START'); return;
        }
        if (user.state === 'CHATTING_2' && user.msgCount >= limit) {
            await leaveChat('RICHA_HANDOFF'); return;
        }

        let reply = "";

        // RULES
        if (textLower.match(/(insta|ig|instagram|number|no\.|whatsapp|call|vc|video call|phone)/)) {
            reply = ["naa", "nahi", "sorry", "abhi ni", "baad me"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/(see u|see you|pic|photo|meet|milna|dekhna|dekhu|mil)/)) {
            let action = Math.random();
            if (action > 0.5) { 
                reply = ["etni jaldi nahi", "nai", "nahi", "no", "baad me"][Math.floor(Math.random()*5)];
            } else { 
                await leaveChat(user.state === 'CHATTING_1' ? 'CHAT_2_START' : 'RICHA_HANDOFF'); return;
            }
        }
        else if (textLower.match(/(height|lambi|lambai|tall)/)) {
            reply = ["5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\""][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/(hi|hello|hie|hy|hlo|helo|hey)/)) {
            reply = "hmm";
        }
        else if (textLower.match(/(naam|name)/)) {
            reply = displayName;
        }
        else if (textLower.match(/(married|shadi|shaadi)/)) {
            reply = ["haa", "yes", "hm", "nahi", "no"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/(bachhe|bache|kids|child|bacche|bachey)/)) {
            reply = "ni h";
        }
        else if (textLower.match(/(kese|kesi|hru|how are|kya hal|kya haal)/)) {
            reply = ["bdhiya", "good", "mst", "achi", "fine"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/(kaha|from|where|jagah|city)/)) {
            reply = getLocation();
        }
        else if (textLower.match(/(age|saal|umar|old)/)) {
            reply = getAge().toString();
        }
        else {
            reply = ["hmm", "acha", "sahi h", "ohh", "nice", "ok"][Math.floor(Math.random()*6)];
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
    const paywallText = `🔒 <b>VIP Pass Required</b> ✨\n\nAage baat continue rakhne ke liye 24-hours ka VIP pass lein.\n<b>Membership Fee: ₹99</b>\n\n<span class="tg-spoiler">This is a strictly digital entertainment service providing 24-hour access to automated virtual personas and manual chat support. By proceeding with the payment, you acknowledge that you are purchasing a digital membership for entertainment purposes only. No physical product is involved, and fees are strictly non-refundable.</span>`;
    
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
