import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

const requirements = [
  { label: "Mínimo 6 caracteres", test: (p: string) => p.length >= 6 },
  { label: "Letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Número", test: (p: string) => /\d/.test(p) },
  { label: "Caractere especial", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: "", color: "bg-muted", bgColor: "bg-muted/30" };
  }

  const passed = requirements.filter((req) => req.test(password)).length;
  const score = Math.min(passed, 4);

  switch (score) {
    case 0:
    case 1:
      return { score: 1, label: "Fraca", color: "bg-destructive", bgColor: "bg-destructive/20" };
    case 2:
      return { score: 2, label: "Razoável", color: "bg-orange-500", bgColor: "bg-orange-500/20" };
    case 3:
      return { score: 3, label: "Boa", color: "bg-yellow-500", bgColor: "bg-yellow-500/20" };
    case 4:
    case 5:
      return { score: 4, label: "Forte", color: "bg-green-500", bgColor: "bg-green-500/20" };
    default:
      return { score: 0, label: "", color: "bg-muted", bgColor: "bg-muted/30" };
  }
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);
  const passedRequirements = useMemo(
    () => requirements.map((req) => ({ ...req, passed: req.test(password) })),
    [password]
  );

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Força da senha</span>
          <span
            className={cn(
              "font-medium",
              strength.score === 1 && "text-destructive",
              strength.score === 2 && "text-orange-500",
              strength.score === 3 && "text-yellow-600",
              strength.score === 4 && "text-green-600"
            )}
          >
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                level <= strength.score ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {passedRequirements.map((req) => (
          <div key={req.label} className="flex items-center gap-1.5 text-xs">
            {req.passed ? (
              <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
            )}
            <span
              className={cn(
                "transition-colors",
                req.passed ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
