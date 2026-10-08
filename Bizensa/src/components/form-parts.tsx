import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { C, themedStyles } from "@/constants/theme";

/** Kept for old imports. It is the live theme palette, so it follows light/dark. */
export const FC = C;

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      {children}
    </View>
);

export const ScreenHeader = ({ title }: { title: string }) => {
  const router = useRouter();
  return (
      <View style={formStyles.topBar}>
        <TouchableOpacity style={formStyles.back} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </TouchableOpacity>
        <Text style={formStyles.title}>{title}</Text>
      </View>
  );
};

export const SelectModal = ({
                              visible,
                              title,
                              options,
                              selected,
                              onSelect,
                              onClose,
                            }: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={formStyles.backdrop} onPress={onClose}>
        <Pressable style={formStyles.sheet} onPress={() => {}}>
          <Text style={formStyles.sheetTitle}>{title}</Text>
          {options.map((o) => (
              <TouchableOpacity
                  key={o}
                  style={formStyles.option}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(o);
                    onClose();
                  }}
              >
                <Text style={[formStyles.optionText, o === selected && { color: C.purpleSoft }]}>{o}</Text>
                {o === selected && <Ionicons name="checkmark" size={18} color={C.purpleSoft} />}
              </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
);

export const formStyles = themedStyles((C) => StyleSheet.create({
  topBar: { height: 52, alignItems: "center", justifyContent: "center" },
  back: { position: "absolute", left: 14 },
  title: { color: C.text, fontSize: 18, fontWeight: "600" },

  field: { marginBottom: 18 },
  label: { color: C.text, fontSize: 14, fontWeight: "600", marginBottom: 8 },

  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputText: { color: C.text, fontSize: 15, flex: 1 },
  prefix: { color: C.text, fontSize: 15, marginRight: 6 },
  textArea: { minHeight: 90, alignItems: "flex-start", paddingTop: 14, color: C.text, fontSize: 15 },

  doneBtn: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 4 },
  doneText: { color: C.purpleSoft, fontSize: 15, fontWeight: "600" },

  saveBtn: {
    marginTop: 12,
    height: 54,
    borderRadius: 14,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  backdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: "center", padding: 28 },
  sheet: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 8,
  },
  sheetTitle: { color: C.muted, fontSize: 13, paddingHorizontal: 18, paddingVertical: 10 },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  optionText: { color: C.text, fontSize: 15 },
}));
