import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { formatDateTime } from '../utils/formatters';

interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

interface AILogsProps {
  logs: LogEntry[];
}

export function AILogs({ logs }: AILogsProps) {
  const renderItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logItem}>
      <Text style={styles.logTime}>{formatDateTime(item.timestamp).split(' ')[1]}</Text>
      <View style={[styles.logIndicator, { backgroundColor: getLogColor(item.type) }]} />
      <Text style={styles.logMessage} numberOfLines={2}>
        {item.message}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DIÁRIO DE OPERAÇÕES IA</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma atividade registrada ainda...</Text>
        }
      />
    </View>
  );
}

function getLogColor(type: string) {
  switch (type) {
    case 'SUCCESS': return COLORS.secondary;
    case 'WARNING': return COLORS.warning;
    case 'ERROR': return COLORS.danger;
    default: return COLORS.primary;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    width: 45,
    fontWeight: '600',
  },
  logIndicator: {
    width: 4,
    height: 12,
    borderRadius: 2,
    marginHorizontal: SPACING.sm,
  },
  logMessage: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: SPACING.sm,
  },
});
