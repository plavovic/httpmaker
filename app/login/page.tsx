"use client";

import { signIn } from "next-auth/react";
import Button from "@/components/Button";
import styles from "./login.module.css";

export default function LoginPage() {
  async function handleGitHubLogin() {
    await signIn("github", {
      callbackUrl: "/dashboard",
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.formContainer}>
        <h1 className={styles.title}>Login</h1>

        <p className={styles.description}>
          Sign in to continue building your website with HTTPMAKER.
        </p>

        <form
          className={styles.credentialsForm}
          onSubmit={(event) => event.preventDefault()}
        >
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password"
              required
            />
          </div>

          <Button text="SIGN UP" type="submit" fullWidth />
        </form>

        <div className={styles.socialMessage}>
          <div className={styles.line} />
          <p className={styles.message}>Continue with</p>
          <div className={styles.line} />
        </div>

        <div className={styles.socialButtons}>
          <button
            type="button"
            className={styles.socialButton}
            onClick={handleGitHubLogin}
          >
            <GitHubIcon />
            <span>Continue with GitHub</span>
          </button>
        </div>

        <p className={styles.terms}>
          By continuing, you agree to HTTPMAKER&apos;s terms and privacy policy.
        </p>
      </section>
    </main>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M16 .396c-8.839 0-16 7.167-16 16 0 7.073 4.584 13.068 10.937 15.183.803.151 1.093-.344 1.093-.772 0-.38-.009-1.385-.015-2.719-4.453.964-5.391-2.151-5.391-2.151-.729-1.844-1.781-2.339-1.781-2.339-1.448-.989.115-.968.115-.968 1.604.109 2.448 1.645 2.448 1.645 1.427 2.448 3.744 1.74 4.661 1.328.14-1.031.557-1.74 1.011-2.135-3.552-.401-7.287-1.776-7.287-7.907 0-1.751.62-3.177 1.645-4.297-.177-.401-.719-2.031.141-4.235 0 0 1.339-.427 4.4 1.641 1.281-.355 2.641-.532 4-.541 1.36.009 2.719.187 4 .541 3.043-2.068 4.381-1.641 4.381-1.641.859 2.204.317 3.833.161 4.235 1.015 1.12 1.635 2.547 1.635 4.297 0 6.145-3.74 7.5-7.296 7.891.556.479 1.077 1.464 1.077 2.959 0 2.14-.02 3.864-.02 4.385 0 .416.28.916 1.104.755C27.421 29.459 32 23.459 32 16.396 32 7.563 24.839.396 16 .396z" />
    </svg>
  );
}
