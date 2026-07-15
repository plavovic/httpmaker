import type { EditorTab } from "@/components/editor/EditorToolbar";

const editorTabs: Array<{ id: EditorTab; label: string }> = [
  { id: "ai", label: "AI" },
  { id: "layers", label: "Layers" },
  { id: "design", label: "Design" },
  { id: "theme", label: "Theme" },
  { id: "properties", label: "Properties" },
];

type EditorTabsProps = {
  value: EditorTab;
  onChange: (tab: EditorTab) => void;
};

export default function EditorTabs({ value, onChange }: EditorTabsProps) {
  const selectedIndex = Math.max(0, editorTabs.findIndex((tab) => tab.id === value));

  return (
    <div
      className="editor-tabs"
      role="radiogroup"
      aria-label="Editor panels"
      style={{ "--editor-tab-index": selectedIndex } as React.CSSProperties}
    >
      <span className="editor-tabs-indicator" aria-hidden="true" />
      {editorTabs.map((tab) => (
        <label className="editor-tabs-option" key={tab.id}>
          <input
            type="radio"
            name="editor-panel"
            value={tab.id}
            checked={value === tab.id}
            onChange={() => onChange(tab.id)}
          />
          <span>{tab.label}</span>
        </label>
      ))}
    </div>
  );
}
