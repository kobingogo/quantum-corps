import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const auth = client.handshake.auth.token || client.handshake.headers.authorization;
    
    if (!auth) {
      return false;
    }

    const token = auth.replace('Bearer ', '');
    
    try {
      const payload = this.jwtService.verify(token);
      client.user = payload;
      return true;
    } catch (e) {
      return false;
    }
  }
}
