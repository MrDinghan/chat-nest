import type { FC, InputHTMLAttributes, ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: ReactNode;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  rightSlot?: ReactNode;
}

const AuthInput: FC<AuthInputProps> = ({
  label,
  icon,
  error,
  registration,
  rightSlot,
  ...inputProps
}) => {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">{label}</span>
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input
          className={`input input-bordered w-full pl-10 ${error ? "input-error" : ""}`}
          {...inputProps}
          {...registration}
        />
        {rightSlot}
      </div>
      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error.message}</span>
        </label>
      )}
    </div>
  );
};

export default AuthInput;
