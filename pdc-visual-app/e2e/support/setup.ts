import { After, AfterAll, Before, BeforeAll, setWorldConstructor, World } from '@cucumber/cucumber';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockHttpServer } from '../mocks/http-server';
import { MockWebSocketServer } from '../mocks/websocket-server';

// Extend World to hold test context
export class CustomWorld extends World {
  mockWsServer?: MockWebSocketServer;
  mockHttpServer?: MockHttpServer;
  receivedEvents: any[] = [];
  appState: any = {};
}

setWorldConstructor(CustomWorld);

// Start mock servers before all tests
BeforeAll(async function () {
  console.log('Starting mock servers...');
});

// Clean up after all tests
AfterAll(async function () {
  console.log('Cleaning up mock servers...');
});

// Before each scenario
Before(async function (this: CustomWorld) {
  // Clear AsyncStorage
  await AsyncStorage.clear();

  // Reset world state
  this.receivedEvents = [];
  this.appState = {};

  // Initialize mock servers
  this.mockWsServer = new MockWebSocketServer();
  this.mockHttpServer = new MockHttpServer();

  await this.mockWsServer.start();
  await this.mockHttpServer.start();
});

// After each scenario
After(async function (this: CustomWorld) {
  // Stop mock servers
  if (this.mockWsServer) {
    await this.mockWsServer.stop();
  }

  if (this.mockHttpServer) {
    await this.mockHttpServer.stop();
  }

  // Clear AsyncStorage again
  await AsyncStorage.clear();
});
