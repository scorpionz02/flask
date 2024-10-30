import cv2
import math
import mediapipe as mp
from datetime import datetime
from pathlib import Path
import numpy as np
import os

# Constants
IRIS_WIDTH = 11.7  # mm
CARD_WIDTH_MM = 85.6  # Standard credit card width in mm
OUTPUT_PATH = "data/results"

# Ensure output directory exists
os.makedirs(OUTPUT_PATH, exist_ok=True)

# Initialize mediapipe modules
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

def detect_card_edges(image):
    """
    Detects card edges by finding contours, focusing on a characteristic edge or line on the card.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        if len(approx) == 4:  # Expecting the card to be roughly rectangular
            pts = np.array([point[0] for point in approx], dtype="float32")
            (tl, tr, br, bl) = pts
            card_width_pixels = np.linalg.norm(tr - tl)
            cv2.polylines(image, [np.int32(pts)], True, (255, 0, 0), 2)  # Draw card outline
            return card_width_pixels
    return None

def get_center_of_points(landmarks, image_shape):
    center_x = sum(l.x for l in landmarks) * image_shape[1] / len(landmarks)
    center_y = sum(l.y for l in landmarks) * image_shape[0] / len(landmarks)
    return int(center_x), int(center_y)

def calculate_pixel_to_mm_ratio(card_width_pixels):
    """
    Calculate the pixel to mm ratio based on the detected card width in pixels.
    """
    return CARD_WIDTH_MM / card_width_pixels if card_width_pixels else None

def mm_per_pixel_from_iris(landmarks, image_shape):
    p1_x, p1_y = int(landmarks[469].x * image_shape[1]), int(landmarks[469].y * image_shape[0])
    p2_x, p2_y = int(landmarks[471].x * image_shape[1]), int(landmarks[471].y * image_shape[0])
    p1, p2 = (p1_x, p1_y), (p2_x, p2_y)
    distance_in_pixels = math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
    return IRIS_WIDTH / distance_in_pixels

def process_image(image_path, output_width=600):
    image = cv2.imread(image_path)
    if image is None:
        print(f"Image file not found: {image_path}")
        return
    height, width = image.shape[:2]
    scale_factor = output_width / width
    scaled_size = (output_width, int(height * scale_factor))

    # Card detection and pixel-to-mm ratio calculation
    card_width_pixels = detect_card_edges(image)
    if card_width_pixels is None:
        print("Card not detected.")
        return
    pixel_to_mm_ratio = calculate_pixel_to_mm_ratio(card_width_pixels)
    print(f"Card-based mm-per-pixel: {pixel_to_mm_ratio:.4f}")

    # Process face landmarks
    with mp_face_mesh.FaceMesh(static_image_mode=True, refine_landmarks=True, max_num_faces=1) as face_mesh:
        results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

        if not results.multi_face_landmarks:
            print("No face landmarks detected.")
            return

        for face_landmarks in results.multi_face_landmarks:
            # Calculate iris-based mm-per-pixel ratio for comparison
            pixel_in_mm_iris = mm_per_pixel_from_iris(face_landmarks.landmark, image.shape)
            print(f"Iris-based mm-per-pixel: {pixel_in_mm_iris:.4f}")

            # Draw landmarks
            mp_drawing.draw_landmarks(
                image=image,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1)
            )

            # Pupil distance calculations using card-based ratio
            left_eye_center = get_center_of_points([face_landmarks.landmark[i] for i in [474, 475, 476, 477]], image.shape)
            right_eye_center = get_center_of_points([face_landmarks.landmark[i] for i in [469, 470, 471, 472]], image.shape)
            pupil_distance_pixels = math.sqrt((left_eye_center[0] - right_eye_center[0]) ** 2 +
                                              (left_eye_center[1] - right_eye_center[1]) ** 2)
            pupil_distance_mm = pixel_to_mm_ratio * pupil_distance_pixels

            # Display results on image
            cv2.putText(image, f"Pupils Distance: {pupil_distance_mm:.2f} mm", (30, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            print(f"Pupil distance (card-based): {pupil_distance_mm:.2f} mm")

    # Save processed image
    result_filename = f"{Path(image_path).stem}--{datetime.now().strftime('%d-%m-%Y')}.jpg"
    result_file_path = Path(OUTPUT_PATH) / result_filename
    cv2.imwrite(str(result_file_path), cv2.resize(image, scaled_size))
    print(f"Processed image saved to {result_file_path}")

# Usage example
process_image("./images/testc.jpg")
