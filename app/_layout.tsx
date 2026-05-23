/**
 * Layout raiz do aplicativo Alphatrader
 * Configura o tema escuro cyberpunk e a navegação principal
 */
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/theme/colors';
import { TradingProvider } from '../src/services/TradingContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <TradingProvider>
          <StatusBar style="light" backgroundColor={COLORS.background} />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: COLORS.surface,
                borderTopColor: COLORS.border,
                borderTopWidth: 1,
                height: 60,
                paddingBottom: 8,
                paddingTop: 4,
              },
              tabBarActiveTintColor: COLORS.primary,
              tabBarInactiveTintColor: COLORS.textMuted,
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
              },
            }}
          >
            {/* Aba 1: Corretora (Conexão com a Binance) */}
            <Tabs.Screen
              name="index"
              options={{
                title: 'Corretora',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="key-outline" size={size} color={color} />
                ),
              }}
            />
            {/* Aba 2: Dashboard (Operações e IA) */}
            <Tabs.Screen
              name="dashboard"
              options={{
                title: 'Dashboard',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="stats-chart" size={size} color={color} />
                ),
              }}
            />
          </Tabs>
        </TradingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
