"""
Script simples para testar apenas a captura de stream ESP32-CAM
Sem dependências de modelo de IA - apenas captura e salva imagens
"""
import cv2
import os
import argparse
from time import time

def main():
    """Função principal para captura simples"""
    # Criar pasta de resultados se não existir
    results_dir = 'results'
    if not os.path.exists(results_dir):
        os.makedirs(results_dir)
        print(f"📁 Pasta '{results_dir}/' criada para salvar resultados")

    parser = argparse.ArgumentParser(description='Captura simples de IP Camera/ESP32-CAM')
    parser.add_argument('--url', type=str, required=True,
                        help='URL do stream (ex: http://192.168.1.100:81/stream para ESP32-CAM)')
    parser.add_argument('--rotate', type=int, default=0, choices=[0, 90, 180, 270],
                        help='Rotação da imagem em graus (0, 90, 180, 270)')

    args = parser.parse_args()

    print(f"🎥 Tentando conectar ao stream: {args.url}")

    cap = cv2.VideoCapture(args.url)

    if not cap.isOpened():
        print("❌ Erro ao conectar ao stream!")
        print("\n💡 DICAS:")
        print("  • Verifique se o ESP32-CAM está ligado e conectado à rede")
        print("  • Confirme o IP correto do ESP32-CAM")
        print("  • Para ESP32-CAM, use: http://IP_DO_ESP32:81/stream")
        print("  • Exemplo: http://192.168.1.100:81/stream")
        print("  • Teste primeiro no navegador se o stream está funcionando")
        return

    print("✅ Conectado ao stream com sucesso!")
    print("\n" + "="*50)
    print("INSTRUÇÕES:")
    print("  👉 Pressione 'c' ou 'ESPAÇO' para capturar")
    print("  👉 Pressione 'ESC' ou 'q' para sair")
    print("="*50 + "\n")

    capture_count = 0
    rotation_map = {0: None, 90: cv2.ROTATE_90_CLOCKWISE,
                    180: cv2.ROTATE_180, 270: cv2.ROTATE_90_COUNTERCLOCKWISE}

    try:
        while True:
            ret, frame = cap.read()

            if not ret:
                print("❌ Erro ao capturar frame do stream")
                print("⚠️  Tentando reconectar...")
                cap.release()
                cap = cv2.VideoCapture(args.url)
                if not cap.isOpened():
                    print("❌ Não foi possível reconectar")
                    break
                continue

            # Aplicar rotação se necessário
            if args.rotate != 0 and rotation_map[args.rotate] is not None:
                frame = cv2.rotate(frame, rotation_map[args.rotate])

            # Mostrar o frame com instruções
            display_frame = frame.copy()
            cv2.putText(display_frame, "Pressione 'c' ou ESPACO para capturar",
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(display_frame, "Pressione 'ESC' ou 'q' para sair",
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            cv2.imshow("ESP32-CAM Stream - Captura Simples", display_frame)

            key = cv2.waitKey(1) & 0xFF

            # ESC ou 'q' para sair
            if key == 27 or key == ord('q'):
                print("👋 Encerrando...")
                break

            # 'c' ou ESPAÇO para capturar
            elif key == ord('c') or key == 32:
                capture_count += 1
                print(f"\n📸 Captura #{capture_count}")

                # Salvar a imagem capturada
                capture_filename = os.path.join(results_dir, f'esp32_simple_{capture_count}.jpg')
                cv2.imwrite(capture_filename, frame)
                print(f"💾 Imagem salva: {capture_filename}")

                # Mostrar confirmação na imagem
                result_frame = frame.copy()
                overlay = result_frame.copy()
                cv2.rectangle(overlay, (0, result_frame.shape[0] - 60),
                            (result_frame.shape[1], result_frame.shape[0]),
                            (0, 0, 0), -1)
                cv2.addWeighted(overlay, 0.7, result_frame, 0.3, 0, result_frame)

                cv2.putText(result_frame, f"Imagem #{capture_count} salva!",
                          (10, result_frame.shape[0] - 30), cv2.FONT_HERSHEY_SIMPLEX,
                          0.7, (0, 255, 0), 2)

                cv2.imshow(f"Captura #{capture_count}", result_frame)

    except KeyboardInterrupt:
        print("\n⚠️  Interrompido pelo usuário")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("\n✅ Recursos liberados. Programa finalizado.")

if __name__ == "__main__":
    main()