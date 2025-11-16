import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
    backgroundColor: '#141A2D',
    padding: 20,
  },

  // Logo
  logo: {
    width: 100,
    height: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Cards
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonCard: {
    backgroundColor: '#404C72',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  subCard: {
    backgroundColor: '#303850',
    borderRadius: 15,
    padding: 15,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
  },

  // Layout e disposição
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  rowBetween2: {
    flexDirection: 'row',
    gap: 17,
    alignItems: 'center',
    marginVertical: 8,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 15,
  },
  horizontalCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  // Ícones
  largeIcon: {
    width: 38,
    height: 38,
  },
  smallIcon: {
    width: 22,
    height: 22,
  },
  circle: {
    width: 15,
    height: 15,
  },

  // Sliders
  sliderContainer: {
    width: 200,
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderContainer2: {
    flex: 1,
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  slider: {
    width: '60%',
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },

  // Botões
  button2: {
    backgroundColor: '#404C72',
    padding: 16,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#334155',
  },

  // Textos
  largeStatusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  subText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  subCardText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  lorem: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  volumeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    minWidth: 40,
    textAlign: 'right',
  },

  // Status e tags
  connectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  connectedTagActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  connectedTagInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  connectedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  connectedText2: {
    color: '#22A35A',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectedText: {
    color: '#848688',
    fontSize: 14,
    fontWeight: '600',
  },

  // WebSocket status
  wsStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  wsConnectedTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  wsDisconnectedTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  wsCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  wsCircleActive: {
    backgroundColor: '#22C55E',
  },
  wsStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyHistoryText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },

  // Device tags
  deviceTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  deviceTagConnected: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  deviceTagDisconnected: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  deviceTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});