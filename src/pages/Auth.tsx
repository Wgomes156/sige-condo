import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import logoPsc from "@/assets/logo-psc.png";
import { Building2, Shield, Users, Loader2, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { PasswordStrength } from "@/components/ui/password-strength";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

type AuthView = "login" | "forgot-password" | "reset-password";

const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const tabContentVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState(false);
  const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  // Watch signup form values for real-time validation feedback
  const signupValues = signupForm.watch();
  const signupErrors = signupForm.formState.errors;
  const signupTouched = signupForm.formState.touchedFields;

  // Helper function to get field validation status
  const getFieldStatus = (fieldName: keyof SignupFormData) => {
    const value = signupValues[fieldName];
    const error = signupErrors[fieldName];
    const touched = signupTouched[fieldName];
    
    if (!value || value.length === 0) return "empty";
    if (error) return "error";
    if (touched || value.length > 0) {
      // Additional validation checks
      if (fieldName === "nome" && value.length >= 2) return "valid";
      if (fieldName === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "valid";
      if (fieldName === "password" && value.length >= 6) return "valid";
      if (fieldName === "confirmPassword" && value === signupValues.password && value.length >= 6) return "valid";
    }
    return "empty";
  };

  // Get input styles based on validation status
  const getInputStyles = (fieldName: keyof SignupFormData) => {
    const status = getFieldStatus(fieldName);
    const isShaking = shakeFields[fieldName];
    const baseStyles = "pl-10 pr-10 h-11 bg-background transition-all duration-200";
    const shakeClass = isShaking ? "animate-shake" : "";
    
    switch (status) {
      case "valid":
        return `${baseStyles} ${shakeClass} border-green-500 focus:border-green-500 focus:ring-green-500/20`;
      case "error":
        return `${baseStyles} ${shakeClass} border-destructive focus:border-destructive focus:ring-destructive/20`;
      default:
        return `${baseStyles} ${shakeClass} border-input focus:border-primary focus:ring-primary`;
    }
  };

  // Trigger shake animation on fields with errors
  const triggerShakeOnErrors = () => {
    const errors = signupForm.formState.errors;
    const fieldsToShake: Record<string, boolean> = {};
    
    (Object.keys(errors) as Array<keyof SignupFormData>).forEach((field) => {
      fieldsToShake[field] = true;
    });
    
    setShakeFields(fieldsToShake);
    
    // Remove shake after animation completes
    setTimeout(() => {
      setShakeFields({});
    }, 500);
  };

  // Render validation icon
  const renderValidationIcon = (fieldName: keyof SignupFormData) => {
    const status = getFieldStatus(fieldName);
    
    if (status === "valid") {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Check className="h-4 w-4 text-green-500" />
        </div>
      );
    }
    if (status === "error") {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <X className="h-4 w-4 text-destructive" />
        </div>
      );
    }
    return null;
  };

  // Render validation icon for password fields (needs special handling due to eye toggle)
  const renderPasswordValidationIcon = (fieldName: keyof SignupFormData, showPassword: boolean, toggleShow: () => void) => {
    const status = getFieldStatus(fieldName);
    
    return (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {status === "valid" && <Check className="h-4 w-4 text-green-500" />}
        {status === "error" && <X className="h-4 w-4 text-destructive" />}
        <button
          type="button"
          onClick={toggleShow}
          className="text-muted-foreground hover:text-foreground transition-colors ml-1"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  };

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const newPasswordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check if this is a password recovery redirect
    const type = searchParams.get("type");
    if (type === "recovery") {
      setAuthView("reset-password");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user && authView !== "reset-password") {
      navigate("/");
    }
  }, [user, loading, navigate, authView]);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signUp(data.email, data.password, data.nome);
      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("Este e-mail já está cadastrado");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Conta criada com sucesso! Você já pode fazer login.");
        signupForm.reset();
      }
    } catch (error) {
      toast.error("Erro ao criar conta");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle signup form submission with shake on errors
  const handleSignupSubmit = signupForm.handleSubmit(handleSignup, () => {
    triggerShakeOnErrors();
  });

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await resetPassword(data.email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        forgotPasswordForm.reset();
        setAuthView("login");
      }
    } catch (error) {
      toast.error("Erro ao enviar e-mail de recuperação");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewPassword = async (data: NewPasswordFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(data.password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Senha atualizada com sucesso!");
        newPasswordForm.reset();
        // Após atualizar a senha, redirecionar para a página principal
        // O usuário já está autenticado após o recovery
        navigate("/");
      }
    } catch (error) {
      toast.error("Erro ao atualizar senha");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          <span className="text-primary-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  const renderAuthContent = () => {
    if (authView === "forgot-password") {
      return (
        <motion.div
          key="forgot-password"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeVariants}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Esqueceu a senha?</h2>
            <p className="text-muted-foreground mt-1">
              Digite seu e-mail para receber o link de recuperação
            </p>
          </div>

          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-5">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10 h-11 bg-background border-input focus:border-primary focus:ring-primary"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg shadow-secondary/25 transition-all hover:shadow-xl hover:shadow-secondary/30"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setAuthView("login")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Button>
            </form>
          </Form>
        </motion.div>
      );
    }

    if (authView === "reset-password") {
      return (
        <motion.div
          key="reset-password"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeVariants}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Nova senha</h2>
            <p className="text-muted-foreground mt-1">
              Digite sua nova senha para recuperar o acesso
            </p>
          </div>

          <Form {...newPasswordForm}>
            <form onSubmit={newPasswordForm.handleSubmit(handleNewPassword)} className="space-y-5">
              <FormField
                control={newPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Nova senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11 bg-background border-input focus:border-primary focus:ring-primary"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <PasswordStrength password={field.value} className="mt-2" />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Confirmar nova senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showNewConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11 bg-background border-input focus:border-primary focus:ring-primary"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg shadow-secondary/25 transition-all hover:shadow-xl hover:shadow-secondary/30"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar senha"
                )}
              </Button>
            </form>
          </Form>
        </motion.div>
      );
    }

    return (
      <motion.div
        key="login-tabs"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeVariants}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Bem-vindo!</h2>
          <p className="text-muted-foreground mt-1">Acesse sua conta para continuar</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              Entrar
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              Cadastrar
            </TabsTrigger>
          </TabsList>

          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "login" && (
                <motion.div
                  key="login-form"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={tabContentVariants}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <TabsContent value="login" className="mt-0" forceMount>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">E-mail</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="pl-10 h-11 bg-background border-input focus:border-primary focus:ring-primary"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-foreground">Senha</FormLabel>
                                <button
                                  type="button"
                                  onClick={() => setAuthView("forgot-password")}
                                  className="text-sm text-secondary hover:text-secondary/80 font-medium transition-colors"
                                >
                                  Esqueceu a senha?
                                </button>
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type={showLoginPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 h-11 bg-background border-input focus:border-primary focus:ring-primary"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg shadow-secondary/25 transition-all hover:shadow-xl hover:shadow-secondary/30"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Entrando...
                            </>
                          ) : (
                            "Entrar"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </motion.div>
              )}

              {activeTab === "signup" && (
                <motion.div
                  key="signup-form"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={tabContentVariants}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <TabsContent value="signup" className="mt-0" forceMount>
                    <Form {...signupForm}>
                      <form onSubmit={handleSignupSubmit} className="space-y-4">
                        <FormField
                          control={signupForm.control}
                          name="nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-2">
                                Nome completo
                                {getFieldStatus("nome") === "valid" && (
                                  <span className="text-xs text-green-500 font-normal">✓ Válido</span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Seu nome"
                                    className={getInputStyles("nome")}
                                    {...field}
                                  />
                                  {renderValidationIcon("nome")}
                                </div>
                              </FormControl>
                              <FormMessage className="text-destructive animate-in fade-in slide-in-from-top-1 duration-200" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={signupForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-2">
                                E-mail
                                {getFieldStatus("email") === "valid" && (
                                  <span className="text-xs text-green-500 font-normal">✓ Válido</span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    className={getInputStyles("email")}
                                    {...field}
                                  />
                                  {renderValidationIcon("email")}
                                </div>
                              </FormControl>
                              <FormMessage className="text-destructive animate-in fade-in slide-in-from-top-1 duration-200" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={signupForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-2">
                                Senha
                                {getFieldStatus("password") === "valid" && (
                                  <span className="text-xs text-green-500 font-normal">✓ Válido</span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type={showSignupPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={`${getInputStyles("password")} pr-16`}
                                    {...field}
                                  />
                                  {renderPasswordValidationIcon("password", showSignupPassword, () => setShowSignupPassword(!showSignupPassword))}
                                </div>
                              </FormControl>
                              <PasswordStrength password={field.value} className="mt-2" />
                              <FormMessage className="text-destructive animate-in fade-in slide-in-from-top-1 duration-200" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={signupForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-2">
                                Confirmar senha
                                {getFieldStatus("confirmPassword") === "valid" && (
                                  <span className="text-xs text-green-500 font-normal">✓ Senhas coincidem</span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type={showSignupConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={`${getInputStyles("confirmPassword")} pr-16`}
                                    {...field}
                                  />
                                  {renderPasswordValidationIcon("confirmPassword", showSignupConfirmPassword, () => setShowSignupConfirmPassword(!showSignupConfirmPassword))}
                                </div>
                              </FormControl>
                              <FormMessage className="text-destructive animate-in fade-in slide-in-from-top-1 duration-200" />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg shadow-secondary/25 transition-all hover:shadow-xl hover:shadow-secondary/30"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cadastrando...
                            </>
                          ) : (
                            "Criar conta"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Theme Toggle - Top Right Corner */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-[hsl(210,60%,15%)] dark:from-[hsl(210,60%,12%)] dark:via-[hsl(210,55%,10%)] dark:to-[hsl(210,60%,6%)] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="bg-white rounded-2xl p-4 w-fit shadow-2xl">
              <img src={logoPsc} alt="Manage Condo" className="h-16 w-auto" />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl xl:text-5xl font-bold text-[hsl(35,92%,55%)] mb-2 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Manage Condo
          </motion.h1>
          <motion.p 
            className="text-lg text-primary-foreground/70 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Sistema de Gestão de Condomínio
          </motion.p>
          
          <motion.p 
            className="text-primary-foreground/80 text-lg mb-12 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            Simplifique a administração do seu condomínio com nossa plataforma completa e intuitiva.
          </motion.p>

          {/* Features */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Gestão Completa</h3>
                <p className="text-primary-foreground/70 text-sm">Controle total de unidades e moradores</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Seguro e Confiável</h3>
                <p className="text-primary-foreground/70 text-sm">Seus dados protegidos com criptografia</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Atendimento Ágil</h3>
                <p className="text-primary-foreground/70 text-sm">Suporte dedicado à sua administração</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-b from-muted/30 to-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div 
            className="lg:hidden mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-block bg-white rounded-2xl p-4 shadow-lg mb-4">
              <img src={logoPsc} alt="Manage Condo" className="h-12 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-[hsl(35,92%,55%)]">Manage Condo</h1>
            <p className="text-muted-foreground">Sistema de Gestão de Condomínios</p>
          </motion.div>

          <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {renderAuthContent()}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 space-y-1">
            <a 
              href="https://pscadmcondominio.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-secondary hover:text-secondary/80 font-medium transition-colors"
            >
              pscadmcondominio.com
            </a>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Manage Condo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
