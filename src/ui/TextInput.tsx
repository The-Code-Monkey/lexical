import {
  type ChangeEvent,
  type HTMLInputTypeAttribute,
  type JSX,
  useCallback,
} from "react";

type Props = Readonly<{
  "data-test-id"?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  value: string;
}>;

const TextInput = ({
  "data-test-id": dataTestId,
  label,
  onChange,
  placeholder = "",
  type = "text",
  value,
}: Props): JSX.Element => {
  const handleOnChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.value);
    },
    [onChange],
  );

  return (
    <div className="Input__wrapper">
      <label className="Input__label">{label}</label>
      <input
        className="Input__input"
        data-test-id={dataTestId}
        onChange={handleOnChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
};

export default TextInput;
