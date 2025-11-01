#define PIN 4
void setup() {
  // put your setup code here, to run once:
  pinMode(PIN,OUTPUT);
}

void loop() {
  // put your main code here, to run repeatedly:
  digitalWrite(PIN, HIGH);
  delay(500);
  digitalWrite(PIN,LOW);
  delay(500);
}
