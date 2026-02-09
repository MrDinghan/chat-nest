import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate } from "react-router-dom";

import { useLogin } from "@/api/endpoints/auth";
import AuthImagePattern from "@/components/AuthImagePattern";
import AuthInput from "@/components/AuthInput";
import useAuthStore from "@/stores/useAuthStore";

interface FormData {
  email: string;
  password: string;
}

const LoginPage: FC = () => {
  const { authUser, setAuthUser } = useAuthStore();
  const { mutate: login, isPending: isLoggingIn } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (data: FormData) => {
    login(
      {
        data,
      },
      {
        onSuccess: (authData) => {
          setAuthUser(authData);
          toast.success("Logged in successfully!");
        },
      },
    );
  };

  if (authUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AuthInput
              label="Email"
              icon={<Mail className="size-5 text-base-content/40" />}
              type="email"
              placeholder="you@example.com"
              error={errors.email}
              registration={register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              })}
            />

            <AuthInput
              label="Password"
              icon={<Lock className="size-5 text-base-content/40" />}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.password}
              registration={register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              rightSlot={
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              }
            />

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Don't have an account? &nbsp;
              <Link to="/signup" className="link link-primary">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* right side */}
      <AuthImagePattern
        title="Welcome back!"
        subtitle="Sign in to continue your conversations and catch up with your messages."
      />
    </div>
  );
};

export default LoginPage;
