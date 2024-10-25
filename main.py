from flask import Flask, request, jsonify
import cv2
import numpy as np
import io
import base64

app = Flask(__name__)

# Ortalama kalp atış hızını hesaplayan fonksiyon
def calculate_heart_rate(intensity_changes, fps):
    peaks = 0
    for i in range(1, len(intensity_changes) - 1):
        if intensity_changes[i] > intensity_changes[i - 1] and intensity_changes[i] > intensity_changes[i + 1]:
            peaks += 1

    seconds = len(intensity_changes) / fps
    heart_rate = (peaks / seconds) * 60
    return heart_rate

@app.route('/', methods=['GET'])
def home():
    return "Kalp atış hızı ölçümü için /process-video endpoint'ini kullanın."


# Video işleme endpoint'i
@app.route('/process-video', methods=['POST'])
def process_video():
    try:
        # JSON verisinden video verisini al
        data = request.json
        video_data = data.get('video')

        if not video_data:
            return jsonify({"error": "No video data provided"}), 400
        
        # Base64'ten video verisini çözümle
        video_bytes = base64.b64decode(video_data)
        video_stream = io.BytesIO(video_bytes)
        video_stream.seek(0)
        
        # OpenCV ile video açma
        cap = cv2.VideoCapture(video_stream)
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        intensity_changes = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Her kareyi griye dönüştürüp ışık seviyesini hesapla
            gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            avg_intensity = np.mean(gray_frame)
            intensity_changes.append(avg_intensity)
        
        cap.release()
        
        # Kalp atış hızını hesapla
        heart_rate = calculate_heart_rate(intensity_changes, fps)
        return jsonify({"heartRate": heart_rate})
    
    except Exception as e:
        print("Hata:", e)
        return jsonify({"error": "Video işlenemedi"}), 500

if __name__ == '__main__':
    app.run(port=5000)
