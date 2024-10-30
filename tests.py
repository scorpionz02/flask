import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import cv2
from scipy.spatial import distance as dist

def load_and_prepare_image(image_path):
    # Görseli yükle ve RGB formatına çevir
    image = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return image, image_rgb

def detect_objects(image_rgb):
    # TensorFlow Hub'dan EfficientDet Lite2 modelini yükleyin
    model = hub.load("https://tfhub.dev/tensorflow/efficientdet/lite2/detection/1")
    image_tensor = tf.convert_to_tensor(image_rgb)
    image_tensor = image_tensor[tf.newaxis, ...]  # Model, 4D tensor bekler
    detections = model(image_tensor)
    print("detections:", detections)
    # Algılamaları numpy dizisine dönüştür
    detection_boxes = detections['detection_boxes'][0].numpy()
    detection_scores = detections['detection_scores'][0].numpy()
    print(detection_boxes, detection_scores)
    return detection_boxes, detection_scores

def midpoint(ptA, ptB):
    return ((ptA[0] + ptB[0]) * 0.5, (ptA[1] + ptB[1]) * 0.5)

def process_detections(image, detection_boxes, detection_scores, object_width_mm):
    h, w, _ = image.shape
    pixel_per_metric = None

    for i in range(len(detection_boxes)):
        score = detection_scores[i]
        
        if score < 0.5:  # Güvenilirlik oranı %50 altında ise atla
            continue

        # Algılanan kutuyu orijinal görüntü boyutuna göre ölçekleyin
        box = detection_boxes[i]
        (startY, startX, endY, endX) = (box[0] * h, box[1] * w, box[2] * h, box[3] * w)
        
        # Orta nokta ve kenarlar arası uzaklıkları hesaplayın
        box_points = np.array([(startX, startY), (endX, startY), (endX, endY), (startX, endY)])
        (tl, tr, br, bl) = box_points
        (tltrX, tltrY) = midpoint(tl, tr)
        (blbrX, blbrY) = midpoint(bl, br)
        (tlblX, tlblY) = midpoint(tl, bl)
        (trbrX, trbrY) = midpoint(tr, br)

        # Mesafeleri hesaplayın
        dA = dist.euclidean((tltrX, tltrY), (blbrX, blbrY))
        dB = dist.euclidean((tlblX, tlblY), (trbrX, trbrY))

        if pixel_per_metric is None:
            pixel_per_metric = dB / object_width_mm

        # Ölçümleri milimetre cinsinden hesaplayın
        dimA = dA / pixel_per_metric
        dimB = dB / pixel_per_metric

        # Görsel üzerinde ölçümleri yazdırın
        cv2.drawContours(image, [box_points.astype("int")], -1, (0, 255, 0), 2)
        cv2.putText(image, "{:.1f}mm".format(dimA), (int(tltrX - 15), int(tltrY - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
        cv2.putText(image, "{:.1f}mm".format(dimB), (int(trbrX + 10), int(trbrY)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)

    cv2.imshow("Detected and Measured Objects", image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

# Kullanım örneği
image_path = "./images/test.jpg"
object_width_mm = 50  # Algılanacak nesnenin gerçek genişliği (mm cinsinden)

# Görseli yükle, model ile işle, ve sonuçları göster
image, image_rgb = load_and_prepare_image(image_path)
detection_boxes, detection_scores = detect_objects(image_rgb)
process_detections(image, detection_boxes, detection_scores, object_width_mm)
