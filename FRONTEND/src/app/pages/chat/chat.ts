import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Message } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() friend: any;
  @Input() myId: number = 0;
  @Output() close = new EventEmitter<void>();

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: Message[] = [];
  newMessage: string = '';
  private intervalId: any;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.loadMessages();
    this.intervalId = setInterval(() => this.loadMessages(), 3000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadMessages() {
    if (!this.friend || !this.myId) return;

    this.chatService.getConversation(this.myId, this.friend.id).subscribe({
      next: (msgs) => {
        this.messages = msgs;
      },
      error: (err) => console.error('Error cargando mensajes', err)
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    const text = this.newMessage;
    this.newMessage = '';

    this.chatService.sendMessage(this.myId, this.friend.id, text).subscribe({
      next: () => this.loadMessages(),
      error: (err) => console.error('Error enviando mensaje', err)
    });
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}