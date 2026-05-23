/**
 * Paleta de cores do tema cyberpunk do Alphatrader
 * Fundo escuro com acentos em neon azul e verde
 */
export const COLORS = {
  // Fundos
  background: '#0a0a0f',       // Fundo principal — preto quase absoluto
  surface: '#0f0f1a',           // Superfície de cards e modais
  surfaceLight: '#141428',      // Superfície um pouco mais clara
  cardBorder: '#1a1a35',        // Borda sutil dos cards

  // Acentos neon
  primary: '#00d4ff',           // Azul neon — cor principal
  secondary: '#00ff88',         // Verde neon — cor secundária / lucro
  danger: '#ff3366',            // Vermelho neon — erro / perda
  warning: '#ffaa00',           // Amarelo neon — atenção

  // Texto
  text: '#ffffff',              // Texto branco principal
  textSecondary: '#b0b0cc',     // Texto secundário acinzentado
  textMuted: '#5a5a7a',         // Texto apagado / inativo

  // Bordas e divisores
  border: '#1e1e3a',            // Borda padrão
  borderActive: '#00d4ff44',    // Borda ativa com transparência

  // Estados especiais
  success: '#00ff88',           // Sucesso = verde neon
  error: '#ff3366',             // Erro = vermelho neon
  buyColor: '#00ff88',          // Cor de compra
  sellColor: '#ff3366',         // Cor de venda

  // Gradientes (usados com LinearGradient se necessário)
  gradientPrimary: ['#00d4ff22', '#0a0a0f'],
  gradientSecondary: ['#00ff8822', '#0a0a0f'],
};
