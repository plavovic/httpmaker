import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main>
      <h1>Sign in to HTTPMAKER</h1>

      <form
        action={async () => {
          "use server";

          await signIn("google", {
            redirectTo: "/dashboard",
          });
        }}
      >
        <button type="submit">
          Continue with Google
        </button>
      </form>

      <form
        action={async () => {
          "use server";

          await signIn("github", {
            redirectTo: "/dashboard",
          });
        }}
      >
        <button type="submit">
          Continue with GitHub
        </button>
      </form>
    </main>
  );
}