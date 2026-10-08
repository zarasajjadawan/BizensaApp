import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

/** Opens the gallery, resizes to a JPEG and returns a file:// uri (or null if cancelled). */
export async function pickReceiptImage(): Promise<string | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
        Alert.alert("Permission needed", "Allow photo access to attach a receipt.");
        return null;
    }

    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (res.canceled) return null;

    try {
        const asset = res.assets[0];
        const img = await ImageManipulator.manipulateAsync(
            asset.uri,
            asset.width && asset.width > 1280 ? [{ resize: { width: 1280 } }] : [],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        return img.uri;
    } catch (err) {
        console.log("Receipt prepare error:", err);
        Alert.alert("Couldn't use this image", "Please pick a different image.");
        return null;
    }
}

/**
 * Sends multipart FormData with XMLHttpRequest (expo/fetch rejects { uri, name, type } file parts).
 * Do NOT set Content-Type: the boundary is added automatically.
 */
export const sendForm = (
    url: string,
    method: "POST" | "PUT",
    token: string,
    form: FormData
): Promise<{ status: number; ok: boolean; text: string }> =>
    new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("ngrok-skip-browser-warning", "true");
        xhr.timeout = 60000;
        xhr.onload = () =>
            resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, text: xhr.responseText });
        xhr.onerror = () => reject(new Error("Network request failed"));
        xhr.ontimeout = () => reject(new Error("Request timed out"));
        xhr.send(form as any);
    });