# run_game_with_ngrok.py
from pyngrok import ngrok
import subprocess
import sys
import os
import time

# -------------------------------
# 1. Встав свій ngrok authtoken тут
NGROK_AUTHTOKEN = "3AiQk4NRHvM2ETfzxpG2z6I2Z8X_2pZPvDC6nUArWJTW3Vfwq"
# -------------------------------

# Порт, на якому працює Flask
PORT = 5000

# 1️⃣ Встановлюємо токен для pyngrok
ngrok.set_auth_token(NGROK_AUTHTOKEN)

# 2️⃣ Створюємо тунель
public_url = ngrok.connect(PORT)
print(f"🌐 Публічне посилання на гру: {public_url}\n")

# 3️⃣ Запускаємо Flask сервер
# Замінити 'app.py' на назву твого Flask файлу, якщо відрізняється
flask_file = "app.py"

print("🚀 Запуск Flask сервера на localhost:5000...\n")

# Використовуємо subprocess, щоб Flask запускався у фоновому режимі
flask_process = subprocess.Popen([sys.executable, flask_file])

try:
    print("🖥️ Гра працює! Відкрий публічне посилання у браузері.")
    print("❗ Натисніть Ctrl+C, щоб зупинити сервер і тунель.\n")
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n⏹️ Зупинка сервера і тунелю...")
    flask_process.terminate()
    ngrok.disconnect(public_url)
    ngrok.kill()
    print("✅ Все завершено.")