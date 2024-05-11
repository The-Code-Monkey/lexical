import { type ChangeEvent, type JSX, useCallback } from "react";

interface Props {
  accept?: string;
  "data-test-id"?: string;
  label: string;
  onChange: (files: FileList | null) => void;
}

const FileInput = ({
  accept,
  "data-test-id": dataTestId,
  label,
  onChange,
}: Props): JSX.Element => {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.files);
    },
    [onChange],
  );

  return (
    <div className="Input__wrapper">
      <label className="Input__label">{label}</label>
      <input
        accept={accept}
        className="Input__input"
        data-test-id={dataTestId}
        onChange={handleChange}
        type="file"
      />
    </div>
  );
};

export default FileInput;
