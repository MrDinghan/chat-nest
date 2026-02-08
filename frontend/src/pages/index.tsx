import { useLogin } from "@/api/endpoints/auth";

function HomePage() {
  const { data, mutate: login } = useLogin();
  console.log("email:", data?.email);

  return (
    <button
      className="btn"
      onClick={() =>
        login({
          data: { email: "user@example.com", password: "psw123" },
        })
      }
    >
      Button
    </button>
  );
}

export default HomePage;
