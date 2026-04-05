import { Button } from "@/Components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/Components/ui/field";
import { Input } from "@/Components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { t } = useTranslation();

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center border-gray-100">
          <h1 className="text-2xl font-bold">{t("signup.title")}</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("signup.description")}
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="name">{t("signup.name")}</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder={t("signup.namePlaceholder")}
            required
            className="bg-background"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">{t("signup.email")}</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            className="bg-background"
          />
          <FieldDescription>{t("signup.emailDescription")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">{t("signup.password")}</FieldLabel>
          <Input
            id="password"
            type="password"
            required
            className="bg-background"
          />
          <FieldDescription>{t("signup.passwordDescription")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">
            {t("signup.confirmPassword")}
          </FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            required
            className="bg-background"
          />
          <FieldDescription>
            {t("signup.confirmPasswordDescription")}
          </FieldDescription>
        </Field>
        <Field>
          <Button type="submit">{t("signup.submit")}</Button>
        </Field>
        <FieldSeparator>{t("signup.orContinueWith")}</FieldSeparator>
        <Field>
          <FieldDescription className="px-6 text-center">
            {t("signup.hasAccount")}{" "}
            <Link to="/login" className="underline underline-offset-4">
              {t("signup.loginLink")}
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
