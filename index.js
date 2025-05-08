const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');


const client = new Client({
    authStrategy: new LocalAuth({ 
        clientId: 'bot-JSSOFTWARE', //coloque aqui o nome da sessão para multiplos numeros
        dataPath: './sessao' 
    }) 
});

let IA_On = false;
let knownNumbers = new Set();

// Adicione no topo do index.js
const fs = require('fs');

const FILE_PATH = './contatos.json';

// Carrega contatos salvos
if (fs.existsSync(FILE_PATH)) {
    try {
        const saved = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
        knownNumbers = new Set(saved);
    } catch (err) {
        console.error('Erro ao ler contatos salvos:', err);
    }
}

// Salva contatos quando adiciona novo
function saveContacts() {
    fs.writeFileSync(FILE_PATH, JSON.stringify([...knownNumbers]));
}

client.on('authenticated', () => {
    console.log('✅ Sessão autenticada com sucesso!');
});

client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('\n🔗 QR Code string:\n' + qr);
});

client.on('ready', () => {
    console.log('🤖 Bot pronto para uso!');
});

client.on('message', async (message) => {
    const from = message.from;

    if (!knownNumbers.has(from)) {
        knownNumbers.add(from);
        saveContacts();

        await message.reply(
            '👋 Olá, seja bem-vindo!\nDigite:\n1️⃣ - Financeiro\n2️⃣ - Vendas\n3️⃣ - Suporte\n4 - Entre em contato comigo\n5 - Conversar com a IA'
        );
    } else {
        if (message.body.trim() == 'sair'){
            IA_On = false;
            knownNumbers.delete(from);
            saveContacts();

            client.sendMessage(
                from, 
                'Atendimento finalizado!'
            );
            return;
        }


        if (IA_On) {
            // message.reply('Você disse: \n' + message.body.trim());
            //IA responde
            try {
                const response = await axios.post('https://leoia.onrender.com/perguntar', {
                    texto: message.body.trim()
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
        
                message.reply('📨 Resposta recebida:\n' + response.data.choices[0].message.content);
            } catch (error) {
                console.error('Erro na requisição:', error.response?.data || error.message);
                message.reply('❌ Ocorreu um erro ao enviar a pergunta. Tente novamente mais tarde.');
            }

            return;
        }
        
        switch (message.body.trim()) {            
            
            case '1':
                message.reply(
                    '💰 Você escolheu *Financeiro*. Clique no link abaixo para falar com nosso atendimento:\n\n' +
                    '👉 https://wa.me/5565999547048'
                );
                //reiniciar o contato com o bot
                knownNumbers.delete(from);
                saveContacts();
                break;
            case '2':
                message.reply('🛒 Você escolheu *Vendas*. Um atendente irá te chamar!');
                break;
            case '3':
                message.reply('🛠 Você escolheu *Suporte*. Em instantes você será atendido.');
                break;
            case '4':
                message.reply(
                    '💰 *Contato solicitado!*\n\n🔄 Estamos direcionando sua solicitação para o setor responsável.\n📞 Um de nossos atendentes entrará em contato com você em instantes.'
                );
                // Opcional: envia notificação para o atendente real
                const suporte = '556599547048'; // formato JID
                client.sendMessage(`${suporte}@c.us`, `📬 Novo cliente interessado em *Contato direto*: https://wa.me/${from}`);    
                break;
            case '5':
                IA_On = true;
                message.reply(
                    'Agora todas as mensagem enviadas serão respondidas por IA.'
                );  
                break;
            default:
                message.reply('❓ Opção inválida. Digite 1, 2, 3 ou 4.');
        }

    }
});

// console.log('🔐 Tentando carregar a sessão de ./sessao/session-bot-JSSOFTWARE/');
client.initialize();
