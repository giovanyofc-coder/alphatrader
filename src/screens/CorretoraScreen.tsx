/**
 * Tela da Corretora — Configuração da conexão com a Binance
 * 
 * Permite ao usuário inserir sua API Key e Secret Key da Binance.
 * As credenciais são salvas localmente com AsyncStorage.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { NeonCard } from '../components/NeonCard';
import { NeonButton } from '../components/NeonButton';
import { NeonInput } from '../components/NeonInput';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';
import { saveCredentials, loadCredentials, clearCredentials, saveData, loadData, STORAGE_KEYS } from '../utils/storage';
import { binanceAPI } from '../services/BinanceAPI';
import { zapiaBridge } from '../services/ZapiaBridge';
import { maskApiKey } from '../utils/formatters';

export default function CorretoraScreen() {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [zapiaToken, setZapiaToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);

  // Carrega credenciais salvas ao abrir a tela
  useEffect(() => {
    async function load() {
      setLoading(true);
      const creds = await loadCredentials();
      const savedZapiaToken = await loadData(STORAGE_KEYS.ZAPIA_TOKEN);
      
      if (creds.apiKey) setSavedApiKey(creds.apiKey);
      if (savedZapiaToken) {
        setZapiaToken(savedZapiaToken);
        zapiaBridge.setToken(savedZapiaToken);
      }
      setIsConnected(creds.isConnected);
      setLoading(false);
    }
    load();
  }, []);

  /**
   * Conecta à Binance validando as credenciais
   */
  async function handleConnect() {
    if (!apiKey.trim() || !secretKey.trim()) {
      Alert.alert(
        'Campos obrigatórios',
        'Por favor, preencha a API Key e a Secret Key.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (apiKey.length < 10 || secretKey.length < 10) {
      Alert.alert(
        'Credenciais inválidas',
        'A API Key e Secret Key devem ter pelo menos 10 caracteres.',
        [{ text: 'OK' }]
      );
      return;
    }

    setValidating(true);

    try {
      // Configura e valida na Binance
      binanceAPI.setCredentials(apiKey.trim(), secretKey.trim());
      const result = await binanceAPI.validateCredentials();

      if (result.valid) {
        // Salva as credenciais localmente
        await saveCredentials(apiKey.trim(), secretKey.trim());
        setSavedApiKey(apiKey.trim());
        setIsConnected(true);
        setApiKey('');
        setSecretKey('');

        Alert.alert(
          '✅ Conectado!',
          'Suas credenciais foram validadas e salvas com sucesso.',
          [{ text: 'Ótimo!' }]
        );
      } else {
        Alert.alert(
          '❌ Erro de conexão',
          result.error || 'Não foi possível validar as credenciais.',
          [{ text: 'Tentar novamente' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        '❌ Erro',
        error?.message || 'Falha ao conectar. Verifique sua internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setValidating(false);
    }
  }

  /**
   * Salva o token do Zapia localmente
   */
  async function handleSaveZapiaToken() {
    if (!zapiaToken.trim()) return;
    
    try {
      await saveData(STORAGE_KEYS.ZAPIA_TOKEN, zapiaToken.trim());
      zapiaBridge.setToken(zapiaToken.trim());
      Alert.alert('Zapia Conectado', 'O bot agora pode se comunicar com o Zapia!');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao salvar o token do Zapia.');
    }
  }

  /**
   * Desconecta removendo as credenciais salvas
   */
  async function handleDisconnect() {
    Alert.alert(
      'Desconectar',
      'Tem certeza que deseja remover as credenciais salvas? A IA será desativada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            await clearCredentials();
            binanceAPI.setCredentials('', '');
            setIsConnected(false);
            setSavedApiKey(null);
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>⚡ IA TRADER</Text>
            <Text style={styles.headerSubtitle}>Configuração da Corretora</Text>
          </View>
          <ConnectionStatusBadge isConnected={isConnected} apiKey={savedApiKey || undefined} />
        </View>

        {/* Card de Status da Conexão */}
        <NeonCard accent={isConnected ? 'secondary' : 'danger'}>
          <View style={styles.statusRow}>
            <Ionicons
              name={isConnected ? 'checkmark-circle' : 'close-circle'}
              size={28}
              color={isConnected ? COLORS.secondary : COLORS.danger}
            />
            <View style={styles.statusText}>
              <Text style={[
                styles.statusTitle,
                { color: isConnected ? COLORS.secondary : COLORS.danger }
              ]}>
                {isConnected ? 'Binance Conectada' : 'Não Conectado'}
              </Text>
              <Text style={styles.statusSub}>
                {isConnected
                  ? `API: ${maskApiKey(savedApiKey || '')}`
                  : 'Insira suas credenciais abaixo'}
              </Text>
            </View>
          </View>

          {isConnected && (
            <TouchableOpacity
              onPress={handleDisconnect}
              style={styles.disconnectBtn}
            >
              <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
              <Text style={styles.disconnectText}>Remover credenciais</Text>
            </TouchableOpacity>
          )}
        </NeonCard>

        {/* Formulário de Credenciais */}
        <NeonCard accent="primary">
          <Text style={styles.formTitle}>CREDENCIAIS DA BINANCE</Text>

          <NeonInput
            label="API Key"
            placeholder="Cole sua API Key aqui..."
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            hint="Encontrada em: Binance → Perfil → API Management"
          />

          <NeonInput
            label="Secret Key"
            placeholder="Cole sua Secret Key aqui..."
            value={secretKey}
            onChangeText={setSecretKey}
            secureTextEntry
            hint="A Secret Key só é exibida uma vez ao criar a API"
          />

          <NeonButton
            title={validating ? 'Validando...' : 'CONECTAR'}
            onPress={handleConnect}
            loading={validating}
            color={COLORS.primary}
            size="lg"
            fullWidth
            style={{ marginTop: SPACING.sm }}
          />
        </NeonCard>

        {/* Card de Instruções */}
        <NeonCard accent="warning">
          <Text style={styles.infoTitle}>📋 COMO OBTER SUA API KEY</Text>

          {[
            '1. Acesse binance.com e faça login',
            '2. Clique no seu perfil → API Management',
            '3. Crie uma nova API Key com nome "Alphatrader"',
            '4. Habilite apenas: Leitura + Trading Spot',
            '5. ⚠️ NÃO habilite: saques ou futuros',
            '6. Copie a API Key e Secret Key aqui',
          ].map((step, idx) => (
            <Text key={idx} style={styles.infoStep}>{step}</Text>
          ))}
        </NeonCard>

        {/* Card de Segurança */}
        <NeonCard accent="primary">
          <Text style={styles.formTitle}>🚀 CONEXÃO ZAPIA</Text>
          <Text style={styles.infoBody}>
            Conecte o Alphatrader ao seu Zapia para receber relatórios em tempo real e enviar comandos de voz.
          </Text>
          <View style={{ marginTop: SPACING.md }}>
            <NeonInput
              label="Token do GitHub (Personal Access Token)"
              placeholder="ghp_..."
              value={zapiaToken}
              onChangeText={setZapiaToken}
              secureTextEntry
              autoCapitalize="none"
            />
            <NeonButton 
              title="Vincular Zapia" 
              onPress={handleSaveZapiaToken}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </NeonCard>

        <NeonCard accent="danger">
          <Text style={styles.infoTitle}>🔒 SEGURANÇA</Text>
          <Text style={styles.infoBody}>
            • Suas chaves são salvas <Text style={{ color: COLORS.primary }}>apenas no seu dispositivo</Text>{'\n'}
            • Nunca compartilhe sua Secret Key{'\n'}
            • Use o <Text style={{ color: COLORS.warning }}>Modo Demo</Text> para testar sem riscos{'\n'}
            • Defina limites de retirada na Binance
          </Text>
        </NeonCard>

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
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },

  // Cabeçalho
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  disconnectText: {
    color: COLORS.danger,
    fontSize: 13,
    marginLeft: 6,
  },

  // Formulário
  formTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },

  // Info
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  infoStep: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  infoBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
