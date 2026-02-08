import { useCheckAuth } from "@/api/endpoints/auth";

function HomePage() {
  const { data } = useCheckAuth();
  console.log("check auth data:", data);

  return <button className="btn">Button</button>;
}

export default HomePage;
