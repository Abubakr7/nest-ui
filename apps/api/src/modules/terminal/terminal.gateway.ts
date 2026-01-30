import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TerminalService } from './terminal.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: 'terminal',
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly terminalService: TerminalService) {}

  handleConnection(client: Socket) {
    console.log(`Terminal client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Terminal client disconnected: ${client.id}`);
    this.terminalService.closeTerminal(client.id);
  }

  @SubscribeMessage('terminal:create')
  handleCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; cols?: number; rows?: number },
  ) {
    const terminal = this.terminalService.createTerminal(
      client.id,
      data.projectId,
      data.cols || 80,
      data.rows || 24,
    );

    if (terminal) {
      terminal.onData((output: string) => {
        client.emit('terminal:output', { data: output });
      });

      terminal.onExit(({ exitCode }: { exitCode: number }) => {
        client.emit('terminal:exit', { exitCode });
      });

      client.emit('terminal:created', { success: true });
    } else {
      client.emit('terminal:error', { message: 'Failed to create terminal' });
    }
  }

  @SubscribeMessage('terminal:input')
  handleInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { input: string },
  ) {
    this.terminalService.writeToTerminal(client.id, data.input);
  }

  @SubscribeMessage('terminal:resize')
  handleResize(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { cols: number; rows: number },
  ) {
    this.terminalService.resizeTerminal(client.id, data.cols, data.rows);
  }

  @SubscribeMessage('terminal:close')
  handleClose(@ConnectedSocket() client: Socket) {
    this.terminalService.closeTerminal(client.id);
    client.emit('terminal:closed', { success: true });
  }
}
