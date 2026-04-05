"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login, isLoginPending, loginError } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  const errorMessage =
    loginError instanceof Error ? loginError.message : "Error al iniciar sesión"

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Inicia sesión</h1>
        <p className="text-muted-foreground">
          Accede a tu cuenta para continuar
        </p>
      </div>

      {loginError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoginPending}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoginPending}
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoginPending}>
        {isLoginPending ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">¿No tienes cuenta? </span>
        <Link href="/register" className="text-primary hover:underline font-medium">
          Regístrate aquí
        </Link>
      </div>
    </form>
  )
}
