# ⚡ Alphatrader — Robô de Trading Automatizado para Binance

App React Native (Expo) com IA para trading automatizado de criptomoedas na Binance.

---

## 📱 Funcionalidades

- **Motor de IA Avançado**: Integração de RSI (14) + Cruzamento de Médias Móveis (EMA 20/50)
- **Trailing Stop Dinâmico**: Proteção de lucro automática que acompanha a subida do preço
- **Gestão de Risco**: Stop-loss de segurança (1.5%) e micro-trades (1.5% do saldo)
- **Zapia Bridge**: Controle remoto total (Start/Stop/Status) via Zapia (Gist Integration)
- **Modo Demo**: Simulação realista com saldo fictício para testes seguros
- **Tema Cyberpunk**: UI otimizada com feedbacks visuais neon e progresso de meta

---

## 🚀 Como Testar com Expo Go

### Pré-requisitos
```bash
node >= 18
npm ou yarn
Expo Go instalado no celular (Play Store / App Store)
```

### Passo a Passo

```bash
# 1. Entre na pasta do projeto
cd alphatrader

# 2. Instale as dependências
npm install

# 3. Inicie o servidor Expo
npx expo start

# 4. Escaneie o QR Code com o Expo Go
# (Android: câmera do Expo Go | iOS: câmera nativa)
```

---

## 🔨 Como Gerar o APK (Android)

### Opção 1: EAS Build (Recomendado — cloud)

```bash
# 1. Instale o EAS CLI
npm install -g eas-cli

# 2. Faça login na conta Expo
eas login

# 3. Configure o projeto (primeira vez)
eas build:configure

# 4. Gere o APK de preview
eas build --platform android --profile preview

# O APK será gerado na nuvem e você receberá um link para download
```

### Opção 2: Build Local

```bash
# Requer Android SDK e Java 17+ instalados
npx expo run:android
```

### Opção 3: Expo Build (legado)

```bash
expo build:android -t apk
```

---

## 🔑 Configuração da Binance

1. Acesse [binance.com](https://binance.com) e faça login
2. Vá em **Perfil → API Management**
3. Crie uma nova API Key chamada "Alphatrader"
4. Habilite apenas: **Leitura** + **Trading Spot**
5. ⚠️ **NÃO** habilite saques ou futuros
6. Copie a API Key e Secret Key no app

---

## 🤖 Como Usar o App

### Tela 1: Corretora
1. Insira sua **API Key** da Binance
2. Insira sua **Secret Key** da Binance
3. Toque em **CONECTAR**
4. O app validará as credenciais com a Binance

### Tela 2: Dashboard
1. **Modo Demo** está ativo por padrão (switch no topo)
2. Defina o **Objetivo de Lucro** em R$ (ex: 200)
3. Defina o **Prazo** em horas (ex: 24)
4. Toque no botão **LIGAR IA**
5. O robô começará a analisar e operar automaticamente

---

## 📊 Lógica da IA

```
COMPRA quando:
  - RSI(14) < 35 (sobrevendido)
  - EMA(20) > EMA(50) (tendência de alta)

VENDA quando:
  - RSI(14) > 65 (sobrecomprado)
  - OU stop-loss atingido (-1%)
  - OU tendência invertida para baixa

TAMANHO DA POSIÇÃO:
  - 1,5% do saldo disponível por operação (microtrade)

PROTEÇÃO:
  - Stop-loss automático: -1% por trade
  - Para automaticamente ao atingir a meta em R$
```

---

## ⚠️ Aviso Legal

> Este aplicativo é fornecido para fins educacionais e experimentais.
> Trading de criptomoedas envolve risco significativo de perda financeira.
> **Nunca invista mais do que pode perder.**
> Use o Modo Demo para testar antes de operar com dinheiro real.
> O desenvolvedor não se responsabiliza por perdas financeiras.

---

## 📁 Estrutura do Projeto

```
alphatrader/
├── app/
│   ├── _layout.tsx          # Layout raiz com navegação
│   ├── index.tsx            # Tela Corretora
│   └── dashboard.tsx        # Tela Dashboard
├── src/
│   ├── screens/
│   │   ├── CorretoraScreen.tsx    # UI da tela Corretora
│   │   └── DashboardScreen.tsx   # UI do Dashboard
│   ├── components/
│   │   ├── NeonCard.tsx          # Card com borda neon
│   │   ├── NeonButton.tsx        # Botão neon
│   │   ├── NeonInput.tsx         # Input neon
│   │   ├── PriceChart.tsx        # Gráfico ao vivo
│   │   ├── AIToggleButton.tsx    # Botão Liga/Desliga IA
│   │   ├── AIStatusPanel.tsx     # Painel de indicadores
│   │   ├── ProfitProgress.tsx    # Progresso de lucro
│   │   └── ConnectionStatusBadge.tsx
│   ├── services/
│   │   ├── BinanceAPI.ts         # Integração com Binance
│   │   ├── TradingEngine.ts      # Motor de IA
│   │   └── TradingContext.tsx    # Contexto global React
│   ├── hooks/
│   │   └── useBinanceWebSocket.ts # WebSocket ao vivo
│   ├── utils/
│   │   ├── indicators.ts         # RSI, EMA, sinais
│   │   ├── formatters.ts         # Formatação de valores
│   │   └── storage.ts            # AsyncStorage helpers
│   └── theme/
│       ├── colors.ts             # Paleta cyberpunk
│       ├── typography.ts         # Estilos de texto
│       └── spacing.ts            # Espaçamentos
├── assets/                       # Ícones e splash screen
├── package.json
├── app.json
├── eas.json
└── babel.config.js
```

---

## 🛠️ Tech Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.76 | Framework mobile |
| Expo | 52 | Plataforma de build |
| expo-router | 4 | Navegação baseada em arquivos |
| AsyncStorage | 2.1 | Armazenamento local |
| react-native-chart-kit | 6.x | Gráfico de preços |
| axios | 1.7 | Requisições HTTP |
| crypto-js | 4.2 | Assinatura HMAC-SHA256 |
| Victory Native | 41 | Gráficos alternativos |

---

*Desenvolvido com ❤️ para automação inteligente de trading*
