float cm, duracao; // comprimento da onda

int pinoTRIG = 11;
int pinoECHO = 10;
int pinoLED = 13;
void setup()
{
  pinMode(pinoLed, OUTPUT);
  // sensor
  pinMode(pinoECHO, INPUT);
  pinMode(pinoTRIG, OUTPUT);
  // porta serial
  Serial.begin(9600);
}

void loop()
{
  cm = calcula_distancia();
  Serial.print("Distancia: %f",cm);
  digitalWrite(pinoLED, HIGH);
  delay(1000); // Wait for 1000 millisecond(s)
  digitalWrite(PinoLED, LOW);
  delay(1000); // Wait for 1000 millisecond(s)
}

float calcula_distancia() {
  // Limpa o pino TRIG - macetinho par funcionar melhor
  digitalWrite(pinoTRIG, LOW);
  delayMicroseconds(5);
  // Define o pino TRIG como HIGH por 10 microsegundos  
  // Envio do pulso de ultrassom
  digitalWrite(pinoTRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(pinoTRIG, LOW);
  // Tempo de voo -> duração (Lê o tempo do pino ECHO)
  duracao = pulseIn(pinoECHO, HIGH);
  // Calcula a distância em cm
  // velocidade do som = 343 m/s = 29.1 cm/microsegundo
  // 34000cm / 1000000 microsegundos(us) = 0.00343 cm/microsegundo
  // cm = (duracao / 2) / 29.1;
  float cm = (duracao / 2) * 0.00343; // cm
  // ideal 3 metros = 300 cm
  // if(d >= 300) {
  //   d = 0;
  // }
  // Sensor ultrassonico HC-SR04 possui problemas para calculas distancias mairoes que 3 metros
  return cm;
}