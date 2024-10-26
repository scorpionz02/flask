from flask import Flask, request, jsonify
import cv2
import numpy as np
import io
import base64
import tempfile
import os
from sigMain import sigMain  # sigMain fonksiyonunu içe aktar

app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return "Kalp atış hızı ölçümü için /process-video endpoint'ini kullanın."

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
        
        # Geçici bir dosya oluştur
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video_file:
            temp_video_file.write(video_bytes)
            temp_video_file_path = temp_video_file.name
        
        # OpenCV ile video açma
        cap = cv2.VideoCapture(temp_video_file_path)
        
        # Toplam kare sayısını ve FPS'yi al
        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        fps = cap.get(cv2.CAP_PROP_FPS)
        print("Total frames:", total_frames)
        print("FPS:", fps)
        duration = total_frames / fps
        ret = True
        
        hsv_v_values = []
        
        while ret:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Her kareyi HSV renk alanına dönüştür
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            hsv_values = hsv[:,:,2]
            mean_hsv_value = np.mean(hsv_values)
            hsv_v_values.append(mean_hsv_value)

        cap.release()
        
        # Kalp atış hızını ve HRV'yi hesapla
        HRV = sigMain(hsv_v_values, duration)
        print("HRV:", HRV)

        # Geçici dosyayı sil
        os.remove(temp_video_file_path)

        return jsonify({"heartRate": HRV})
    
    except Exception as e:
        print("Hata:", e)
        return jsonify({"error": "Video işlenemedi"}), 500


if __name__ == '__main__':
    app.run(port=5000, host='192.168.1.103')
