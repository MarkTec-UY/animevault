"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function RegisterForm() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const { register, isRegisterPending, registerError } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== passwordConfirmation) {
      alert("Las contraseñas no coinciden")
      return
    }
    register({
      username,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
  }

  const errorMessage =
    registerError instanceof Error ? registerError.message : "Error al registrarse"

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Crear cuenta</h1>
        <p className="text-muted-foreground">
          Regístrate para acceder a AnimeVault
        </p>
      </div>

      {registerError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          id="username"
          type="text"
          placeholder="JoseVCF"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isRegisterPending}
          autoComplete="username"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isRegisterPending}
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
          disabled={isRegisterPending}
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password-confirmation">Confirmar contraseña</Label>
        <Input
          id="password-confirmation"
          type="password"
          placeholder="••••••••"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          required
          disabled={isRegisterPending}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isRegisterPending}>
        {isRegisterPending ? "Creando cuenta..." : "Registrarse"}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
        <Link href="/login" className="text-primary hover:underline font-medium">
          Inicia sesión aquí
        </Link>
      </div>
    </form>
  )
}
