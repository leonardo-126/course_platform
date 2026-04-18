import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Award,
  Clock,
  GraduationCap,
  LifeBuoy,
  Sparkles,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";

const stats = [
  { value: "12k+", labelKey: "home.stats.students" },
  { value: "240+", labelKey: "home.stats.courses" },
  { value: "85+", labelKey: "home.stats.instructors" },
  { value: "4.9/5", labelKey: "home.stats.rating" },
];

const features = [
  {
    icon: GraduationCap,
    titleKey: "home.features.expertTitle",
    descriptionKey: "home.features.expertDescription",
  },
  {
    icon: Wrench,
    titleKey: "home.features.projectsTitle",
    descriptionKey: "home.features.projectsDescription",
  },
  {
    icon: Clock,
    titleKey: "home.features.paceTitle",
    descriptionKey: "home.features.paceDescription",
  },
  {
    icon: Award,
    titleKey: "home.features.certificateTitle",
    descriptionKey: "home.features.certificateDescription",
  },
  {
    icon: Users,
    titleKey: "home.features.communityTitle",
    descriptionKey: "home.features.communityDescription",
  },
  {
    icon: LifeBuoy,
    titleKey: "home.features.supportTitle",
    descriptionKey: "home.features.supportDescription",
  },
];

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-24 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/10 via-background to-background px-6 py-16 ring-1 ring-foreground/10 sm:px-12 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            {t("home.badge")}
          </span>

          <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {t("home.title")}
          </h1>

          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t("home.description")}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                {t("home.ctaPrimary")}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/courses">
              <Button size="lg" variant="outline">
                {t("home.ctaSecondary")}
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span>4.9 / 5 — 2.300+ reviews</span>
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-6 rounded-2xl border bg-card px-6 py-10 sm:grid-cols-4 sm:px-12">
          {stats.map(stat => (
            <div key={stat.labelKey} className="text-center">
              <div className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-xs text-muted-foreground sm:text-sm">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("home.features.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("home.features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.titleKey}
                className="transition-all hover:-translate-y-1 hover:ring-foreground/20"
              >
                <CardHeader>
                  <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">
                    {t(feature.titleKey)}
                  </CardTitle>
                  <CardDescription>
                    {t(feature.descriptionKey)}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <Card className="overflow-hidden bg-linear-to-br from-primary to-primary/80 text-primary-foreground ring-0">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-12">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("home.cta.title")}
            </h2>
            <p className="max-w-xl text-primary-foreground/80">
              {t("home.cta.description")}
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                {t("home.cta.button")}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
