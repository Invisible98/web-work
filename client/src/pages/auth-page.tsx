import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MinecraftButton } from "@/components/ui/minecraft-button";
import { Loader2, User, Lock, ShieldQuestion, Box } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "", role: "user" });
  const [registerData, setRegisterData] = useState({ username: "", password: "", role: "user" });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Box className="h-24 w-24 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              </div>
            </div>
            <h1 className="font-pixel text-4xl mb-4 text-primary">
              Minecraft Bot Manager
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Professional bot management system for Minecraft servers
            </p>
          </div>

          <div className="space-y-6 glass-card p-6 rounded-lg border">
            <h3 className="font-pixel text-lg text-primary">Features</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Multi-bot management</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Real-time monitoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>AI command parsing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Auto-reconnection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Role-based access</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Mobile responsive</span>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Demo Credentials:</p>
            <p><strong>Admin:</strong> admin / admin123</p>
            <p><strong>User:</strong> user / user123</p>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="glass-card border-primary">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <Box className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="font-pixel text-xl text-primary">
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="font-pixel text-xs">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="font-pixel text-xs">
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label htmlFor="login-username" className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter username"
                      value={loginData.username}
                      onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-muted border-border focus:border-primary"
                      data-testid="input-login-username"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-muted border-border focus:border-primary"
                      data-testid="input-login-password"
                      required
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <ShieldQuestion className="h-4 w-4" />
                      Role
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <MinecraftButton
                        type="button"
                        variant={loginData.role === "admin" ? "primary" : "secondary"}
                        onClick={() => setLoginData(prev => ({ ...prev, role: "admin" }))}
                        data-testid="button-role-admin"
                      >
                        Admin
                      </MinecraftButton>
                      <MinecraftButton
                        type="button"
                        variant={loginData.role === "user" ? "primary" : "secondary"}
                        onClick={() => setLoginData(prev => ({ ...prev, role: "user" }))}
                        data-testid="button-role-user"
                      >
                        User
                      </MinecraftButton>
                    </div>
                  </div>

                  <MinecraftButton
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </MinecraftButton>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-6">
                  <div>
                    <Label htmlFor="register-username" className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-muted border-border focus:border-primary"
                      data-testid="input-register-username"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-password" className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Choose password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-muted border-border focus:border-primary"
                      data-testid="input-register-password"
                      required
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <ShieldQuestion className="h-4 w-4" />
                      Role
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <MinecraftButton
                        type="button"
                        variant={registerData.role === "admin" ? "primary" : "secondary"}
                        onClick={() => setRegisterData(prev => ({ ...prev, role: "admin" }))}
                        data-testid="button-register-role-admin"
                      >
                        Admin
                      </MinecraftButton>
                      <MinecraftButton
                        type="button"
                        variant={registerData.role === "user" ? "primary" : "secondary"}
                        onClick={() => setRegisterData(prev => ({ ...prev, role: "user" }))}
                        data-testid="button-register-role-user"
                      >
                        User
                      </MinecraftButton>
                    </div>
                  </div>

                  <MinecraftButton
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-register-submit"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register'
                    )}
                  </MinecraftButton>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
