/**
 * Tela do Dashboard — Operações da IA e monitoramento
 * 
 * Exibe:
 * - Gráfico ao vivo do BTC/USDT via WebSocket
 * - Configurações de meta de lucro e prazo
 * - Botão de Liga/Desliga da IA
 * - Progresso de lucro em tempo real
 * - Indicadores técnicos (RSI, EMA, tendência)
 * - Switch de Modo Demo / Modo Real
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { PriceChart } from '../components/PriceChart';
import { AIToggleButton } from '../components/AIToggleButton';
import { AIStatusPanel } from '../components/AIStatusPanel';
import { ProfitProgress } from '../components/ProfitProgress';
import { AILogs } from '../components/AILogs';
import { NeonCard } from '../components/NeonCard';
import { NeonInput } from '../components/NeonInput';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import { useTradingContext } from '../services/TradingContext';
import { saveData, STORAGE_KEYS } from '../utils/storage';
import { formatDateTime } from '../utils/formatters';

export default function DashboardScreen() {
  const { 
    state, 
    isConnected, 
    startTrading, 
    stopTrading, 
    setDemoMode, 
    setProfitGoal, 
    setSpendingLimit,
    setSymbol
  } = useTradingContext();

  // Inputs de configuração
  const [profitGoalInput, setProfitGoalInput] = useState(state.profitGoalBRL.toString());
  const [spendingLimitInput, setSpendingLimitInput] = useState(state.spendingLimitPercent.toString());
  const [timeLimitInput, setTimeLimitInput] = useState('24');
  const [aiLoading, setAiLoading] = useState(false);

  // WebSocket ao vivo da Binance
  const { priceHistory, wsStatus, lastPrice } = useBinanceWebSocket(state.selectedSymbol);

  // Sincroniza configurações quando o estado muda
  useEffect(() => {
    setProfitGoalInput(state.profitGoalBRL.toString());
  }, [state.profitGoalBRL]);

  useEffect(() => {
    setSpendingLimitInput(state.spendingLimitPercent.toString());
  }, [state.spendingLimitPercent]);

  /**
   * Alterna o estado da IA (liga / desliga)
   */
  const handleAIToggle = useCallback(async () => {
    if (state.isActive) {
      // Desliga a IA
      Alert.alert(
        'Desligar IA',
        'Tem certeza que deseja parar o trading automático?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Parar',
            style: 'destructive',
            onPress: async () => {
              setAiLoading(true);
              await stopTrading();
              setAiLoading(false);
            },
          },
        ]
      );
    } else {
      // Liga a IA
      if (!isConnected && !state.isDemoMode) {
        Alert.alert(
          'Sem conexão',
          'Configure suas credenciais da Binance na aba Corretora antes de ativar a IA.',
          [{ text: 'Entendi' }]
        );
        return;
      }

      // Valida meta de lucro
      const goal = parseFloat(profitGoalInput);
      if (isNaN(goal) || goal <= 0) {
        Alert.alert('Meta inválida', 'Defina um objetivo de lucro em R$ maior que zero.');
        return;
      }

      // Valida limite de gasto
      const limit = parseFloat(spendingLimitInput);
      if (isNaN(limit) || limit <= 0 || limit > 100) {
        Alert.alert('Limite inválido', 'Defina um limite de gasto entre 0.1% e 100%.');
        return;
      }

      // Salva configurações
      await saveData(STORAGE_KEYS.PROFIT_GOAL, goal.toString());
      await saveData(STORAGE_KEYS.TIME_LIMIT, timeLimitInput);
      setProfitGoal(goal);
      setSpendingLimit(limit);

      // Confirmação antes de iniciar no modo real
      if (!state.isDemoMode) {
        Alert.alert(
          '⚠️  MODO REAL ATIVADO',
          `A IA irá executar operações REAIS na Binance.\n\nMeta: R$ ${goal}\nPrazo: ${timeLimitInput}h\n\nDeseja continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: '✅ Confirmar',
              onPress: async () => {
                setAiLoading(true);
                await startTrading();
                setAiLoading(false);
              },
            },
          ]
        );
      } else {
        setAiLoading(true);
        await startTrading();
        setAiLoading(false);
      }
    }
  }, [state.isActive, state.isDemoMode, isConnected, profitGoalInput, timeLimitInput]);

  /**
   * Alterna entre Modo Demo e Modo Real
   */
  const handleDemoToggle = useCallback(
    (value: boolean) => {
      if (!value) {
        // Tentando ativar Modo Real
        Alert.alert(
          '⚠️  Modo Real',
          'No Modo Real, a IA executará operações REAIS com seu dinheiro na Binance.\n\n' +
          'Use apenas se souber o que está fazendo. Confirma?',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => setDemoMode(true) },
            {
              text: 'Entendo o risco',
              style: 'destructive',
              onPress: async () => {
                setDemoMode(false);
                await saveData(STORAGE_KEYS.DEMO_MODE, 'false');
              },
            },
          ]
        );
      } else {
        setDemoMode(true);
        saveData(STORAGE_KEYS.DEMO_MODE, 'true');
      }
    },
    [setDemoMode]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho com Status Prominente */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>⚡ ALPHATRADER</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: state.isActive ? `${COLORS.secondary}22` : `${COLORS.textMuted}22` }
            ]}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: state.isActive ? COLORS.secondary : COLORS.textMuted }
              ]} />
              <Text style={[
                styles.statusText, 
                { color: state.isActive ? COLORS.secondary : COLORS.textMuted }
              ]}>
                {state.isActive ? 'SISTEMA IA ONLINE' : 'SISTEMA IA OFFLINE'}
              </Text>
            </View>
          </View>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>SALDO</Text>
            <Text style={styles.walletValue}>
              ${state.usdtBalance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Seletor de Ativos */}
        <View style={styles.symbolSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {state.availableSymbols.map((sym) => (
              <TouchableOpacity
                key={sym}
                onPress={() => setSymbol(sym)}
                disabled={state.isActive}
                style={[
                  styles.symbolItem,
                  state.selectedSymbol === sym && styles.symbolItemActive
                ]}
              >
                <Text style={[
                  styles.symbolText,
                  state.selectedSymbol === sym && styles.symbolTextActive
                ]}>
                  {sym.replace('USDT', '')}
                </Text>
                {state.selectedSymbol === sym && <View style={styles.symbolDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Gráfico ao vivo */}
        <PriceChart
          priceHistory={priceHistory}
          lastPrice={lastPrice || state.currentPrice}
          wsStatus={wsStatus}
          symbol={state.selectedSymbol}
        />

        {/* Switch Modo Demo / Real */}
        <NeonCard accent={state.isDemoMode ? 'warning' : 'danger'} style={styles.demoCard}>
          <View style={styles.demoRow}>
            <View style={styles.demoInfo}>
              <Text style={styles.demoLabel}>
                {state.isDemoMode ? '🎮 MODO DEMO' : '⚡ MODO REAL'}
              </Text>
              <Text style={styles.demoSub}>
                {state.isDemoMode
                  ? 'Simula operações sem executar na Binance'
                  : '⚠️  Opera com dinheiro real na Binance'}
              </Text>
            </View>
            <Switch
              value={state.isDemoMode}
              onValueChange={handleDemoToggle}
              trackColor={{ false: `${COLORS.danger}88`, true: `${COLORS.warning}88` }}
              thumbColor={state.isDemoMode ? COLORS.warning : COLORS.danger}
              disabled={state.isActive}
            />
          </View>
        </NeonCard>

        {/* Configurações de Meta */}
        <NeonCard accent="primary">
          <Text style={styles.sectionTitle}>CONFIGURAÇÕES DA SESSÃO</Text>

          <View style={styles.goalRow}>
            <View style={styles.goalInput}>
              <NeonInput
                label="Objetivo de Lucro"
                placeholder="200"
                value={profitGoalInput}
                onChangeText={setProfitGoalInput}
                keyboardType="numeric"
                prefix="R$"
                editable={!state.isActive}
              />
            </View>
            <View style={[styles.goalInput, { marginLeft: SPACING.sm }]}>
              <NeonInput
                label="Limite Gasto"
                placeholder="1.5"
                value={spendingLimitInput}
                onChangeText={setSpendingLimitInput}
                keyboardType="numeric"
                prefix="%"
                editable={!state.isActive}
              />
            </View>
          </View>

          {state.isActive && (
            <Text style={styles.lockedHint}>
              ⚙️  Configurações bloqueadas durante operação ativa
            </Text>
          )}
        </NeonCard>

        {/* Progresso de Lucro */}
        <ProfitProgress
          profitBRL={state.profitBRL}
          profitGoalBRL={state.profitGoalBRL}
          profitUSD={state.profitUSD}
          openTrade={state.openTrade}
          usdBrlRate={state.usdBrlRate}
        />

        {/* Botão Principal de Liga/Desliga IA */}
        <View style={styles.toggleContainer}>
          <AIToggleButton
            isActive={state.isActive}
            isDemoMode={state.isDemoMode}
            isConnected={isConnected || state.isDemoMode}
            loading={aiLoading}
            onToggle={handleAIToggle}
          />
        </View>

        {/* Painel de Indicadores Técnicos */}
        {state.isActive && (
          <NeonCard accent="primary">
            <AIStatusPanel
              rsi={state.rsi}
              trend={state.trend}
              ema20={state.ema20}
              ema50={state.ema50}
              lastSignal={state.lastSignal}
              isActive={state.isActive}
            />
          </NeonCard>
        )}

        {/* Estatísticas de Operações */}
        {(state.totalTrades > 0 || state.isActive) && (
          <NeonCard accent="secondary">
            <Text style={styles.sectionTitle}>ESTATÍSTICAS DA SESSÃO</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{state.totalTrades}</Text>
                <Text style={styles.statLabel}>Operações</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.secondary }]}>
                  {state.successfulTrades}
                </Text>
                <Text style={styles.statLabel}>Sucesso</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  { color: state.totalTrades > 0 && state.successfulTrades / state.totalTrades >= 0.5
                    ? COLORS.secondary
                    : COLORS.danger }
                ]}>
                  {state.totalTrades > 0
                    ? `${((state.successfulTrades / state.totalTrades) * 100).toFixed(0)}%`
                    : '---'}
                </Text>
                <Text style={styles.statLabel}>Taxa Acerto</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {`${(state.usdBrlRate).toFixed(2)}`}
                </Text>
                <Text style={styles.statLabel}>USD/BRL</Text>
              </View>
            </View>
          </NeonCard>
        )}

        {/* Diário de Operações IA */}
        {state.isActive && (
          <AILogs logs={state.logs} />
        )}

        {/* Erro atual */}
        {state.error && (
          <NeonCard accent="danger">
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          </NeonCard>
        )}

        {/* Aviso de configuração */}
        {!isConnected && !state.isDemoMode && (
          <TouchableOpacity style={styles.warningBanner}>
            <Ionicons name="warning" size={16} color={COLORS.warning} />
            <Text style={styles.warningText}>
              Configure as credenciais na aba Corretora para operar no modo real
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },

  // Cabeçalho
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  walletHeader: {
    alignItems: 'flex-end',
  },
  walletLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  walletValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Seletor de Ativos
  symbolSelector: {
    marginBottom: SPACING.md,
  },
  symbolItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    minWidth: 80,
  },
  symbolItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}11`,
  },
  symbolText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  symbolTextActive: {
    color: COLORS.primary,
  },
  symbolDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },

  // Demo Card
  demoCard: {
    marginBottom: SPACING.md,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  demoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  demoSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Seções
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },

  // Goal inputs
  goalRow: {
    flexDirection: 'row',
  },
  goalInput: {
    flex: 1,
  },
  lockedHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Botão IA
  toggleContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },

  // Estatísticas
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 3,
    textAlign: 'center',
  },

  // Erro
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginLeft: SPACING.sm,
    flex: 1,
  },

  // Aviso
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}15`,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.warning}33`,
    marginTop: SPACING.sm,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: 12,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
});
