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

// ==========================================
// 1. WARNING & WELCOME SCREEN
// ==========================================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const warningText = "⚠️ <b>ATTENTION!</b>\n\n<i>Please Talk Respectfully To everyone otherwise we Will block Your Account & Your Age must be 18+</i>";
    
    const options = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [[{ text: "✅ I Agree (18+)", callback_data: "agree_terms" }]]
        }
    };
    bot.sendMessage(chatId, warningText, options);
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    
    // Agar Agree button dabaya gaya
    if (query.data === 'agree_terms') {
        bot.deleteMessage(chatId, query.message.message_id).catch(() => {}); // Purana warning message hata dega
        
        if (!users[chatId]) {
            users[chatId] = { state: 'NEW', isVip: false, vipExpiry: null, msgCount: 0, nudges: [] };
        }
        
        const welcomeText = "💖 ✨ <b>WELCOME TO FIND PARTNER</b> ✨ 💖\n\n<i>Nayi chat shuru karne ke liye niche click karein 👇</i>";
        const options = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: "💞 Find GF 💘", callback_data: "find_gf" }]]
            }
        };
        bot.sendMessage(chatId, welcomeText, options);
        bot.answerCallbackQuery(query.id);
        return;
    }

    const user = users[chatId] || { state: 'NEW', isVip: false, vipExpiry: null, msgCount: 0, nudges: [] };
    users[chatId] = user;

    if (query.data === 'find_gf') {
        if (user.isVip && user.vipExpiry < Date.now()) {
            user.isVip = false;
            user.state = 'AWAITING_PAYMENT';
        }
        bot.answerCallbackQuery(query.id);
        
        bot.sendMessage(chatId, "<i>Searching GF... ⏳💖</i>", { parse_mode: 'HTML' });
        bot.sendChatAction(chatId, 'typing');
        await sleep(3000); 

        if (user.state === 'NEW' || user.state === 'PUJA_START' || user.state === 'AWAITING_PAYMENT') {
            user.state = 'PUJA_CHATTING';
            user.msgCount = 0;
            user.nudges = [];
            bot.sendMessage(chatId, `<b>Pooja:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
            
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'PUJA_CHATTING' && users[chatId].msgCount === 0) bot.sendMessage(chatId, "<b>Pooja:</b> kya name h tumhara", { parse_mode: 'HTML' }) }, 6000));
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'PUJA_CHATTING' && users[chatId].msgCount === 0) bot.sendMessage(chatId, "<b>Pooja:</b> ??", { parse_mode: 'HTML' }) }, 12000));
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'PUJA_CHATTING' && users[chatId].msgCount === 0) bot.sendMessage(chatId, "<b>Pooja:</b> hello are u there", { parse_mode: 'HTML' }) }, 18000));
        } 
        else if (user.state === 'SHWETA_START' && user.isVip) {
            user.state = 'SHWETA_CHATTING';
            user.msgCount = 0;
            bot.sendMessage(chatId, `<b>Shweta:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
        }
        else if (user.state === 'SIMRAN_START' && user.isVip) {
            user.state = 'SIMRAN_CHATTING';
            user.msgCount = 0;
            bot.sendMessage(chatId, `<b>Simran:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
        }
        else if (user.state === 'RICHA_HANDOFF' && user.isVip) {
            bot.sendMessage(chatId, "<b>Richa:</b> hii main richa, aur btao kya chl ra h", { parse_mode: 'HTML' });
            user.state = 'RICHA_CHAT';
        }
        else if (!user.isVip) {
            sendPaywall(chatId);
        }
    }
});

// ==========================================
// 2. SMART CHAT & KEYWORDS
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
        }
        return;
    }

    const user = users[chatId];
    if (!user) return;

    if (user.nudges && user.nudges.length > 0) {
        user.nudges.forEach(clearTimeout);
        user.nudges = [];
    }

    if (user.state === 'PUJA_CHATTING' || user.state === 'SHWETA_CHATTING' || user.state === 'SIMRAN_CHATTING') {
        user.msgCount += 1;
        bot.sendChatAction(chatId, 'typing');
        await sleep(1500); 

        if (user.state === 'PUJA_CHATTING' && user.msgCount >= 3) {
            bot.sendMessage(chatId, "<i>*Pooja has left the chat.*</i> 💔", { parse_mode: 'HTML' });
            setTimeout(() => sendPaywall(chatId), 1000);
            user.state = 'AWAITING_PAYMENT';
            return;
        }
        if (user.state === 'SHWETA_CHATTING' && user.msgCount >= 4) {
            bot.sendMessage(chatId, "<i>*Shweta has left the chat.*</i> 💔\n\nDusri GF find karne ke liye wapas 'Find GF' dabayein.", { parse_mode: 'HTML' });
            user.state = 'SIMRAN_START';
            sendFindGfButton(chatId);
            return;
        }
        if (user.state === 'SIMRAN_CHATTING' && user.msgCount >= 4) {
            bot.sendMessage(chatId, "<i>*Simran has left the chat.*</i> 💔\n\nDusri GF find karne ke liye wapas 'Find GF' dabayein.", { parse_mode: 'HTML' });
            user.state = 'RICHA_HANDOFF';
            sendFindGfButton(chatId);
            return;
        }

        let textLower = text.toLowerCase();
        let reply = "";
        let persona = user.state.split('_')[0]; 
        let displayName = persona === 'PUJA' ? 'Pooja' : (persona === 'SHWETA' ? 'Shweta' : 'Simran');

        if (textLower.match(/(kese|kesi|hru|how are|kya hal|kya haal)/)) {
            if (persona === 'PUJA') reply = "fine";
            else if (persona === 'SHWETA') reply = "bdhiya";
            else reply = "good";
        }
        else if (textLower.match(/(kaha|from|where|jagah|city)/)) {
            reply = getLocation();
        }
        else if (textLower.match(/(age|saal|umar|old)/)) {
            reply = getAge().toString();
        }
        else {
            reply = ["hmm", "acha", "sahi h", "ohh", "nice"][Math.floor(Math.random()*5)];
        }

        bot.sendMessage(chatId, `<b>${displayName}:</b> ${reply}`, { parse_mode: 'HTML' });
    }
    else if (user.state === 'RICHA_CHAT' && user.isVip) {
        bot.sendMessage(ADMIN_ID, `📩 <b>Message from User</b> [ID: ${chatId}]\n\n${text}`, { parse_mode: 'HTML' });
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
        users[targetId].state = 'SHWETA_START';
        bot.sendMessage(ADMIN_ID, `✅ User ${targetId} VIP activated for 24h.`);
        bot.sendMessage(targetId, "✅ <b>Payment Successful!</b> ✨\nVIP Pass Active for 24 hours.\n\nNayi chat ke liye niche click kare 👇", {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: "💞 Find GF 💘", callback_data: "find_gf" }]] }
        });
    }
});
