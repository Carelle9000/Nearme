import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';

// Rate limiting sur tous les endpoints de ce controller :
// 5 requêtes par 60 secondes par IP — protège contre le brute force.
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // POST /auth/register
  @Post('register')
  register(@Body() body: any) {
    return this.auth.register(body);
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(200)
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  // POST /auth/refresh
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: { refresh_token: string }) {
    return this.auth.refresh(body.refresh_token);
  }

  // POST /auth/google
  // Reçoit l'idToken Google, le vérifie côté serveur, crée/retrouve l'utilisateur.
  @Post('google')
  @HttpCode(200)
  loginWithGoogle(@Body() body: { id_token: string }) {
    return this.auth.loginWithGoogle(body.id_token);
  }

  // POST /auth/apple
  // Reçoit l'identityToken Apple, le vérifie via JWKS Apple, crée/retrouve l'utilisateur.
  @Post('apple')
  @HttpCode(200)
  loginWithApple(
    @Body() body: { identity_token: string; email?: string; name?: string },
  ) {
    return this.auth.loginWithApple(body.identity_token, body.email, body.name);
  }

  // POST /auth/forgot-password
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() body: { email: string }) {
    return this.auth.forgotPassword(body.email);
  }
}
