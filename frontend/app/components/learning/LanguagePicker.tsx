"use client";

import { useAppState } from "@/lib/context/AppStateContext";

/**
 * Language selection UI (Roadmap Phase 18F). Persists the choice in the
 * Phase 14F global state so it's available app-wide. Generated lessons
 * (backend Phase 18) are English-only until the multilingual script layer
 * (backend Phase 20) exists - this just wires up the picker and the
 * app-wide selection ahead of that.
 */
export default function LanguagePicker() {
  const { languages, selectedLanguageId, setSelectedLanguageId } = useAppState();

  if (languages.length === 0) {
    return null;
  }

  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#2b2d5c" }}>
      Language
      <select
        value={selectedLanguageId ?? ""}
        onChange={(event) => setSelectedLanguageId(event.target.value || null)}
        style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #ccc" }}
      >
        <option value="">Default</option>
        {languages.map((language) => (
          <option key={language.id} value={language.id}>
            {language.native_name} ({language.name})
          </option>
        ))}
      </select>
    </label>
  );
}
