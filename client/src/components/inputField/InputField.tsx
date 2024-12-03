import { formGroup, iconBox, inputBox, inputContainer } from "./InputField.style";

interface InputFieldProps {
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  Icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  isError?: boolean;
}

export const InputField = ({
  type,
  name,
  value,
  onChange,
  placeholder,
  Icon,
  isError,
}: InputFieldProps) => (
  <div className={formGroup}>
    <div className={`${inputContainer} ${isError ? "bd_1px_solid_red bdr_sm" : ""}`}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={inputBox}
        placeholder={placeholder}
        required
      />
    </div>
    {Icon && <Icon className={`${iconBox} ${isError ? "c_red" : ""}`} />}
  </div>
);
