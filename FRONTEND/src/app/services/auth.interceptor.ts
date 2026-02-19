import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clona la petición y le añade el permiso para enviar Cookies
    const modifiedReq = request.clone({
      withCredentials: true 
    });
    return next.handle(modifiedReq);
  }
}