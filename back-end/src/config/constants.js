const PORT = Number(process.env.PORT || process.env.PORTWEBSOCKET || 3000);
const SHUTDOWN_TIMEOUT = Number(process.env.WS_SHUTDOWN_TIMEOUT || 1000);
const MAX_HISTORY = Number(process.env.MAX_HISTORY || 100);
const MAX_ALERTS = Number(process.env.MAX_ALERTS || 50);
const SERVER_START_TIME = Date.now();
const SSE_PING_INTERVAL = Number(process.env.SSE_PING_INTERVAL || 30000);

const DEFAULT_COMMANDS = ['test_motor', 'get_status', 'calibrate_sensor', 'reboot', 'set_vibration'];

module.exports = {
  PORT,
  SHUTDOWN_TIMEOUT,
  MAX_HISTORY,
  MAX_ALERTS,
  SERVER_START_TIME,
  SSE_PING_INTERVAL,
  DEFAULT_COMMANDS
};
