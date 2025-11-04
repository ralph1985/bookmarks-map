import { ChangeEvent } from "react";

type Props = {
  onFileSelected: (file: File) => void;
  accept?: string;
  label?: string;
};

export function FilePicker({ onFileSelected, accept, label }: Props) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1.25rem",
        borderRadius: "0.75rem",
        backgroundColor: "#2563eb",
        color: "white",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.95rem"
      }}
    >
      {label ?? "Selecciona archivo"}
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </label>
  );
}
